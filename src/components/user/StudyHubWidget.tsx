"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { BrainCircuit, Sparkles, Trophy, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyHubWidgetProps {
  docId: string;
}

/**
 * StudyHubWidget — Hiển thị nút Flashcard + Quiz + Mastery score
 * Đặt vào sidebar của trang chat/doc
 */
export function StudyHubWidget({ docId }: StudyHubWidgetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
    if (score >= 90) return { label: "Bậc Thầy", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    if (score >= 70) return { label: "Thông Thạo", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (score >= 40) return { label: "Đang Học", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "Mới Bắt Đầu", color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20" };
  };

  const level = getMasteryLevel(masteryScore);

  return (
    <div className="mt-8 relative group">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-purple-500/5 to-primary/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      
      <div className="relative rounded-[2rem] border border-white/5 bg-[#0A0B0F]/80 backdrop-blur-3xl overflow-hidden shadow-2xl">
        {/* Header toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-white/[0.02] transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(184,41,255,0.1)]">
              <BrainCircuit size={16} className="text-primary animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Neural Core</span>
              <span className="text-[14px] font-black text-white/90 tracking-tight leading-none group-hover:text-primary transition-colors">Study Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!open && mastery && (
              <span className={cn("text-[11px] font-black px-2 py-0.5 rounded-full border", level.color, level.bg, level.border)}>
                {Math.round(masteryScore)}%
              </span>
            )}
            <ChevronRight
              size={14}
              className={cn("text-zinc-700 transition-transform duration-500 ease-out", open && "rotate-90")}
            />
          </div>
        </button>

        {/* Content */}
        {open && (
          <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Mastery Score Section */}
            {isLoading ? (
              <div className="flex flex-col gap-3 py-4 items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary/40" />
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Đang đồng bộ dữ liệu...</span>
              </div>
            ) : mastery ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Cấp độ nắm vững</p>
                    <h4 className={cn("text-lg font-black tracking-tight", level.color)}>{level.label}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white leading-none">{Math.round(masteryScore)}</span>
                    <span className="text-xs font-bold text-zinc-600 ml-0.5">%</span>
                  </div>
                </div>

                <div className="relative w-full h-2.5 bg-zinc-900/50 rounded-full border border-white/5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(184,41,255,0.3)]",
                      masteryScore >= 70 ? "bg-emerald-500" :
                      masteryScore >= 40 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${masteryScore}%` }}
                  />
                  {/* Subtle shine effect on progress bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-colors">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">🃏 Thẻ Nhớ</p>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-white/80">{Math.round(flashcardScore)}%</p>
                      <div className="grow h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/50" style={{ width: `${flashcardScore}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-colors">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">🏆 Kiểm Tra</p>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-white/80">{Math.round(quizScore)}%</p>
                      <div className="grow h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/50" style={{ width: `${quizScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[12px] text-zinc-500 font-medium italic mb-2">Chưa có tiến độ học tập 📚</p>
                <p className="text-[10px] text-zinc-600 leading-relaxed px-4">Hãy bắt đầu tạo flashcards hoặc quiz để AI đo lường mức độ thấu hiểu tài liệu của bạn.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <button
                onClick={() => router.push(`/doc/${docId}/flashcards`)}
                className="group/btn relative w-full flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] bg-zinc-900/50 border border-white/5 text-white/80 hover:text-white hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover/btn:scale-110 transition-transform">
                  <BookOpen size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-black tracking-tight">Thẻ Ghi Nhớ</span>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest group-hover/btn:text-primary transition-colors">Flashcards AI</span>
                </div>
                <ChevronRight size={14} className="ml-auto text-zinc-700 group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => router.push(`/doc/${docId}/quiz`)}
                className="group/btn relative w-full flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] bg-zinc-900/50 border border-white/5 text-white/80 hover:text-white hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover/btn:scale-110 transition-transform">
                  <Trophy size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-black tracking-tight">Làm Bài Kiểm Tra</span>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest group-hover/btn:text-amber-500 transition-colors">Quiz AI Generation</span>
                </div>
                <ChevronRight size={14} className="ml-auto text-zinc-700 group-hover/btn:text-amber-500 group-hover/btn:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
