"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Sparkles } from "lucide-react";

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
      }
    } catch (err: any) {
      if (err.status === 429) {
        toast.error("Hết quota hôm nay!", {
          description: err.data?.message || "Bạn đã dùng hết lượt tạo quiz miễn phí hôm nay",
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
    if (!quizId) return;
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
      setResults(res.answers || []);
      setScore(res.score || 0);
      setState("submitted");
    } catch {
      toast.error("Không thể nộp bài, vui lòng thử lại");
    }
  };

  const resultMap = results.reduce((m, r) => ({ ...m, [r.question_id]: r }), {} as Record<string, AnswerResult>);

  // ─── Config Screen ────────────────────────────────────────────────────────
  if (state === "config") return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-4 py-12">
      <button onClick={() => router.back()} className="self-start mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold">
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="w-full max-w-md">
        <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 rotate-3 mx-auto">
          <Sparkles size={28} className="text-primary" />
        </div>
        <h1 className="text-3xl font-black text-white text-center mb-2">Tạo Quiz</h1>
        <p className="text-zinc-500 text-center text-sm mb-10">Cấu hình bài kiểm tra của bạn</p>

        {/* Số câu */}
        <div className="mb-6">
          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Số câu hỏi</label>
          <div className="flex gap-2">
            {[5, 10, 20].map((n) => (
              <button key={n} onClick={() => setNumQ(n)}
                className={cn("flex-1 py-3 rounded-xl border font-black text-sm transition-all",
                  numQ === n ? "bg-primary/20 border-primary/40 text-primary" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                )}>{n} câu</button>
            ))}
          </div>
        </div>

        {/* Loại câu */}
        <div className="mb-6">
          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Dạng câu hỏi</label>
          <div className="flex gap-2">
            {[{ v: "mcq", l: "Trắc nghiệm" }, { v: "essay", l: "Tự luận" }, { v: "mix", l: "Hỗn hợp" }].map((opt) => (
              <button key={opt.v} onClick={() => setQType(opt.v as any)}
                className={cn("flex-1 py-3 rounded-xl border font-bold text-[12px] transition-all",
                  qType === opt.v ? "bg-primary/20 border-primary/40 text-primary" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                )}>{opt.l}</button>
            ))}
          </div>
        </div>

        {/* Độ khó */}
        <div className="mb-10">
          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Độ khó</label>
          <div className="flex gap-2">
            {[{ v: "easy", l: "Dễ" }, { v: "medium", l: "Trung bình" }, { v: "hard", l: "Khó" }, { v: "mix", l: "Tổng hợp" }].map((opt) => (
              <button key={opt.v} onClick={() => setDifficulty(opt.v)}
                className={cn("flex-1 py-2.5 rounded-xl border font-bold text-[11px] transition-all",
                  difficulty === opt.v ? "bg-primary/20 border-primary/40 text-primary" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                )}>{opt.l}</button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate}
          className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-2">
          <Sparkles size={16} /> Bắt đầu Quiz AI
        </button>
        <p className="text-center text-[11px] text-zinc-700 mt-3">Free: 1 lượt tạo quiz/ngày · Nâng cấp Pro để không giới hạn</p>
      </div>
    </div>
  );

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (state === "loading") return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-primary animate-spin" />
      <p className="text-zinc-500 font-bold text-sm animate-pulse">AI đang tạo câu hỏi...</p>
    </div>
  );

  // ─── Playing Screen ───────────────────────────────────────────────────────
  if (state === "playing" && currentQ) return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-zinc-500">Câu {currentIdx + 1} / {questions.length}</span>
          <span className="text-[12px] font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full max-w-2xl">
        <div className="p-8 rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-xl mb-6">
          <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-4">
            {currentQ.type === "mcq" ? "TRẮC NGHIỆM" : "TỰ LUẬN"}
          </p>
          <p className="text-lg font-black text-white leading-relaxed">{currentQ.question}</p>
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
                      : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  )}>
                  <span className={cn(
                    "w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-black flex-shrink-0",
                    selected ? "bg-primary border-primary text-white" : "border-zinc-700 text-zinc-600"
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
            className="w-full p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-zinc-200 text-[14px] leading-relaxed resize-none focus:border-primary/50 focus:outline-none transition-all placeholder:text-zinc-700"
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button onClick={() => setCurrentIdx((i) => i - 1)} disabled={currentIdx === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-20 text-sm font-bold transition-all">
            <ArrowLeft size={14} /> Trước
          </button>

          {currentIdx < questions.length - 1 ? (
            <button onClick={() => setCurrentIdx((i) => i + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm font-black hover:bg-zinc-700 transition-all">
              Tiếp theo <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
              Nộp bài <Trophy size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Result Screen ────────────────────────────────────────────────────────
  if (state === "submitted") return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center px-4 py-12">
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
        <p className="text-zinc-500 text-sm mt-2">
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
              "bg-zinc-900/30 border-zinc-800"
            )}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-black text-zinc-600 mt-0.5">#{i + 1}</span>
                {isCorrect === true && <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
                {isCorrect === false && <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <p className="text-[14px] font-bold text-white">{q.question}</p>
              </div>

              {q.type === "mcq" && q.options && res && (
                <div className="ml-7 space-y-1">
                  {q.options.map((opt, oi) => {
                    const isUserAnswer = answers[q.id] === oi;
                    return (
                      <p key={oi} className={cn("text-[12px] font-medium px-3 py-1 rounded-lg",
                        isUserAnswer && isCorrect ? "bg-emerald-500/20 text-emerald-300" :
                        isUserAnswer && !isCorrect ? "bg-red-500/20 text-red-300 line-through" :
                        "text-zinc-600"
                      )}>
                        {["A", "B", "C", "D"][oi]}. {opt}
                      </p>
                    );
                  })}
                </div>
              )}

              {res?.explanation && (
                <p className="ml-7 mt-3 text-[12px] text-zinc-500 italic">
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
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-sm font-bold transition-all">
          <RotateCcw size={14} /> Làm quiz mới
        </button>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-all">
          <ArrowLeft size={14} /> Về tài liệu
        </button>
      </div>
    </div>
  );

  return null;
}
