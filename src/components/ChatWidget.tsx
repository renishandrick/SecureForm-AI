"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { sendChatMessage } from "@/app/actions/chat";

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", parts: [{ text: "Hello! I'm OmniGuard AI. How can I help you secure your applications today?" }] }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const newMsg: Message = { role: "user", parts: [{ text: input }] };
    const newHistory = [...messages, newMsg];
    
    setMessages(newHistory);
    setInput("");
    setIsTyping(true);

    const response = await sendChatMessage(newHistory);
    
    setMessages([...newHistory, { role: "model", parts: [{ text: response.text }] }]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          backgroundColor: "var(--accent-primary)",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 1000,
          transition: "transform 0.2s ease"
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "350px",
          height: "500px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem",
            backgroundColor: "var(--accent-primary)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
              <Bot size={20} /> OmniGuard AI
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "0.25rem" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: "0.5rem",
                alignItems: "flex-end"
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  backgroundColor: msg.role === "user" ? "var(--bg-primary)" : "var(--accent-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0
                }}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{
                  maxWidth: "75%",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "12px",
                  borderBottomLeftRadius: msg.role === "model" ? "4px" : "12px",
                  backgroundColor: msg.role === "user" ? "var(--bg-primary)" : "rgba(139, 92, 246, 0.1)",
                  border: msg.role === "user" ? "1px solid var(--border-color)" : "1px solid rgba(139, 92, 246, 0.2)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap"
                }}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  <Bot size={14} />
                </div>
                <div style={{ padding: "0.75rem 1rem", borderRadius: "12px", backgroundColor: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: "1rem",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            gap: "0.5rem",
            backgroundColor: "var(--bg-primary)"
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "20px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                outline: "none",
                fontSize: "0.875rem"
              }}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: input.trim() && !isTyping ? "var(--accent-primary)" : "var(--border-color)",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                transition: "background-color 0.2s"
              }}
            >
              <Send size={18} style={{ marginLeft: "-2px" }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
