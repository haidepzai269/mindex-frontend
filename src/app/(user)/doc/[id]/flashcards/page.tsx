"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, RotateCcw, ChevronLeft, ChevronRight,
  Sparkles, Download, BookOpen, CheckCircle, XCircle,
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
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider", cfg[d] || "bg-zinc-700/30 text-zinc-400")}>
      {d}
    </span>
  );
}

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: docId } = use(params);
  const router = useRouter();

  // set_id từ URL hoặc lấy set mới nhất
  const { data: setsData, isLoading: setsLoading, mutate: mutateSets } =
    useSWR<{ success: boolean; data: any[] }>(`/study/docs/${docId}/flashcards`, fetcher as any);

  const sets = setsData?.data ?? [];
  const latestSet = sets[0];

  const { data: cardsData, isLoading: cardsLoading, mutate: mutateCards } =
    useSWR<{ success: boolean; data: Flashcard[] }>(
      latestSet ? `/study/flashcards/${latestSet.id}` : null,
      fetcher as any
    );

  const cards = cardsData?.data ?? [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      if (e.key === " ") { e.preventDefault(); setIsFlipped((f) => !f); }
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
    setTimeout(() => setCurrentIdx((i) => (i - 1 + cards.length) % cards.length), 150);
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
      const res: any = await fetchApi(`/study/docs/${docId}/flashcards/generate`, { method: "POST" });
      if (res.success) {
        toast.success(`Đã tạo ${res.count} flashcard!`);
        if (res.is_capped) {
          toast.info("Bạn đang dùng gói Free — Giới hạn 20 card/bộ. Nâng cấp Pro để tạo nhiều hơn!");
        }
        mutateSets();
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo flashcard");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    if (!latestSet) return;
    setExporting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/flashcards/${latestSet.id}/export?format=csv`, {
        credentials: "include",
      });
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

  if (setsLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#050505]">
      <Loader2 size={32} className="text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!latestSet || exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 text-[12px] font-bold transition-all disabled:opacity-30"
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Export CSV
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 text-[12px] font-bold transition-all disabled:opacity-50"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
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
          <h2 className="text-2xl font-black text-white mb-3">Chưa có Flashcard</h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-sm">
            Nhấn nút bên dưới để AI tự động tạo flashcard từ nội dung tài liệu này.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {generating ? "Đang tạo flashcard..." : "✨ Tạo Flashcard"}
          </button>
        </div>
      )}

      {/* Flashcard Review UI */}
      {cards.length > 0 && currentCard && (
        <>
          {/* Progress Bar */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-zinc-500">
                {currentIdx + 1} / {cards.length}
              </span>
              <span className="text-[12px] font-bold text-emerald-400">
                Đã nhớ: {remembered}/{cards.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
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
                    i === currentIdx ? "bg-primary" : card.remembered ? "bg-emerald-500/60" : "bg-zinc-800"
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
                className="absolute inset-0 rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-10 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <DifficultyBadge d={currentCard.difficulty} />
                  {currentCard.topic && (
                    <span className="text-[10px] text-zinc-600 font-medium">{currentCard.topic}</span>
                  )}
                </div>
                <p className="text-xl font-black text-white text-center leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-[11px] text-zinc-600 mt-6 font-bold">
                  Nhấn Space hoặc click để lật thẻ
                </p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-[32px] border border-primary/20 bg-primary/5 backdrop-blur-xl p-10 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-[15px] text-zinc-200 text-center leading-relaxed whitespace-pre-line">
                  {currentCard.back}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={prevCard}
              className="p-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
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
                className="px-8 py-3 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 font-black text-sm transition-all"
              >
                Lật thẻ (Space)
              </button>
            )}

            <button
              onClick={nextCard}
              className="p-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
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
                  setTimeout(() => { mutateCards(); setCurrentIdx(0); }, 500);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white text-sm font-bold transition-all"
              >
                <RotateCcw size={14} /> Ôn lại từ đầu
              </button>
            </div>
          )}

          {/* Keyboard Hint */}
          <p className="mt-6 text-[11px] text-zinc-700 text-center">
            Space = lật · ← → = chuyển card · (sau khi lật) ✓ = Nhớ rồi
          </p>
        </>
      )}
    </div>
  );
}
