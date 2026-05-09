"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi, fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Sparkles, History, Star, Clock } from "lucide-react";
import useSWR from "swr";

type QuizQuestion = {
  id: string;
  type: "mcq" | "essay";
  question: string;
  options?: string[];
  position: number;
};

type AnswerResult = {
  question_id: string;
  user_answer: any;
  is_correct?: boolean;
  score: number;
  explanation: string;
};

type QuizState = "config" | "loading" | "playing" | "submitted";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: docId } = use(params);
  const router = useRouter();

  const [state, setState] = useState<QuizState>("config");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({}); // question_id -> answer
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Config state
  const [numQ, setNumQ] = useState(10);
  const [qType, setQType] = useState<"mcq" | "essay" | "mix">("mcq");
  const [difficulty, setDifficulty] = useState("mix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: historyData, isLoading: historyLoading } = useSWR(
    showHistory ? `/study/docs/${docId}/quiz/history` : null,
    fetcher as any
  ) as { data: any; isLoading: boolean };
  const quizHistory: any[] = historyData?.data || [];

  const currentQ = questions[currentIdx];
  const progress = questions.length ? ((currentIdx) / questions.length) * 100 : 0;

  const handleGenerate = async () => {
    setState("loading");
    try {
      const res: any = await fetchApi(`/study/docs/${docId}/quiz/generate`, {
        method: "POST",
        body: JSON.stringify({ num_questions: numQ, type: qType, difficulty }),
      });
      if (res.success && res.quiz_id) {
        // Lấy câu hỏi
        const quizData: any = await fetchApi(`/study/quiz/${res.quiz_id}`);
        setQuizId(res.quiz_id);
        setQuestions(quizData.questions || []);
        setStartTime(Date.now());
        setState("playing");
      } else {
        toast.error(res.message || "Không thể tạo quiz, vui lòng thử lại");
        setState("config");
      }
    } catch (err: any) {
      if (err.status === 429) {
        toast.error("Hết hạn mức hôm nay!", {
          description: err.data?.message || "Bạn đã dùng hết lượt tạo quiz cho gói cước hiện tại.",
        });
      } else {
        toast.error("Không thể tạo quiz, vui lòng thử lại");
      }
      setState("config");
    }
  };

  const handleSelectAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quizId || isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const answersPayload = Object.entries(answers).map(([qId, ans]) => ({
      question_id: qId,
      answer: ans,
    }));
    try {
      const res: any = await fetchApi(`/study/quiz/${quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersPayload, time_spent_sec: timeSpent }),
      });
      if (res.success) {
        setResults(res.answers || []);
        setScore(res.score || 0);
        setState("submitted");
      } else {
        toast.error(res.message || "Không thể nộp bài");
      }
    } catch {
      toast.error("Không thể nộp bài, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultMap = results.reduce((m, r) => ({ ...m, [r.question_id]: r }), {} as Record<string, AnswerResult>);

  // ─── History Screen ───────────────────────────────────────────────────────
  if (state === "config" && showHistory) return (
    <div className="h-full w-full bg-background text-foreground overflow-y-auto">
      <div className="min-h-full flex flex-col px-4 py-8 max-w-2xl mx-auto">
        <button onClick={() => setShowHistory(false)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-bold mb-6">
          <ArrowLeft size={16} /> Quay lại tạo quiz
        </button>
        <h2 className="text-xl font-black mb-6 flex items-center gap-2"><History size={20} className="text-primary" /> Lịch sử Quiz</h2>
        {historyLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : quizHistory.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Chưa có lần làm quiz nào.</div>
        ) : (
          <div className="space-y-3">
            {quizHistory.map((q: any) => (
              <div key={q.id} className="p-4 rounded-2xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm truncate">{q.title || `Quiz ${q.question_count} câu`}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{q.question_count} câu</span>
                </div>
                {q.attempt_count > 0 ? (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <History size={12} /> {q.attempt_count} lần
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500" />
                      <span className="font-bold text-amber-500">Cao nhất: {Math.round(q.best_score || 0)}%</span>
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={12} /> Gần nhất: {Math.round(q.last_score || 0)}%
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chưa làm lần nào</p>
                )}
                <button
                  onClick={async () => {
                    const quizData: any = await fetchApi(`/study/quiz/${q.id}`);
                    setQuizId(q.id);
                    setQuestions(quizData.questions || []);
                    setStartTime(Date.now());
                    setAnswers({});
                    setCurrentIdx(0);
                    setShowHistory(false);
                    setState("playing");
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Làm lại →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Config Screen ────────────────────────────────────────────────────────
  if (state === "config") return (
    <div className="h-full w-full bg-background text-foreground overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
      <button onClick={() => router.back()} className="self-start mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold">
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="w-full max-w-md">
        <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 rotate-3 mx-auto">
          <Sparkles size={28} className="text-primary" />
        </div>
        <h1 className="text-3xl font-black text-foreground text-center mb-2">Tạo Quiz</h1>
        <p className="text-muted-foreground text-center text-sm mb-10">Cấu hình bài kiểm tra của bạn</p>

        {/* Số câu */}
        <div className="mb-6">
          <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Số câu hỏi</label>
          <div className="flex gap-2">
            {[5, 10, 20].map((n) => (
              <button key={n} onClick={() => setNumQ(n)}
                className={cn("flex-1 py-3 rounded-xl border font-black text-sm transition-all",
                  numQ === n ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}>{n} câu</button>
            ))}
          </div>
        </div>

        {/* Loại câu */}
        <div className="mb-6">
          <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Dạng câu hỏi</label>
          <div className="flex gap-2">
            {[{ v: "mcq", l: "Trắc nghiệm" }, { v: "essay", l: "Tự luận" }, { v: "mix", l: "Hỗn hợp" }].map((opt) => (
              <button key={opt.v} onClick={() => setQType(opt.v as any)}
                className={cn("flex-1 py-3 rounded-xl border font-bold text-[12px] transition-all",
                  qType === opt.v ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}>{opt.l}</button>
            ))}
          </div>
        </div>

        {/* Độ khó */}
        <div className="mb-10">
          <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Độ khó</label>
          <div className="flex gap-2">
            {[{ v: "easy", l: "Dễ" }, { v: "medium", l: "Trung bình" }, { v: "hard", l: "Khó" }, { v: "mix", l: "Tổng hợp" }].map((opt) => (
              <button key={opt.v} onClick={() => setDifficulty(opt.v)}
                className={cn("flex-1 py-2.5 rounded-xl border font-bold text-[11px] transition-all",
                  difficulty === opt.v ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}>{opt.l}</button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
          <Sparkles size={16} /> Bắt đầu Quiz AI
        </button>
        <p className="text-center text-[11px] text-muted-foreground/50 mt-3 italic">Hạn mức: Free (1) · Pro (3) · Ultra (10) lượt/ngày</p>
        <button onClick={() => setShowHistory(true)}
          className="w-full mt-3 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-bold flex items-center justify-center gap-2 transition-all">
          <History size={14} /> Xem lịch sử quiz
        </button>
      </div>
      </div>
    </div>
  );

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (state === "loading") return (
    <div className="h-full w-full bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-primary animate-spin" />
      <p className="text-muted-foreground font-bold text-sm animate-pulse">AI đang tạo câu hỏi...</p>
    </div>
  );

  // ─── Playing Screen ───────────────────────────────────────────────────────
  if (state === "playing" && currentQ) return (
    <div className="h-full w-full bg-background text-foreground overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-muted-foreground">Câu {currentIdx + 1} / {questions.length}</span>
          <span className="text-[12px] font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full max-w-2xl">
        <div className="p-8 rounded-[32px] border border-border bg-card/60 backdrop-blur-xl mb-6">
          <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest mb-4">
            {currentQ.type === "mcq" ? "TRẮC NGHIỆM" : "TỰ LUẬN"}
          </p>
          <p className="text-lg font-black text-foreground leading-relaxed">{currentQ.question}</p>
        </div>

        {/* MCQ Options */}
        {currentQ.type === "mcq" && currentQ.options && (
          <div className="grid gap-3">
            {currentQ.options.map((opt, i) => {
              const selected = answers[currentQ.id] === i;
              return (
                <button key={i} onClick={() => handleSelectAnswer(currentQ.id, i)}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left font-bold text-[14px] transition-all flex items-center gap-3",
                    selected
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-muted/20 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}>
                  <span className={cn(
                    "w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-black flex-shrink-0",
                    selected ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground"
                  )}>
                    {["A", "B", "C", "D"][i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Essay Input */}
        {currentQ.type === "essay" && (
          <textarea
            value={answers[currentQ.id] || ""}
            onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
            rows={5}
            className="w-full p-5 rounded-2xl border border-border bg-muted/40 text-foreground text-[14px] leading-relaxed resize-none focus:border-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button onClick={() => setCurrentIdx((i) => i - 1)} disabled={currentIdx === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground disabled:opacity-20 text-sm font-bold transition-all">
            <ArrowLeft size={14} /> Trước
          </button>

          {currentIdx < questions.length - 1 ? (
            <button onClick={() => setCurrentIdx((i) => i + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border text-secondary-foreground text-sm font-black hover:bg-secondary/80 transition-all">
              Tiếp theo <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-primary/10 disabled:opacity-50">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
              {isSubmitting ? "Đang chấm điểm..." : "Nộp bài"}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );

  // ─── Result Screen ────────────────────────────────────────────────────────
  if (state === "submitted") return (
    <div className="h-full w-full bg-background text-foreground overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-4 py-12">
      {/* Score */}
      <div className="flex flex-col items-center mb-12">
        <div className={cn(
          "w-28 h-28 rounded-[40px] border flex flex-col items-center justify-center mb-4",
          score >= 80 ? "bg-emerald-500/20 border-emerald-500/30" :
          score >= 50 ? "bg-amber-500/20 border-amber-500/30" :
          "bg-red-500/20 border-red-500/30"
        )}>
          <Trophy size={28} className={score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"} />
          <span className={cn("text-2xl font-black mt-1", score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400")}>
            {Math.round(score)}%
          </span>
        </div>
        <h2 className="text-2xl font-black">
          {score >= 80 ? "Xuất sắc! 🏆" : score >= 50 ? "Tốt! 👏" : "Cần ôn thêm 📚"}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          Đúng {results.filter((r) => r.is_correct).length}/{results.filter((r) => r.is_correct !== undefined).length} câu trắc nghiệm
        </p>
      </div>

      {/* Review Answers */}
      <div className="w-full max-w-2xl space-y-4">
        {questions.map((q, i) => {
          const res = resultMap[q.id];
          const isCorrect = res?.is_correct;
          return (
            <div key={q.id} className={cn(
              "p-6 rounded-[24px] border transition-all",
              isCorrect === true ? "bg-emerald-500/5 border-emerald-500/20" :
              isCorrect === false ? "bg-red-500/5 border-red-500/20" :
              "bg-muted/20 border-border"
            )}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-black text-muted-foreground/60 mt-0.5">#{i + 1}</span>
                {isCorrect === true && <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
                {isCorrect === false && <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <p className="text-[14px] font-bold text-foreground">{q.question}</p>
              </div>

              {q.type === "mcq" && q.options && res && (
                <div className="ml-7 space-y-1">
                  {q.options.map((opt, oi) => {
                    const isUserAnswer = answers[q.id] === oi;
                    return (
                      <p key={oi} className={cn("text-[12px] font-medium px-3 py-1 rounded-lg",
                        isUserAnswer && isCorrect ? "bg-emerald-500/20 text-emerald-300" :
                        isUserAnswer && !isCorrect ? "bg-red-500/20 text-red-300 line-through" :
                        "text-muted-foreground/60"
                      )}>
                        {["A", "B", "C", "D"][oi]}. {opt}
                      </p>
                    );
                  })}
                </div>
              )}

              {res?.explanation && (
                <p className="ml-7 mt-3 text-[12px] text-muted-foreground italic">
                  💡 {res.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-10">
        <button onClick={() => setState("config")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-bold transition-all">
          <RotateCcw size={14} /> Làm quiz mới
        </button>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition-all">
          <ArrowLeft size={14} /> Về tài liệu
        </button>
      </div>
      </div>
    </div>
  );

  return null;
}
