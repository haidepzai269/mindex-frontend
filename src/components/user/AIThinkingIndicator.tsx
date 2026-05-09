"use client";

import { cn } from "@/lib/utils";

interface AIThinkingIndicatorProps {
  text?: string;
  className?: string;
}

/**
 * Hiệu ứng "Thinking" cho AI — ánh sáng trắng quét từ trái qua phải trên text, lặp vô hạn.
 * Dùng chung cho doc chat, collection chat, và room chat.
 */
export function AIThinkingIndicator({
  text = "Đang suy nghĩ...",
  className,
}: AIThinkingIndicatorProps) {
  return (
    <span
      className={cn("text-sm font-medium inline-block select-none", className)}
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
      {text}
    </span>
  );
}
