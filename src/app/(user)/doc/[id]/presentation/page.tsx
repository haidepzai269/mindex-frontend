"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { fetchApi, fetcher } from "@/lib/api";
import { PresentationViewer } from "@/components/user/PresentationViewer";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Tv,
  MessageSquare,
  FileText,
  Volume2,
  AlertCircle,
  BrainCircuit,
  CornerDownRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function PresentationPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Step messages during generation
  const loadingSteps = [
    "Đang đọc và phân tích cấu trúc tài liệu...",
    "Neural Core đang phân tách các ý chính trọng tâm...",
    "Đang thiết lập bố cục slide nghệ thuật (16:9)...",
    "Đang tạo giọng thuyết minh AI sống động cho từng slide...",
    "Đang hoàn tất upload tài nguyên Cloudinary...",
    "Đang đồng bộ hóa dữ liệu trình chiếu cuối cùng...",
  ];

  // Fetch presentation status/data
  const { data: resData, error, isLoading } = useSWR(
    docId ? `/study/docs/${docId}/presentation` : null,
    fetcher as any,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      // If pending, refresh every 4 seconds
      refreshInterval: (data) => {
        if (data?.data?.status === "pending") {
          return 4000;
        }
        return 0;
      },
    }
  );

  // Change loading step texts periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isPending = resData?.data?.status === "pending" || isGenerating;

    if (isPending) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [resData?.data?.status, isGenerating]);

  // If the backend returns pending on initial fetch, set local generation state
  useEffect(() => {
    if (resData?.data?.status === "pending") {
      setIsGenerating(true);
    } else if (resData?.data?.status === "done" || resData?.data?.status === "failed") {
      setIsGenerating(false);
      if (resData?.data?.status === "failed") {
        setErrorMsg("Có lỗi xảy ra trong quá trình AI biên soạn slide. Vui lòng thử tạo lại.");
      }
    }
  }, [resData?.data?.status]);

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const response = await fetchApi<any>(`/study/docs/${docId}/presentation/generate`, {
        method: "POST",
      });
      if (response.success) {
        // Mutate to fetch current pending status
        mutate(`/study/docs/${docId}/presentation`);
      } else {
        setIsGenerating(false);
        setErrorMsg(response.message || "Không thể khởi tạo tiến trình sinh Slide.");
      }
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMsg(
        err.response?.data?.message ||
          "Lỗi mạng khi kết nối tới máy chủ. Vui lòng kiểm tra lại."
      );
    }
  };

  const presentationData = resData?.data;
  const isPending = presentationData?.status === "pending" || isGenerating;
  const isDone = presentationData?.status === "done" && presentationData?.slides_data;

  // Render states
  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col p-4 md:p-8 select-none">
      {/* Background dynamic light effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-screen overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-primary/40 blur-[150px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[50%] h-[50%] rounded-full bg-rose-500/40 blur-[150px]" />
      </div>

      {/* Top navigation */}
      <div className="flex items-center gap-4 mb-6 z-10 print:hidden">
        <button
          onClick={() => router.push(`/doc/${docId}/chat`)}
          className="flex items-center justify-center p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-card/50 hover:bg-card/90 text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1.5">
          <BrainCircuit size={13} className="text-primary" />
          Neural Core / Slide &amp; Video AI
        </span>
      </div>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-6xl w-full mx-auto relative z-10">

        {/* Error message card */}
        {errorMsg && (
          <div className="w-full max-w-md p-4 mb-6 rounded-2xl bg-rose-950/20 border border-rose-900/50 text-rose-200 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
            <div className="grow">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg("")}
              className="text-rose-400 hover:text-rose-200 transition-colors uppercase tracking-wider font-black px-2 py-1"
            >
              Đóng
            </button>
          </div>
        )}

        {/* State 1: Loading initial data */}
        {isLoading && !isGenerating && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Đang liên kết với cơ sở dữ liệu...
            </p>
          </div>
        )}

        {/* State 2: Intro/Welcome Screen (Presentation not created yet) */}
        {!isLoading && !isPending && !isDone && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl p-8 md:p-10 rounded-[2.5rem] border border-border bg-card/60 backdrop-blur-3xl shadow-2xl flex flex-col items-center text-center space-y-6"
          >
            {/* Visual Icon Badge */}
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center shadow-lg shadow-primary/20 relative overflow-hidden">
              <Tv size={28} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Neural Slide &amp; Video AI
              </h2>
              <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">
                Chuyển đổi bài học thành trình chiếu thuyết trình
              </p>
            </div>

            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-md">
              Công nghệ Neural Core tự động tóm tắt nội dung tài liệu của bạn, sắp xếp thành bộ slide có bố cục trực quan cao cấp, kết hợp giọng đọc thuyết minh AI để tạo video học tập sinh động.
            </p>

            {/* Feature lists */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-left py-4">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <FileText size={15} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-foreground">Slide Bố Cục Nghệ Thuật</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                    Chia cột, trích dẫn, highlight và themes gradient hiện đại.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <Volume2 size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-foreground">Thuyết Minh Giọng Đọc AI</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                    Lồng tiếng trôi chảy tự nhiên, giúp tiếp thu bài học thụ động.
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleStartGeneration}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <Sparkles size={14} className="animate-pulse" />
              Bắt đầu tạo bằng AI
            </button>
          </motion.div>
        )}

        {/* State 3: Generating/Pending loading status */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-lg p-10 rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-2xl flex flex-col items-center justify-center text-center space-y-6"
          >
            {/* Spinning loading indicator */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-rose-500 animate-spin" />
              <Tv size={22} className="text-primary animate-pulse" />
            </div>

            {/* Text details */}
            <div className="space-y-1.5">
              <h3 className="text-md font-black tracking-tight text-foreground">
                Đang biên soạn Slide thuyết trình
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Tiến trình này có thể mất từ 1 đến 2 phút
              </p>
            </div>

            {/* Progress bar container */}
            <div className="w-full max-w-xs space-y-2">
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-primary to-rose-500 rounded-full animate-[shimmer_2.5s_infinite] w-1/3 absolute" />
              </div>
              <p className="text-xs font-medium text-primary/80 animate-pulse italic leading-relaxed min-h-[1.5rem]">
                {loadingSteps[loadingStep]}
              </p>
            </div>
          </motion.div>
        )}

        {/* State 4: Done & Rendering presentation slide viewer */}
        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full flex flex-col grow min-h-0"
          >
            <PresentationViewer
              slides={presentationData.slides_data}
              docTitle={presentationData.doc_title || "Tài Liệu Học Tập"}
              onRegenerate={handleStartGeneration}
              isRegenerating={isGenerating}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
