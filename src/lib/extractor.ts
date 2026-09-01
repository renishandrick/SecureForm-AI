import puppeteer from 'puppeteer';
import { Opportunity } from '../types';
import crypto from 'crypto';

export async function extractOpportunity(targetUrl: string): Promise<Opportunity> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const title = await page.title();
  
  // Extract visible text for heuristic analysis
  const textContent = await page.evaluate(() => document.body.innerText);
  await browser.close();

  // Basic heuristic extraction (In production, replace with Gemini API call)
  const lowerText = textContent.toLowerCase();
  const org = new URL(targetUrl).hostname.replace("www.", "");
  
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Extract the following information from this job/internship/scholarship application page text:
        - Title (string, max 50 chars)
        - Type (must be exactly "internship", "scholarship", or "job")
        - Minimum CGPA requirement (number, use 0 if not specified)
        - Required Skills (array of strings, e.g., ["React", "Python"])
        
        Respond with ONLY a valid JSON object matching this structure:
        {
          "title": "...",
          "type": "...",
          "min_cgpa": 0.0,
          "required_skills": ["..."]
        }
        
        Text Content:
        ${textContent.substring(0, 10000)}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      let aiText = response.text || "{}";
      // Clean up markdown code block if present
      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(aiText);
      return {
        opportunity_id: `opp_${crypto.randomBytes(4).toString('hex')}`,
        title: parsed.title || title.substring(0, 50) || "Extracted Application Form",
        org: org,
        type: parsed.type === "internship" || parsed.type === "scholarship" ? parsed.type : "job",
        requirements: {
          min_cgpa: parsed.min_cgpa || 0,
          required_skills: parsed.required_skills || [],
          eligibility_text: "Extracted from page content using Gemini AI."
        },
        deadline: null, 
        apply_url: targetUrl,
        data_quality: "complete"
      };
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      // Fallback to heuristic
    }
  }
  
  let minCgpa = 0;
  const cgpaMatch = textContent.match(/cgpa.*?([0-9]\.[0-9])/i);
  if (cgpaMatch) {
    minCgpa = parseFloat(cgpaMatch[1]);
  }

  const possibleSkills = ["React", "Python", "JavaScript", "Java", "C++", "SQL", "Machine Learning", "Node.js", "TypeScript"];
  const requiredSkills = possibleSkills.filter(s => lowerText.includes(s.toLowerCase()));


  return {
    opportunity_id: `opp_${crypto.randomBytes(4).toString('hex')}`,
    title: title.substring(0, 50) || "Extracted Application Form",
    org: org,
    type: lowerText.includes("internship") ? "internship" : lowerText.includes("scholarship") ? "scholarship" : "job",
    requirements: {
      min_cgpa: minCgpa,
      required_skills: requiredSkills,
      eligibility_text: "Extracted from page content using heuristic matching."
    },
    deadline: null, 
    apply_url: targetUrl,
    data_quality: "incomplete"
  };
}
