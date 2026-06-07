"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, Atom, CheckCircle2, ChevronDown, ChevronUp, Circle, Loader2 } from "lucide-react";
import { AIThinkingIndicator } from "@/components/user/AIThinkingIndicator";
import { cn } from "@/lib/utils";

export type AIAnalysisStatus = "idle" | "running" | "complete" | "error";
export type AIAnalysisStepStatus = "pending" | "running" | "complete" | "error";

export interface AIAnalysisStep {
  id: string;
  label: string;
  detail: string;
  status: AIAnalysisStepStatus;
}

interface AIAnalysisPanelProps {
  title: string;
  description: string;
  status: AIAnalysisStatus;
  steps: AIAnalysisStep[];
  insights: string[];
  error?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function AIAnalysisPanel({
  title,
  description,
  status,
  steps,
  insights,
  error,
  open,
  onOpenChange,
  className,
}: AIAnalysisPanelProps) {
  const insightEndRef = useRef<HTMLDivElement>(null);
  const completedSteps = steps.filter((step) => step.status === "complete").length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const isRunning = status === "running";
  const isComplete = status === "complete";
  const isError = status === "error";

  useEffect(() => {
    if (open) {
      insightEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [insights.length, open]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-[#101114] text-zinc-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300",
        isRunning && "border-blue-500/30 shadow-blue-500/5",
        isComplete && "border-emerald-500/30",
        isError && "border-red-500/30",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="group flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 md:px-5"
        aria-expanded={open}
        title={open ? "Ẩn phân tích AI" : "Mở phân tích AI"}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            isComplete && "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
            isError && "border-red-500/25 bg-red-500/10 text-red-300",
            isRunning && "border-blue-500/25 bg-blue-500/10 text-blue-300",
            !isComplete && !isError && !isRunning && "border-white/10 bg-white/[0.04] text-zinc-300"
          )}
        >
          {isComplete ? (
            <CheckCircle2 size={18} />
          ) : isError ? (
            <AlertCircle size={18} />
          ) : (
            <Atom size={18} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-zinc-100">
            {isRunning ? (
              <AIThinkingIndicator text="Đang suy nghĩ" textClassName="text-base font-semibold" />
            ) : isComplete ? (
              "Hoàn tất phân tích"
            ) : isError ? (
              error || "Phân tích thất bại"
            ) : (
              title
            )}
          </span>
          {!isRunning && !isError && (
            <span className="mt-0.5 block truncate text-xs text-zinc-400">{description}</span>
          )}
        </span>

        <span className="hidden min-w-[72px] text-right text-[10px] font-black uppercase tracking-widest text-zinc-500 sm:block">
          {isRunning ? `${Math.max(progress, 8)}%` : isComplete ? "Done" : isError ? "Error" : "Ready"}
        </span>
        <span
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 text-xs font-semibold text-zinc-200 transition-colors group-hover:border-blue-400/30 group-hover:text-blue-100",
            open && "border-blue-500/30 bg-blue-500/10 text-blue-100"
          )}
          aria-hidden="true"
        >
          <span className="hidden sm:inline">{open ? "Ẩn" : "Mở"}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 pb-5 pt-2 animate-in slide-in-from-top-2 duration-300 md:px-5">
          <div className="mb-5 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isError ? "bg-red-400" : isComplete ? "bg-emerald-400" : "bg-blue-500"
              )}
              style={{ width: `${isError ? Math.max(progress, 35) : isComplete ? 100 : Math.max(progress, 8)}%` }}
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-zinc-400">
                  Các dòng phân tích sẽ xuất hiện tại đây.
                </div>
              ) : (
                insights.map((insight, index) => (
                  <div
                    key={`${index}-${insight}`}
                    className="relative pl-7 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <span className="absolute left-1.5 top-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <div className="absolute left-[9px] top-6 bottom-0 w-px bg-zinc-700" />
                    <p className="whitespace-pre-line text-[15px] font-medium leading-8 text-zinc-100">
                      {insight}
                    </p>
                  </div>
                ))
              )}
              <div ref={insightEndRef} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex min-h-16 items-start gap-2 rounded-lg border px-3 py-2 transition-colors",
                    step.status === "running" && "border-blue-500/30 bg-blue-500/10",
                    step.status === "complete" && "border-emerald-500/20 bg-emerald-500/10",
                    step.status === "error" && "border-red-500/25 bg-red-500/10",
                    step.status === "pending" && "border-white/10 bg-white/[0.03]"
                  )}
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    {step.status === "complete" ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : step.status === "running" ? (
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                    ) : step.status === "error" ? (
                      <AlertCircle size={14} className="text-red-400" />
                    ) : (
                      <Circle size={10} className="text-zinc-600" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-100">{step.label}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-5 text-zinc-400">{step.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
