"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, disabled, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (input.trim() && !disabled && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  }, [input, onSendMessage, disabled, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="relative flex flex-col w-full bg-transparent outline-none items-center">
      <div className={cn(
        "relative flex flex-col w-full bg-zinc-900/60 border border-zinc-800/80 rounded-[1.5rem] p-2 transition-all duration-300 shadow-2xl shadow-black/60",
        "focus-within:border-primary/40 focus-within:ring-[4px] focus-within:ring-primary/5",
        disabled || isLoading ? "opacity-50 grayscale" : ""
      )}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi bất cứ điều gì về tài liệu này..."
          disabled={disabled || isLoading}
          className="w-full max-h-32 py-2 px-4 bg-transparent border-none focus:ring-0 text-[14px] font-medium resize-none overflow-y-auto scrollbar-hide text-zinc-200 placeholder:text-zinc-600 leading-normal outline-none"
        />
        
        <div className="flex items-center justify-between px-2 pb-1 pt-1 border-t border-zinc-800/20 mt-1">
          <div className="flex items-center gap-2">
             <div className="px-2 py-1 rounded-md bg-black text-[8px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-1.5 border border-zinc-800/30">
                <kbd className="opacity-40">SHIFT+ENTER</kbd> 
                <span className="opacity-20">|</span>
                XUỐNG DÒNG
             </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all duration-300 font-black text-[11px] uppercase tracking-tighter",
              input.trim() && !disabled && !isLoading 
                ? "bg-zinc-50 text-black hover:bg-white active:scale-95" 
                : "bg-zinc-800 text-zinc-600"
            )}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin text-primary" />
            ) : (
              <>
                <span>Gửi câu hỏi</span>
                <Send size={13} className={cn(input.trim() ? "text-primary fill-primary" : "")} />
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-4 opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default px-4">
        <div className="flex items-center gap-2 py-1">
            <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(184,41,255,1)]" />
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] whitespace-nowrap">
                Logic - nhanh chóng - chuẩn xác
            </p>
            <Zap size={9} className="text-primary fill-primary" />
        </div>
      </div>
    </div>
  );
}
