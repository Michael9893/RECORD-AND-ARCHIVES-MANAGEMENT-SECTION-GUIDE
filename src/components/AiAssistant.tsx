/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  CornerDownLeft, 
  Bot, 
  User, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { ChatMessage, Guideline } from "../types";

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  guidelines: Guideline[];
}

export default function AiAssistant({
  isOpen,
  onClose,
  guidelines
}: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Setup initial message when component opens or resets
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm MJB HELPER, your shared procedures expert. 

All guidelines, categories, and custom procedural logs that you input here are fully synchronized, shared, and stored within our centralized knowledge base. I have absolute live access to your dynamic records repository and can instantly guide you through any procedure!

Try asking me:
- *"What DPI resolution is required for digitized documents?"*
- *"Can I shred archives without dual witnesses?"*
- *"Explain the Physical records intake checklist steps."*

How can I assist you in our Records and Archive Management Section today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Gather chat history (exclude system or initial helper messages if needed, keep last 12 to save context)
      const chatHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content
        }))
        .concat({ role: "user", content: textToSend.trim() });

      // Call our secure Express backend proxy route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: chatHistory,
          guidelinesContext: guidelines // Provide the actual active guidelines for accurate context grounding!
        })
      });

      if (!response.ok) {
        throw new Error("Local assistant proxy endpoint returned bad response status.");
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.content || "I didn't receive a readable answer from standard records servers. Please retry.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (err: any) {
      console.error("AI chat communication error:", err);
      
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **System Assist Alert:** I encountered an error communicating with the regional records search engine.

This is usually because the dev server is starting, or the backend is offline. Let me review standard instructions manually:

- Physical Records are packed upright up to 15kg per archival storage box.
- Scanning resolution is strictly **300 DPI, Grayscale, Double-Sided**.
- Redacting PII is legally required for FOI requests.
- Shredding events need **2 department witnesses** and a signed Certificate of Destruction.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickPromptClick = (promptText: string) => {
    sendMessage(promptText);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="ai-assistant-drawer" 
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-right duration-300"
    >
      {/* Header bar area */}
      <div id="ai-header" className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/25 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs text-white">MJB HELPER</h3>
            <p className="text-[10px] font-mono text-indigo-400">GEMINI BI MODEL v1.5</p>
          </div>
        </div>
        <button
          id="btn-close-ai-assistant"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestion prompt cards on top */}
      <div id="ai-quick-prompts" className="p-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto whitespace-nowrap flex items-center gap-2">
        <span className="text-[9px] font-mono font-bold text-slate-500 px-1 border-r border-slate-800 mr-1 flex-shrink-0 uppercase">
          Quick queries:
        </span>
        <button
          onClick={() => handleQuickPromptClick("What DPI is required for scanning?")}
          className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-305 px-3 py-1.5 rounded-full border border-slate-700 hover:text-indigo-400 transition-colors uppercase font-sans tracking-wide cursor-pointer font-medium"
        >
          DPI Scan spec
        </button>
        <button
          onClick={() => handleQuickPromptClick("Explain physical records box coordinates")}
          className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-305 px-3 py-1.5 rounded-full border border-slate-700 hover:text-indigo-400 transition-colors uppercase font-sans tracking-wide cursor-pointer font-medium"
        >
          Box placement
        </button>
        <button
          onClick={() => handleQuickPromptClick("Can I shred expired records with only 1 witness?")}
          className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-305 px-3 py-1.5 rounded-full border border-slate-700 hover:text-indigo-400 transition-colors uppercase font-sans tracking-wide cursor-pointer font-medium"
        >
          Disposal laws
        </button>
      </div>

      {/* Messages layout pane */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          return (
            <div 
              key={m.id} 
              className={`flex items-start gap-3 w-full max-w-[85%] ${isBot ? "self-start" : "ml-auto flex-row-reverse"}`}
            >
              <div className={`p-1.5 rounded-lg border ${
                isBot 
                  ? "bg-slate-950 border-slate-800 text-indigo-400" 
                  : "bg-indigo-600 text-white border-indigo-500"
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans shadow-sm whitespace-pre-wrap ${
                  isBot 
                    ? "bg-slate-950/60 border border-slate-850 text-slate-300" 
                    : "bg-slate-800 text-slate-100"
                }`}>
                  {m.content}
                </div>
                <div className={`flex items-center gap-1 text-[9px] font-mono text-slate-500 ${isBot ? "justify-start pl-1" : "justify-end pr-1"}`}>
                  <Clock className="w-2.5 h-2.5" />
                  <span>{m.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-[80%] self-start">
            <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1.5">
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl text-xs text-slate-300 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest animate-pulse font-semibold">
                  Analyzing guidelines context...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input footer form */}
      <form onSubmit={handleFormSubmit} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <label className="sr-only">Type a query</label>
        <input
          id="inp-ai-chat-text"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type procedures or rules inquiry..."
          className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          id="btn-submit-ai-text"
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-3 bg-indigo-650 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-650 focus:scale-95 rounded-xl transition-all font-bold cursor-pointer flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
