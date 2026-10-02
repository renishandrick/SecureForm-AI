"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getEmailOpportunities, saveEmailOpportunities } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function fetchAndAnalyzeEmailsAction() {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  const accessToken = session?.accessToken;
  if (!accessToken) {
    console.error("\n❌ [Sync Failed] No Gmail access token found. Please sign out and sign back in with Google.\n");
    return { error: "No Gmail access token found. Please sign in with Google." };
  }

  try {
    console.log("Fetching emails from Gmail API...");
    // 1. Fetch recent emails using Gmail API (removed q=is:unread to ensure we find emails)
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (res.status === 401 || res.status === 403) {
      console.error(`\n❌ [Sync Failed] Gmail access unauthorized (Status: ${res.status}). Make sure you enabled the Gmail API and requested the right scopes.\n`);
      return { error: "Gmail access unauthorized. Please re-authenticate." };
    }
    
    const data = await res.json();
    if (!data.messages) {
      console.log("\n⚠️ [Sync] No emails returned from API.\n");
      return { success: true, count: 0 };
    }
    
    const existing = await getEmailOpportunities();
    const existingIds = new Set(existing.map(e => e.id));
    
    let newCount = 0;
    
    let GoogleGenAI;
    let ai;
    if (process.env.GEMINI_API_KEY) {
      const pkg = await import('@google/genai');
      GoogleGenAI = pkg.GoogleGenAI;
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    
    for (const msg of data.messages) {
      if (existingIds.has(msg.id)) {
        console.log(`⚠️ [Sync] Skipping already synced email: ${msg.id}`);
        continue;
      }
      
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const msgData = await msgRes.json();
      
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
      const snippet = msgData.snippet || '';
      
      let category = "other";
      let confidence = 0.0;
      
      if (ai) {
        // 2. Analyze with Gemini
        const prompt = `
          Analyze this email snippet and categorize it.
          Subject: ${subject}
          From: ${from}
          Snippet: ${snippet}
          
          Categories: "internship", "scholarship", "education_form", "other"
          
          Respond with ONLY a valid JSON object:
          {
            "category": "internship",
            "confidence": 0.95
          }
        `;
        
        let aiResponse;
        for (let i = 0; i < 3; i++) {
          try {
            aiResponse = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
            });
            break;
          } catch (e: any) {
            if (i === 2) {
              console.log(`⚠️ [Fallback] Gemini API overloaded. Falling back to keyword search for: "${subject}"`);
            } else {
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        }
        
        if (aiResponse) {
          let aiText = aiResponse.text || '{"category":"other","confidence":0.0}';
          aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
          try {
            const parsed = JSON.parse(aiText);
            category = parsed.category || "other";
            confidence = parsed.confidence || 0.0;
          } catch(e) {}
        } else {
          // Heuristic Fallback Strategy
          const content = (subject + " " + snippet).toLowerCase();
          if (content.includes("internship") || content.includes("intern")) {
            category = "internship";
            confidence = 0.6;
          } else if (content.includes("scholarship") || content.includes("fellowship")) {
            category = "scholarship";
            confidence = 0.6;
          } else if (content.includes("education") || content.includes("course") || content.includes("application")) {
            category = "education_form";
            confidence = 0.6;
          }
        }
      }
      
      existing.unshift({
        id: msg.id,
        subject,
        from,
        snippet,
        category,
        confidence,
        date: new Date().toISOString()
      });
      newCount++;
    }
    
    if (newCount > 0) {
      await saveEmailOpportunities(existing);
      revalidatePath("/tracking");
    }
    
    return { success: true, count: newCount };
  } catch (error: any) {
    console.error("Email fetch error:", error);
    return { error: error.message };
  }
}

export async function registerEmailOpportunityAction(formData: FormData) {
  const snippet = formData.get("snippet") as string;
  const subject = formData.get("subject") as string;
  const emailId = formData.get("emailId") as string;

  // Attempt to extract a URL from the snippet
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = snippet.match(urlRegex);
  let targetUrl = match && match.length > 0 ? match[0] : "https://example.com/mock-application";

  // Run the standard extraction flow
  const { extractOpportunity } = await import("@/lib/extractor");
  const newOpp = await extractOpportunity(targetUrl);
  
  // Override title to use email subject to maintain context
  newOpp.title = subject.substring(0, 50);

  const { getOpportunities, saveOpportunities } = await import("@/lib/store");
  const allOpps = await getOpportunities();
  allOpps.unshift(newOpp);
  await saveOpportunities(allOpps);

  // Optionally, we could remove the email opportunity from the list here,
  // but for the demo we'll leave it.

  const { redirect } = await import("next/navigation");
  redirect(`/opportunity/${newOpp.opportunity_id}`);
}
