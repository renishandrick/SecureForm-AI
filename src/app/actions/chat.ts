"use server";

export async function sendChatMessage(messages: { role: "user" | "model", parts: { text: string }[] }[]) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { text: "Error: Gemini API key is not configured." };
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // We only need the latest user message and some context, or we can use the chat API if the SDK supports it.
    // The @google/genai SDK supports chats.
    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction: "You are OmniGuard AI, a helpful, professional cybersecurity and application assistant. You help users understand security risks, track applications, and navigate the SecureForm platform. Keep responses concise and use markdown.",
      }
    });
    
    // If we have history, we might need to send it differently, but for simplicity we can just prompt the model with the history.
    let historyPrompt = "Chat History:\n";
    for (const msg of messages.slice(0, -1)) {
      historyPrompt += `${msg.role === 'user' ? 'User' : 'OmniGuard'}: ${msg.parts[0].text}\n\n`;
    }
    
    const latestMessage = messages[messages.length - 1].parts[0].text;
    const finalPrompt = historyPrompt + `User: ${latestMessage}\n\nOmniGuard:`;
    
    let aiResponse;
    for (let i = 0; i < 3; i++) {
      try {
        aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: finalPrompt,
        });
        break;
      } catch (e: any) {
        if (i === 2) throw e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    return { text: aiResponse?.text || "I'm sorry, I couldn't process that right now." };
  } catch (error: any) {
    console.error("Chat error:", error);
    return { text: "Sorry, I'm experiencing high demand right now. Please try again later!" };
  }
}
