"use client";

import { cn } from "@/lib/utils";
import { Globe2 } from "lucide-react";

interface AIThinkingIndicatorProps {
  text?: string;
  status?: "thinking" | "searching";
  className?: string;
  textClassName?: string;
}

/**
 * Hiệu ứng "Thinking" cho AI — ánh sáng trắng quét từ trái qua phải trên text, lặp vô hạn.
 * Dùng chung cho doc chat, collection chat, và room chat.
 */
export function AIThinkingIndicator({
  text,
  status = "thinking",
  className,
  textClassName,
}: AIThinkingIndicatorProps) {
  const isSearching = status === "searching";
  const displayText = text || (isSearching ? "Đang tìm kiếm..." : "Đang suy nghĩ...");

  return (
    <span className={cn("inline-flex select-none items-center gap-2", className)}>
      {isSearching && (
        <span className="relative inline-flex h-5 w-5 items-center justify-center text-muted-foreground/70">
          <span className="absolute inset-0 rounded-full border border-muted-foreground/20 border-t-muted-foreground/70 animate-spin" />
          <Globe2 size={13} strokeWidth={1.8} className="text-muted-foreground/70" />
        </span>
      )}
      <span
        className={cn("text-sm font-medium inline-block", textClassName)}
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--muted-foreground) / 0.65) 0%, hsl(var(--muted-foreground) / 0.65) 30%, rgba(255,255,255,0.98) 50%, hsl(var(--muted-foreground) / 0.65) 70%, hsl(var(--muted-foreground) / 0.65) 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shimmer-text 1.8s linear infinite",
        }}
      >
        {displayText}
      </span>
    </span>
  );
}
