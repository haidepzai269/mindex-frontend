"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, model: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, disabled, isLoading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState("Mindex-1");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (input.trim() && !disabled && !isLoading) {
      onSendMessage(input.trim(), model);
      setInput("");
    }
  }, [input, onSendMessage, disabled, isLoading, model]);

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
        "relative flex flex-col w-full bg-card/80 border border-border rounded-[1.5rem] p-2 transition-all duration-300 shadow-md",
        "focus-within:border-primary/40 focus-within:ring-[4px] focus-within:ring-primary/5",
        disabled || isLoading ? "opacity-50 grayscale" : ""
      )}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Hỏi bất cứ điều gì về tài liệu này..."}
          disabled={disabled || isLoading}
          className="w-full max-h-32 py-2 px-4 bg-transparent border-none focus:ring-0 text-[14px] font-medium resize-none overflow-y-auto scrollbar-hide text-foreground placeholder:text-muted-foreground leading-normal outline-none"
        />

        <div className="flex items-center justify-between px-2 pb-1 pt-1 border-t border-border/20 mt-1">
          <div className="flex items-center gap-2">
             <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/50">
                <button
                  onClick={() => setModel("Mindex-1")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black transition-all duration-200",
                    model === "Mindex-1"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  MINDEX-1
                </button>
                <button
                  onClick={() => setModel("Mindex-2")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black transition-all duration-200",
                    model === "Mindex-2"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  MINDEX-2
                </button>
             </div>
             <div className="px-2 py-1 rounded-md bg-muted/40 text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1.5 border border-border/30 hidden sm:flex">
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
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "bg-muted text-muted-foreground"
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
            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] whitespace-nowrap">
                Logic - nhanh chóng - chuẩn xác
            </p>
            <Zap size={9} className="text-muted-foreground/50" />
        </div>
      </div>
    </div>
  );
}
