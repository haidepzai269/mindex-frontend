"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  disabled?: boolean;
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
}

export function VoiceInputButton({
  disabled,
  isListening,
  isSupported,
  onClick,
}: VoiceInputButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !isSupported}
      title={
        !isSupported
          ? "Trình duyệt chưa hỗ trợ voice input"
          : isListening
            ? "Dừng ghi âm"
            : "Bật ghi âm"
      }
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
        "disabled:cursor-not-allowed disabled:opacity-40",
        isListening
          ? "bg-red-500/10 text-red-500 hover:bg-red-500/15"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {isListening ? <Square size={15} /> : <Mic size={18} />}
    </button>
  );
}
