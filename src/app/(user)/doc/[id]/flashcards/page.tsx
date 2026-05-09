"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  BookOpen,
  CheckCircle,
  XCircle,
  Brain,
  Flame,
} from "lucide-react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
  topic?: string;
  position: number;
  remembered: boolean;
};

// Màu badge độ khó
function DifficultyBadge({ d }: { d: string }) {
  const cfg: Record<string, string> = {
    easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    hard: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
        cfg[d] || "bg-muted/30 text-muted-foreground",
      )}
    >
      {d}
    </span>
  );
}

export default function FlashcardsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: docId } = use(params);
  const router = useRouter();

  // set_id từ URL hoặc lấy set mới nhất
  const {
    data: setsData,
    isLoading: setsLoading,
    mutate: mutateSets,
  } = useSWR<{ success: boolean; data: any[] }>(
    `/study/docs/${docId}/flashcards`,
    fetcher as any,
  );

  const sets = setsData?.data ?? [];
  const latestSet = sets[0];

  const {
    data: cardsData,
    isLoading: cardsLoading,
    mutate: mutateCards,
  } = useSWR<{ success: boolean; data: Flashcard[] }>(
    latestSet ? `/study/flashcards/${latestSet.id}` : null,
    fetcher as any,
  );

  const cards = cardsData?.data ?? [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [numCards, setNumCards] = useState(20);
  const [exporting, setExporting] = useState(false);

  // SM-2 Review Mode
  const [reviewMode, setReviewMode] = useState(false);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);

  const { data: dueData } = useSWR<{ success: boolean; data: Flashcard[]; due_count: number }>(
    latestSet ? `/study/flashcards/${latestSet.id}/due` : null,
    fetcher as any
  );
  const dueCount = dueData?.due_count ?? 0;

  const currentCard = cards[currentIdx];
  const remembered = cards.filter((c) => c.remembered).length;

  // Reset index khi set thay đổi
  useEffect(() => {
    setCurrentIdx(0);
    setIsFlipped(false);
  }, [latestSet?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIdx, cards.length]);

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIdx((i) => (i + 1) % cards.length), 150);
  }, [cards.length]);

  const prevCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(
      () => setCurrentIdx((i) => (i - 1 + cards.length) % cards.length),
      150,
    );
  }, [cards.length]);

  const markCard = async (remembered: boolean) => {
    if (!currentCard) return;
    try {
      await fetchApi(`/study/flashcards/${currentCard.id}/mark`, {
        method: "PATCH",
        body: JSON.stringify({ remembered }),
      });
      mutateCards();
      // Nếu đánh dấu nhớ rồi, tự động next
      if (remembered) nextCard();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res: any = await fetchApi(
        `/study/docs/${docId}/flashcards/generate`,
        {
          method: "POST",
          body: JSON.stringify({ num_cards: numCards }),
        },
      );
      if (res.success) {
        toast.success(`Đã tạo ${res.count} flashcard!`);
        if (res.is_capped) {
          toast.info(
            "Bạn đang dùng gói Free — Giới hạn 20 card/bộ. Nâng cấp Pro để tạo nhiều hơn!",
          );
        }
        mutateSets();
      }
    } catch (err: any) {
      if (err.status === 403 && err.data?.error === "LIMIT_REACHED") {
        toast.error("Giới hạn tài liệu!", {
          description: "Tài liệu này đã đạt giới hạn 2 lần tạo flashcard.",
        });
      } else {
        toast.error(err.message || "Không thể tạo flashcard");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    if (!latestSet) return;
    setExporting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/study/flashcards/${latestSet.id}/export?format=csv`,
        {
          credentials: "include",
        },
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flashcards_${docId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã export CSV thành công!");
    } catch {
      toast.error("Không thể export");
    } finally {
      setExporting(false);
    }
  };

  if (setsLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="flex items-center gap-2">
          {dueCount > 0 && latestSet && (
            <button
              onClick={() => {
                setDueCards(dueData?.data || []);
                setReviewIdx(0);
                setReviewFlipped(false);
                setReviewMode(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-500 hover:bg-orange-500/30 text-[12px] font-bold transition-all"
            >
              <Flame size={12} />
              Ôn tập hôm nay ({dueCount})
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={!latestSet || exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 text-[12px] font-bold transition-all disabled:opacity-30"
          >
            {exporting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Download size={12} />
            )}
            Export CSV
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 text-[12px] font-bold transition-all disabled:opacity-50"
          >
            {generating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            {generating ? "Đang tạo..." : "Tạo bộ mới"}
          </button>
        </div>
      </div>

      {/* Nếu chưa có flashcard */}
      {sets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 rotate-6">
            <BookOpen size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">
            Chưa có Flashcard
          </h2>
          <p className="text-muted-foreground text-sm mb-10 max-w-sm">
            AI sẽ tự động tạo flashcard từ nội dung tài liệu này (tối đa 2
            bộ/tài liệu).
          </p>

          <div className="w-full max-w-xs mb-10">
            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-3 block text-center">
              Chọn số lượng thẻ mong muốn
            </label>
            <div className="flex gap-2">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setNumCards(n)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl border font-black text-xs transition-all",
                    numCards === n
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {generating ? "Đang tạo flashcard..." : "Tạo Flashcard AI"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground/40 mt-4 italic">
            Mỗi tài liệu được tạo tối đa 2 bộ thẻ · Hỗ trợ cache Redis
          </p>
        </div>
      )}

      {/* Flashcard Review UI */}
      {cards.length > 0 && currentCard && (
        <>
          {/* Progress Bar */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-muted-foreground">
                {currentIdx + 1} / {cards.length}
              </span>
              <span className="text-[12px] font-bold text-emerald-400">
                Đã nhớ: {remembered}/{cards.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }}
              />
            </div>
            {/* Remembered indicators */}
            <div className="flex gap-0.5 mt-2">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all",
                    i === currentIdx
                      ? "bg-primary"
                      : card.remembered
                        ? "bg-emerald-500/60"
                        : "bg-muted/60",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Card với 3D Flip */}
          <div
            className="w-full max-w-2xl cursor-pointer"
            style={{ perspective: "1200px" }}
            onClick={() => setIsFlipped((f) => !f)}
          >
            <div
              className="relative transition-all duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                minHeight: "280px",
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-[32px] border border-border bg-card/80 backdrop-blur-xl p-10 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <DifficultyBadge d={currentCard.difficulty} />
                  {currentCard.topic && (
                    <span className="text-[10px] text-muted-foreground/50 font-medium">
                      {currentCard.topic}
                    </span>
                  )}
                </div>
                <p className="text-xl font-black text-foreground text-center leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-6 font-bold">
                  Nhấn Space hoặc click để lật thẻ
                </p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-[32px] border border-primary/20 bg-primary/5 backdrop-blur-xl p-10 flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-[15px] text-foreground text-center leading-relaxed whitespace-pre-line">
                  {currentCard.back}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={prevCard}
              className="p-3 rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            {isFlipped && (
              <>
                <button
                  onClick={() => markCard(false)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-black text-sm transition-all"
                >
                  <XCircle size={16} /> Chưa nhớ
                </button>
                <button
                  onClick={() => markCard(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-black text-sm transition-all"
                >
                  <CheckCircle size={16} /> Nhớ rồi →
                </button>
              </>
            )}

            {!isFlipped && (
              <button
                onClick={() => setIsFlipped(true)}
                className="px-8 py-3 rounded-2xl bg-secondary border border-border text-secondary-foreground hover:bg-secondary/80 font-black text-sm transition-all"
              >
                Lật thẻ (Space)
              </button>
            )}

            <button
              onClick={nextCard}
              className="p-3 rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Reset Button */}
          {remembered === cards.length && (
            <div className="mt-8 flex flex-col items-center gap-3 animate-in fade-in duration-500">
              <p className="text-emerald-400 font-black text-lg">
                🎉 Bạn đã nhớ hết tất cả {cards.length} thẻ!
              </p>
              <button
                onClick={() => {
                  cards.forEach((c) => {
                    fetchApi(`/study/flashcards/${c.id}/mark`, {
                      method: "PATCH",
                      body: JSON.stringify({ remembered: false }),
                    });
                  });
                  setTimeout(() => {
                    mutateCards();
                    setCurrentIdx(0);
                  }, 500);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-bold transition-all"
              >
                <RotateCcw size={14} /> Ôn lại từ đầu
              </button>
            </div>
          )}

          {/* Keyboard Hint */}
          <p className="mt-6 text-[11px] text-muted-foreground/40 text-center">
            Space = lật · ← → = chuyển card · (sau khi lật) ✓ = Nhớ rồi
          </p>
        </>
      )}

      {/* ── SM-2 Review Mode Overlay ── */}
      {reviewMode && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
          {dueCards.length === 0 || reviewIdx >= dueCards.length ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={36} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black">Hoàn thành! 🎉</h2>
              <p className="text-muted-foreground text-sm">Bạn đã ôn tập xong tất cả thẻ đến hạn hôm nay.</p>
              <button onClick={() => { setReviewMode(false); mutateCards(); }}
                className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-sm">
                Xong
              </button>
            </div>
          ) : (
            <>
              <div className="w-full max-w-lg mb-4 flex items-center justify-between">
                <button onClick={() => setReviewMode(false)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-bold">
                  <ArrowLeft size={14} /> Thoát
                </button>
                <span className="text-xs text-muted-foreground font-bold">
                  <Brain size={12} className="inline mr-1" />
                  Ôn tập: {reviewIdx + 1}/{dueCards.length}
                </span>
              </div>

              {/* Review Card */}
              <div className="w-full max-w-lg cursor-pointer" style={{ perspective: "1200px" }} onClick={() => setReviewFlipped(f => !f)}>
                <div style={{
                  position: "relative", transformStyle: "preserve-3d",
                  transition: "transform 0.5s", height: 260,
                  transform: reviewFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
                    className="flex flex-col items-center justify-center p-8 rounded-[28px] border border-border bg-card/80 text-center">
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-3">MẶT TRƯỚC</p>
                    <p className="text-lg font-black">{dueCards[reviewIdx]?.front}</p>
                    <p className="text-xs text-muted-foreground mt-4">Nhấn để xem đáp án</p>
                  </div>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    className="flex flex-col items-center justify-center p-8 rounded-[28px] border border-primary/30 bg-primary/5 text-center">
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-3">MẶT SAU</p>
                    <p className="text-sm leading-relaxed">{dueCards[reviewIdx]?.back}</p>
                  </div>
                </div>
              </div>

              {/* Quality Rating */}
              {reviewFlipped && (
                <div className="mt-6 w-full max-w-lg">
                  <p className="text-xs font-bold text-muted-foreground text-center mb-3">Bạn nhớ mức độ nào?</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { q: 1, label: "Quên", color: "bg-red-500/20 border-red-500/40 text-red-400" },
                      { q: 2, label: "Khó", color: "bg-orange-500/20 border-orange-500/40 text-orange-400" },
                      { q: 3, label: "Nhớ mờ", color: "bg-amber-500/20 border-amber-500/40 text-amber-400" },
                      { q: 4, label: "Tốt", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" },
                      { q: 5, label: "Hoàn hảo", color: "bg-blue-500/20 border-blue-500/40 text-blue-400" },
                    ].map(({ q, label, color }) => (
                      <button key={q} onClick={async () => {
                        await fetchApi(`/study/flashcards/${dueCards[reviewIdx].id}/mark`, {
                          method: "PATCH",
                          body: JSON.stringify({ remembered: q >= 3, quality: q }),
                        });
                        setReviewFlipped(false);
                        setTimeout(() => setReviewIdx(i => i + 1), 150);
                      }} className={`flex flex-col items-center gap-1 py-2 rounded-xl border font-bold text-xs transition-all hover:scale-105 ${color}`}>
                        <span className="text-base">{q}</span>
                        <span className="text-[9px]">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
