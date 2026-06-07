"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage as StoreChatMessage } from "@/store/useChatStore";

interface ChatScrollDotsProps {
  messages: StoreChatMessage[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function ChatScrollDots({ messages, scrollContainerRef }: ChatScrollDotsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userMessages = messages.filter((m) => m.role === "user");
  const userCount = userMessages.length;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const viewport = container.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;
    if (!viewport) return;

    const updateActive = () => {
      const els = Array.from(
        container.querySelectorAll("[data-user-message]")
      ) as HTMLElement[];
      if (els.length === 0) return;

      const viewportRect = viewport.getBoundingClientRect();
      const targetY = viewportRect.top + viewportRect.height * 0.3;

      let best = -1;
      let bestDist = Infinity;

      els.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > viewportRect.top && rect.top < viewportRect.bottom) {
          const dist = Math.abs(rect.top - targetY);
          if (dist < bestDist) {
            bestDist = dist;
            best = idx;
          }
        }
      });

      if (best !== -1) setActiveIndex(best);
    };

    updateActive();
    viewport.addEventListener("scroll", updateActive, { passive: true });
    return () => viewport.removeEventListener("scroll", updateActive);
  }, [messages, scrollContainerRef]);

  const scrollToMessage = (idx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const viewport = container.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;
    if (!viewport) return;

    const els = Array.from(
      container.querySelectorAll("[data-user-message]")
    ) as HTMLElement[];
    const el = els[idx];
    if (!el) return;

    const viewportRect = viewport.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    viewport.scrollTo({
      top: viewport.scrollTop + (elRect.top - viewportRect.top) - 32,
      behavior: "smooth",
    });
  };

  const handleMouseEnter = (idx: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setHoveredIndex(idx);
  };

  const handleMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => setHoveredIndex(null), 120);
  };

  if (userCount === 0) return null;

  return (
    <div className="absolute right-2 md:right-5 top-0 bottom-0 flex items-center z-30 pointer-events-none">
      <div className="flex flex-col items-center gap-[7px] pointer-events-auto">
        {userMessages.map((msg, idx) => {
          const preview = msg.content.trim().replace(/\s+/g, " ").slice(0, 60);
          const isHovered = hoveredIndex === idx;

          return (
            <div key={msg.id} className="relative flex items-center">
              {/* Tooltip */}
              <div
                className={cn(
                  "absolute right-full mr-3 whitespace-nowrap max-w-[200px] truncate",
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium leading-snug",
                  "bg-popover text-popover-foreground border border-border shadow-md",
                  "pointer-events-none transition-all duration-150",
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-1"
                )}
              >
                {preview}
                {msg.content.length > 60 && "…"}
              </div>

              {/* Dot */}
              <button
                onClick={() => scrollToMessage(idx)}
                onMouseEnter={() => handleMouseEnter(idx)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "block rounded-full transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  idx === activeIndex
                    ? "w-[9px] h-[9px] bg-primary shadow-[0_0_6px_2px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
                    : "w-[6px] h-[6px] bg-muted-foreground/25 hover:bg-muted-foreground/55"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
