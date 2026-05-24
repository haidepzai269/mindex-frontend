"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import {
  BrainCircuit,
  Trophy,
  BookOpen,
  ChevronRight,
  Loader2,
  Network,
  Check,
  Headphones,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyHubWidgetProps {
  docId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * StudyHubWidget — Hiển thị nút Flashcard + Quiz + Mastery score
 * Đặt vào sidebar của trang chat/doc
 */
export function StudyHubWidget({
  docId,
  open,
  onOpenChange,
}: StudyHubWidgetProps) {
  const router = useRouter();

  const { data: masteryData, isLoading } = useSWR(
    open ? `/study/docs/${docId}/mastery` : null,
    fetcher as any,
    { revalidateOnFocus: false }
  );

  const mastery = masteryData?.data;
  const masteryScore = mastery?.mastery_score ?? 0;
  const flashcardScore = mastery?.flashcard_score ?? 0;
  const quizScore = mastery?.quiz_score ?? 0;

  const getMasteryLevel = (score: number) => {
    if (score >= 90)
      return {
        label: "Bậc Thầy",
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      };
    if (score >= 70)
      return {
        label: "Thông Thạo",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    if (score >= 40)
      return {
        label: "Đang Học",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    return {
      label: "Mới Bắt Đầu",
      color: "text-zinc-500",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/20",
    };
  };

  const level = getMasteryLevel(masteryScore);

  return (
    <div className={`flex flex-col ${open ? "flex-1 min-h-0" : "mb-4"}`}>
      {/* Header toggle */}
      <button
        onClick={() => {
          console.log("[StudyHubWidget] Toggle clicked. Current open:", open);
          onOpenChange(!open);
        }}
        className="w-full flex items-center justify-between px-6 py-[18px] hover:bg-white/[0.02] transition-all duration-300 rounded-t-[2rem] border border-border bg-card/80 backdrop-blur-3xl shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(184,41,255,0.1)]">
            <BrainCircuit size={16} className="text-primary animate-pulse" />
          </div>
          <div className="flex flex-col items-start pl-1.5 pr-1 py-1">
            <span className="mb-1 text-[11px] font-black uppercase leading-tight tracking-[0.2em] text-muted-foreground/60">
              Neural Core
            </span>
            <span className="text-[14px] font-black leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              Study Hub
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!open && mastery && (
            <span
              className={cn(
                "text-[11px] font-black px-2 py-0.5 rounded-full border",
                level.color,
                level.bg,
                level.border
              )}
            >
              {Math.round(masteryScore)}%
            </span>
          )}
          <ChevronRight
            size={14}
            className={cn(
              "text-muted-foreground/50 transition-transform duration-500 ease-out",
              open && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Content - expands to fill available space when open */}
      {open && (
        <div className="flex-1 min-h-0 px-6 pb-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent bg-card/80 backdrop-blur-3xl rounded-b-[2rem] border border-t-0 border-border animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Mastery Score Section */}
          {isLoading ? (
            <div className="flex flex-col gap-3 py-4 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary/40" />
              <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Đang đồng bộ dữ liệu...
              </span>
            </div>
          ) : mastery ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">
                    Cấp độ nắm vững
                  </p>
                  <h4
                    className={cn(
                      "text-lg font-black tracking-tight",
                      level.color
                    )}
                  >
                    {level.label}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-foreground leading-none">
                    {Math.round(masteryScore)}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground/60 ml-0.5">
                    %
                  </span>
                </div>
              </div>

              <div className="relative w-full h-2.5 bg-muted/60 rounded-full border border-border/50 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(184,41,255,0.3)]",
                    masteryScore >= 70
                      ? "bg-emerald-500"
                      : masteryScore >= 40
                      ? "bg-amber-500"
                      : "bg-primary"
                  )}
                  style={{ width: `${masteryScore}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">
                    🃏 Thẻ Nhớ
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-foreground">
                      {Math.round(flashcardScore)}%
                    </p>
                    <div className="grow h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/50"
                        style={{ width: `${flashcardScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/50 hover:border-amber-500/20 transition-colors">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">
                    🏆 Kiểm Tra
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-foreground">
                      {Math.round(quizScore)}%
                    </p>
                    <div className="grow h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500/50"
                        style={{ width: `${quizScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest text-center mt-3">
                Bắt đầu học tập
              </p>
              {/* Flashcards Button - chưa dùng */}
              <button
                onClick={() => router.push(`/doc/${docId}/flashcards`)}
                className="group/btn relative w-full flex items-center gap-3 px-4 py-3 rounded-[1.25rem] bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover/btn:scale-110 transition-transform flex-shrink-0">
                  <BookOpen size={13} />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-[12px] font-black tracking-tight whitespace-nowrap">
                    Thẻ Ghi Nhớ
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest group-hover/btn:text-primary transition-colors whitespace-nowrap">
                    Flashcards AI
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className="ml-auto text-zinc-700 group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all flex-shrink-0"
                />
              </button>

              {/* Quiz Button - chưa dùng */}
              <button
                onClick={() => router.push(`/doc/${docId}/quiz`)}
                className="group/btn relative w-full flex items-center gap-3 px-4 py-3 rounded-[1.25rem] bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover/btn:scale-110 transition-transform flex-shrink-0">
                  <Trophy size={13} />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-[12px] font-black tracking-tight whitespace-nowrap">
                    Làm Bài Kiểm Tra
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest group-hover/btn:text-amber-500 transition-colors whitespace-nowrap">
                    Quiz AI Generation
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className="ml-auto text-zinc-700 group-hover/btn:text-amber-500 group-hover/btn:translate-x-1 transition-all flex-shrink-0"
                />
              </button>

              {/* Mindmap Button */}
              <button
                onClick={() => router.push(`/doc/${docId}/mindmap`)}
                className="group/btn relative w-full flex items-center gap-3 px-4 py-3 rounded-[1.25rem] bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover/btn:scale-110 transition-transform flex-shrink-0">
                  <Network size={13} />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-[12px] font-black tracking-tight whitespace-nowrap">
                    Bản Đồ Tư Duy
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest group-hover/btn:text-emerald-500 transition-colors whitespace-nowrap">
                    Mindmap Interactive
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className="ml-auto text-zinc-700 group-hover/btn:text-emerald-500 group-hover/btn:translate-x-1 transition-all flex-shrink-0"
                />
              </button>

              {/* Audio Overview Button */}
              <button
                onClick={() => router.push(`/doc/${docId}/audio`)}
                className="group/btn relative w-full flex items-center gap-3 px-4 py-3 rounded-[1.25rem] bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover/btn:scale-110 transition-transform flex-shrink-0">
                  <Headphones size={13} />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-[12px] font-black tracking-tight whitespace-nowrap">
                    Audio Overview
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest group-hover/btn:text-blue-500 transition-colors whitespace-nowrap">
                    Podcast AI
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className="ml-auto text-zinc-700 group-hover/btn:text-blue-500 group-hover/btn:translate-x-1 transition-all flex-shrink-0"
                />
              </button>

              {/* Slide & Video Button */}
              <button
                onClick={() => router.push(`/doc/${docId}/presentation`)}
                className="group/btn relative w-full flex items-center gap-3 px-4 py-3 rounded-[1.25rem] bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-rose-500/30 transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500 group-hover/btn:scale-110 transition-transform flex-shrink-0">
                  <Presentation size={13} />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-[12px] font-black tracking-tight whitespace-nowrap">
                    Slide &amp; Video AI
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest group-hover/btn:text-rose-500 transition-colors whitespace-nowrap">
                    Neural Presentation
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className="ml-auto text-zinc-700 group-hover/btn:text-rose-500 group-hover/btn:translate-x-1 transition-all flex-shrink-0"
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
