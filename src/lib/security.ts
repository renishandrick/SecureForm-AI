import puppeteer from 'puppeteer';
import { SecurityCheckResult, SecurityLog } from '../types';
import { saveSecurityLog } from './store';
import crypto from 'crypto';

// Threat Intelligence API implementations
async function checkGoogleSafeBrowsing(url: string, apiKey: string): Promise<{ safe: boolean, signals: string[] }> {
  try {
    const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: "omniguard", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      })
    });
    const data = await response.json();
    if (data.matches && data.matches.length > 0) {
      const threats = data.matches.map((m: any) => m.threatType).join(", ");
      return { safe: false, signals: [`Google Safe Browsing flagged as: ${threats}`] };
    }
    return { safe: true, signals: ["Google Safe Browsing: No threats detected"] };
  } catch (error: any) {
    console.error("Safe Browsing API Error", error);
    return { safe: true, signals: ["Google Safe Browsing check failed"] };
  }
}

async function checkVirusTotal(url: string, apiKey: string): Promise<{ classification: "safe" | "suspicious" | "unsafe", signals: string[] }> {
  try {
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': apiKey }
    });
    
    if (response.status === 404) {
      return { classification: "safe", signals: ["VirusTotal: No historical data for this URL"] };
    }
    
    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats;
    if (stats) {
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      if (malicious > 0) {
        return { classification: "unsafe", signals: [`VirusTotal: ${malicious} security vendors flagged this URL as malicious`] };
      }
      if (suspicious > 0) {
        return { classification: "suspicious", signals: [`VirusTotal: ${suspicious} security vendors flagged this URL as suspicious`] };
      }
      return { classification: "safe", signals: ["VirusTotal: Clean"] };
    }
    return { classification: "safe", signals: ["VirusTotal: Analysis data unavailable"] };
  } catch (error: any) {
    console.error("VirusTotal API Error", error);
    return { classification: "safe", signals: ["VirusTotal check failed"] };
  }
}

async function checkGeminiSecurity(textContent: string, apiKey: string): Promise<{ signals: string[], classification: "safe" | "suspicious" | "unsafe" }> {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are a cybersecurity expert. Analyze the following text extracted from a job/internship application form.
      Look for:
      1. Aggressive social engineering tactics (extreme urgency, threats).
      2. Suspicious data collection (asking for Social Security Numbers, banking details, passwords on an initial form).
      3. Poor or non-existent privacy disclosures if sensitive data is requested.
      
      Respond with ONLY a valid JSON object:
      {
        "classification": "safe", // or "suspicious" or "unsafe"
        "signals": ["..."] // Array of strings explaining the threats found, empty if safe
      }
      
      Text Content:
      ${textContent.substring(0, 15000)}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let aiText = response.text || '{"classification":"safe","signals":[]}';
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(aiText);
    
    return {
      classification: parsed.classification || "safe",
      signals: parsed.signals || []
    };
  } catch (error) {
    console.error("Gemini Security check failed", error);
    return { classification: "safe", signals: ["Gemini Security Check failed"] };
  }
}

export async function analyzeUrlSecurity(targetUrl: string): Promise<SecurityCheckResult> {
  const signals: string[] = [];
  let classification: "safe" | "suspicious" | "unsafe" = "safe";
  let finalUrl = targetUrl;

  try {
    const urlObj = new URL(targetUrl);
    
    // 1. Check Protocol
    if (urlObj.protocol !== 'https:') {
      signals.push("No SSL (HTTP connection)");
      classification = "unsafe";
    } else {
      signals.push("Uses HTTPS secure connection");
    }

    // 2. Threat Intelligence APIs
    const safeBrowsingKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const virusTotalKey = process.env.VIRUSTOTAL_API_KEY;
    
    if (safeBrowsingKey) {
      const gsbResult = await checkGoogleSafeBrowsing(targetUrl, safeBrowsingKey);
      signals.push(...gsbResult.signals);
      if (!gsbResult.safe) {
         classification = "unsafe";
      }
    } else {
      signals.push("Google Safe Browsing: Skipped (API Key missing)");
    }
    
    if (virusTotalKey) {
      const vtResult = await checkVirusTotal(targetUrl, virusTotalKey);
      signals.push(...vtResult.signals);
      if (vtResult.classification === "unsafe") classification = "unsafe";
      else if (vtResult.classification === "suspicious" && classification === "safe") classification = "suspicious";
    } else {
      signals.push("VirusTotal: Skipped (API Key missing)");
    }

    // 3. Headless Browser Check for Redirects and Content
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Set a timeout to prevent hanging
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    finalUrl = page.url();
    if (finalUrl !== targetUrl) {
      signals.push(`URL redirects to: ${finalUrl}`);
    }

    const content = await page.content();
    
    // 3. AI-Powered Security Checks
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
       const textContent = await page.evaluate(() => document.body.innerText);
       const aiResult = await checkGeminiSecurity(textContent, geminiKey);
       
       if (aiResult.signals.length > 0) {
         signals.push(...aiResult.signals.map(s => `AI Analysis: ${s}`));
       } else {
         signals.push("AI Analysis: No social engineering or excessive data collection detected.");
       }
       
       if (aiResult.classification === "unsafe") classification = "unsafe";
       else if (aiResult.classification === "suspicious" && classification === "safe") classification = "suspicious";
    } else {
       signals.push("AI Analysis: Skipped (API Key missing)");
       
       // Fallback Heuristic checks on DOM 
       const lowerContent = content.toLowerCase();
       
       if (lowerContent.includes("social security number") || lowerContent.includes("ssn")) {
         signals.push("Form asks for highly sensitive PII (SSN)");
         classification = classification === "unsafe" ? "unsafe" : "suspicious";
       }

       if (lowerContent.includes("credit card") || lowerContent.includes("bank account details")) {
         signals.push("Form asks for financial details prematurely");
         classification = classification === "unsafe" ? "unsafe" : "suspicious";
       }
    }

    if (urlObj.hostname.endsWith(".biz") || urlObj.hostname.endsWith(".info") || urlObj.hostname.endsWith(".tk")) {
       signals.push(`Suspicious top-level domain (${urlObj.hostname})`);
       classification = classification === "safe" ? "suspicious" : classification;
    }

    await browser.close();

  } catch (error: any) {
    signals.push(`Failed to analyze URL securely: ${error.message}`);
    classification = "unsafe";
  }

  const result: SecurityCheckResult = {
    apply_url: finalUrl,
    classification,
    signals,
    user_override: false
  };

  // Log to Security Logs
  await saveSecurityLog({
    id: crypto.randomUUID(),
    url: targetUrl,
    timestamp: new Date().toISOString(),
    classification: result.classification,
    signals: result.signals
  });

  return result;
}
