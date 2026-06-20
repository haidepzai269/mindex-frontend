"use client";

import { useState, useEffect } from "react";
import { Zap, ChevronDown } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";

const STEP_INTERVAL_MS = 620;

export function AIThinkingPanel() {
  const streamInsights = useChatStore((state) => state.streamInsights);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Progressive reveal: show one step every 620ms
  useEffect(() => {
    if (currentIdx >= streamInsights.length) return;
    const timer = setTimeout(() => {
      setCurrentIdx((prev) => prev + 1);
    }, STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [currentIdx, streamInsights.length]);

  const visibleSteps = streamInsights.slice(0, currentIdx);
  const currentStepText = streamInsights[currentIdx - 1] ?? "";
  const collapsedLabel = currentStepText
    ? currentStepText.split(" ").slice(0, 3).join(" ") + "..."
    : "Đang suy nghĩ";

  return (
    <div style={{ padding: "0.25rem 0 1rem", maxWidth: 480 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Zap
          size={15}
          strokeWidth={2}
          style={{
            color: "hsl(var(--muted-foreground) / 0.5)",
            flexShrink: 0,
          }}
        />

        {/* Text + chevron grouped — cả hai clickable, chevron bám sát text */}
        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            className="silver-shimmer-text"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            {isCollapsed ? collapsedLabel : "Đang suy nghĩ"}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: "hsl(var(--muted-foreground) / 0.5)",
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
              flexShrink: 0,
            }}
          />
        </button>

        {!isCollapsed && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  backgroundColor: "hsl(var(--muted-foreground))",
                  display: "block",
                  animation: "blink 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Steps timeline */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: isCollapsed ? 0 : 700,
          opacity: isCollapsed ? 0 : 1,
          transition: "max-height 0.3s ease, opacity 0.25s ease",
        }}
      >
        {visibleSteps.map((step, index) => (
          <div
            key={`${index}-${step.slice(0, 20)}`}
            style={{
              display: "flex",
              animation: "thinking-fade-in 0.4s ease forwards",
            }}
          >
            {/* Dot + vertical line column */}
            <div style={{ width: 16, flexShrink: 0, position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: "hsl(var(--muted-foreground))",
                  opacity: 0.4,
                  display: "block",
                }}
              />
              {index < visibleSteps.length - 1 && (
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    bottom: 0,
                    left: 7.5,
                    width: 1,
                    backgroundColor: "hsl(var(--border))",
                    opacity: 0.6,
                    minHeight: 16,
                    display: "block",
                  }}
                />
              )}
            </div>

            {/* Step text */}
            <p
              className="silver-shimmer-text"
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                padding: "3px 0 11px 8px",
                margin: 0,
              }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
