"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  Stethoscope, 
  Pill, 
  FileText, 
  AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const ChatView: React.FC = () => {
  const { token, backendUrl } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your AI clinical assistant. I can assist you with symptom evaluations, precaution guidelines, pharmaceutical definitions, and decision support references. What clinical queries can I resolve for you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Quick Action Chips
  const promptChips = [
    { label: "Analyze Respiratory Symptoms", icon: <Stethoscope className="w-3.5 h-3.5" />, query: "Analyze symptoms: Persistent dry cough, mild chest tightness, and a low-grade fever of 100.2°F for 3 days." },
    { label: "Check Drug Interactions", icon: <Pill className="w-3.5 h-3.5" />, query: "What are the primary contraindications or drug interactions associated with administering Azithromycin alongside Albuterol?" },
    { label: "Pneumonia Diagnosis Guidelines", icon: <FileText className="w-3.5 h-3.5" />, query: "Explain the key chest radiograph criteria and clinical signs used to differentiate bacterial vs. viral pneumonia." }
  ];

  // Auto-scroll chats
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const safeFormatTime = (dateInput: any): string => {
    try {
      if (!dateInput) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) {
        if (typeof dateInput === "string" && dateInput.includes("T")) {
          const timePart = dateInput.split("T")[1];
          return timePart.substring(0, 5);
        }
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Load past chat logs on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/v1/chat/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const parsed: Message[] = data.map((item: any) => [
          {
            id: `${item.id}-user`,
            sender: "user" as const,
            text: item.message,
            timestamp: safeFormatTime(item.created_at)
          },
          {
            id: `${item.id}-ai`,
            sender: "ai" as const,
            text: item.response,
            timestamp: safeFormatTime(item.created_at)
          }
        ]).flat();
        
        // Combine welcome message with database history
        setMessages([
          {
            id: "welcome",
            sender: "ai" as const,
            text: "Hello! I am your AI clinical assistant. I can assist you with symptom evaluations, precaution guidelines, pharmaceutical definitions, and decision support references. What clinical queries can I resolve for you today?",
            timestamp: safeFormatTime(data[0]?.created_at)
          },
          ...parsed
        ]);
      }
    })
    .catch(err => console.error("Failed to load chat history logs:", err));
  }, [token, backendUrl]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) {
        throw new Error("Failed to receive feedback from chatbot server.");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: "Clinical Server Connection Timeout. Please ensure the backend server is running and check your API keys.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] text-left">
      
      {/* 1. Header Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-200" />
            <h3 className="font-outfit text-base font-extrabold">Clinical Assistant Consultation</h3>
          </div>
          <p className="text-[11px] text-blue-100">Empathetic Generative AI Decision Support Engine</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-blue-200 font-mono font-bold uppercase">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span>Active & Ready</span>
        </div>
      </div>

      {/* 2. Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 min-h-0">
        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3.5 max-w-[85%] ${isAi ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                isAi 
                  ? "bg-blue-500/10 border-blue-500/10 text-blue-500" 
                  : "bg-indigo-500/15 border-indigo-500/10 text-indigo-500"
              }`}>
                {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  isAi 
                    ? "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-850 text-slate-800 dark:text-slate-200" 
                    : "bg-blue-600 border-blue-600 text-white"
                }`}>
                  {/* Format markdown line breaks inside clinical text */}
                  <div className="whitespace-pre-line prose dark:prose-invert max-w-none text-xs">
                    {msg.text}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 font-mono block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Typing thinking states */}
        {loading && (
          <div className="flex items-start gap-3.5 mr-auto max-w-[85%]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/10 text-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* 3. Prompt chips dashboard */}
      <div className="py-2.5 flex flex-wrap gap-2 shrink-0 border-t border-slate-200 dark:border-slate-850">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip.query)}
            className="px-3 py-1.5 rounded-xl border border-slate-250/20 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/80 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            {chip.icon}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Chat Input form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
        className="flex items-center gap-2 pt-2.5 shrink-0"
      >
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask MediScan clinical assistant..."
          className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/60 rounded-2xl text-white shadow-lg transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      
    </div>
  );
};
