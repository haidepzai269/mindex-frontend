"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BrainCircuit, Send, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { VoiceInputButton } from "@/components/user/VoiceInputButton";
import { useAuthStore } from "@/store/useAuthStore";

interface ChatInputProps {
  onSendMessage: (message: string, model: string, thinking: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, disabled, isLoading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState("Mindex-1");
  const [thinking, setThinking] = useState(false);
  const [voiceBaseInput, setVoiceBaseInput] = useState("");
  const [showMainPlaceholder, setShowMainPlaceholder] = useState(true);
  const user = useAuthStore((state) => state.user);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAnimatePlaceholder = !placeholder;
  const thinkingAvailable =
    user?.role === "admin" ||
    user?.tier === "PRO" ||
    user?.tier === "ULTRA";

  useEffect(() => {
    if (!shouldAnimatePlaceholder) return;

    const intervalId = window.setInterval(() => {
      setShowMainPlaceholder((prev) => !prev);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [shouldAnimatePlaceholder]);

  const updateInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  const {
    error: voiceError,
    isListening,
    isSupported,
    stopListening,
    toggleListening,
  } = useSpeechToText({
    onTranscriptChange: (transcript) => {
      updateInput(
        transcript
          ? [voiceBaseInput.trimEnd(), transcript].filter(Boolean).join(" ")
          : voiceBaseInput
      );
    },
  });

  const handleSend = useCallback(() => {
    if (input.trim() && !disabled && !isLoading) {
      onSendMessage(input.trim(), model, thinkingAvailable && thinking);
      setInput("");
      setThinking(false);
      setVoiceBaseInput("");
      stopListening();
    }
  }, [disabled, input, isLoading, model, onSendMessage, stopListening, thinking, thinkingAvailable]);

  const handleToggleVoice = useCallback(() => {
    if (!isListening) {
      setVoiceBaseInput(input);
    }

    toggleListening();
  }, [input, isListening, toggleListening]);

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
        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => updateInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={shouldAnimatePlaceholder ? "" : placeholder}
            disabled={disabled || isLoading}
            className="w-full max-h-32 py-2 px-4 bg-transparent border-none focus:ring-0 text-[14px] font-medium resize-none overflow-y-auto scrollbar-hide text-foreground placeholder:text-muted-foreground leading-normal outline-none"
          />
          {shouldAnimatePlaceholder && !input && (
            <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 overflow-hidden h-5 text-[14px] font-medium text-muted-foreground">
              <div
                className={cn(
                  "flex flex-col transition-transform duration-500 ease-out",
                  showMainPlaceholder ? "-translate-y-5" : "translate-y-0"
                )}
              >
                <span className="h-5 leading-5 whitespace-nowrap">Shift + Enter để xuống dòng</span>
                <span className="h-5 leading-5 whitespace-nowrap">Hỏi bất cứ điều gì về tài liệu này...</span>
              </div>
            </div>
          )}
        </div>

        {voiceError && (
          <p className="px-4 pb-1 text-[11px] font-medium text-red-500">
            {voiceError}
          </p>
        )}

        <div className="flex min-w-0 items-center justify-between gap-2 px-2 pb-1 pt-1 border-t border-border/20 mt-1">
          <div className="flex min-w-0 items-center gap-1.5">
             <VoiceInputButton
               disabled={disabled || isLoading}
               isListening={isListening}
               isSupported={isSupported}
               onClick={handleToggleVoice}
             />
             {thinkingAvailable && (
               <button
                 type="button"
                 onClick={() => setThinking((value) => !value)}
                 disabled={disabled || isLoading}
                 title="Thinking"
                 aria-label="Thinking"
                 aria-pressed={thinking}
                 className={cn(
                   "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                   thinking
                     ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                     : "border-border/50 bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                   disabled || isLoading ? "cursor-not-allowed opacity-50" : "active:scale-95"
                 )}
               >
                 <BrainCircuit size={15} />
               </button>
             )}
              <div className="flex min-w-0 items-center bg-muted/40 rounded-lg p-0.5 border border-border/50">
                 <button
                   onClick={() => setModel("Mindex-1")}
                   className={cn(
                     "min-w-0 whitespace-nowrap px-[clamp(0.4rem,1.4vw,0.75rem)] py-1 rounded-md text-[clamp(7px,1.35vw,10px)] leading-none font-black transition-all duration-200",
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
                     "min-w-0 whitespace-nowrap px-[clamp(0.4rem,1.4vw,0.75rem)] py-1 rounded-md text-[clamp(7px,1.35vw,10px)] leading-none font-black transition-all duration-200",
                     model === "Mindex-2"
                       ? "bg-foreground text-background shadow-sm"
                       : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  MINDEX-2
                </button>
             </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading}
            className={cn(
              "flex min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap px-[clamp(0.55rem,1.6vw,1rem)] py-1.5 rounded-xl transition-all duration-300 font-black text-[clamp(8px,1.35vw,11px)] leading-none uppercase tracking-tighter",
              input.trim() && !disabled && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin text-primary" />
            ) : (
              <>
                <span className="whitespace-nowrap">Gửi câu hỏi</span>
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
