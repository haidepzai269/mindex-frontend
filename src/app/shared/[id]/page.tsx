"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  GitFork,
  Loader2,
  MessageSquare,
  User,
  Clock,
  AlertTriangle,
  Zap,
  ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface SharedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SharedLinkData {
  link_id: string;
  document_id: string;
  session_id: string;
  document: { id: string; title: string; status: string };
  creator: { display_name: string };
  settings: { show_history: boolean; allow_fork: boolean };
  summary: string | null;
  messages: SharedMessage[];
  created_at: string;
  expired_at: string | null;
}

export default function SharedViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: linkId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<SharedLinkData | null>(null);
  const [error, setError] = useState<"NOT_FOUND" | "EXPIRED" | "ERROR" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSharedLink() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/public/shared/${linkId}`
        );
        if (res.status === 404) { setError("NOT_FOUND"); return; }
        if (res.status === 410) { setError("EXPIRED"); return; }
        if (!res.ok) { setError("ERROR"); return; }
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError("ERROR");
      } catch {
        setError("ERROR");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSharedLink();
  }, [linkId]);

  const handleFork = () => {
    if (!data) return;
    router.push(
      `/doc/${data.document_id}/chat?fork=${linkId}`
    );
  };

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020205] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="text-purple-500 animate-spin" />
          <span className="text-[11px] font-black text-zinc-600 tracking-[0.2em] uppercase">
            Loading shared session...
          </span>
        </div>
      </div>
    );
  }

  // ---- Error States ----
  if (error) {
    const errorConfig = {
      NOT_FOUND: {
        icon: <AlertTriangle size={40} className="text-red-400" />,
        title: "Không tìm thấy",
        desc: "Link chia sẻ này không tồn tại hoặc đã bị xóa.",
      },
      EXPIRED: {
        icon: <Clock size={40} className="text-amber-400" />,
        title: "Link đã hết hạn",
        desc: "Tài liệu gốc đã hết hạn lưu trữ. Link chia sẻ nhám mình theo đó.",
      },
      ERROR: {
        icon: <AlertTriangle size={40} className="text-red-400" />,
        title: "Có lỗi xảy ra",
        desc: "Không thể tải nội dung. Vui lòng thử lại sau.",
      },
    }[error];

    return (
      <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            {errorConfig.icon}
          </div>
          <h1 className="text-2xl font-black text-white mb-3">
            {errorConfig.title}
          </h1>
          <p className="text-zinc-500 text-sm font-medium mb-6">
            {errorConfig.desc}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-white text-black font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const expiredAt = data.expired_at ? new Date(data.expired_at) : null;
  const timeLeft = expiredAt
    ? (() => {
        const diff = expiredAt.getTime() - Date.now();
        if (diff <= 0) return "Đã hết hạn";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `Còn ${hours}h ${mins}m`;
      })()
    : null;

  return (
    <div className="h-screen overflow-y-auto bg-[#020205] text-zinc-50 custom-scrollbar">
      {/* Header Banner */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mindex logo mark */}
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Zap size={16} className="text-purple-400 fill-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Mindex · Shared Session
                </span>
              </div>
              <h1 className="text-[15px] font-black text-white truncate max-w-[400px]">
                {data.document.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {timeLeft && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Clock size={11} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400">
                  {timeLeft}
                </span>
              </div>
            )}

            {data.settings.allow_fork && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFork}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-black text-[12px] rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
              >
                <GitFork size={14} />
                Tiếp tục hỏi
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Meta Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-500">
            <User size={13} />
            <span className="text-[12px] font-bold">
              Chia sẻ bởi{" "}
              <span className="text-zinc-300">
                {data.creator.display_name || "Người dùng"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock size={13} />
            <span className="text-[12px] font-bold">
              {formatDistanceToNow(new Date(data.created_at), {
                addSuffix: true,
                locale: vi,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <FileText size={13} />
            <span className="text-[12px] font-bold">
              {data.messages.length} tin nhắn
            </span>
          </div>
        </div>

        {/* Summary Card */}
        {data.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-[24px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap size={12} className="text-purple-400" />
              </div>
              <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">
                Tóm tắt hội thoại · AI Generated
              </span>
            </div>
            <p className="text-[14px] text-zinc-300 font-medium leading-relaxed">
              {data.summary}
            </p>
          </motion.div>
        )}

        {/* Chat History */}
        {data.settings.show_history && data.messages.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare size={14} className="text-zinc-600" />
              <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                Lịch sử hội thoại
              </h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-6">
              {data.messages.map((msg, i) => (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mr-3 mt-1">
                      <Zap size={12} className="text-purple-400 fill-purple-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-[20px] px-5 py-4 ${
                      msg.role === "user"
                        ? "bg-white/10 border border-white/10 text-white"
                        : "bg-white/[0.03] border border-white/5 text-zinc-200"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none text-[14px] leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[14px] font-medium leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                    <span className="text-[10px] text-zinc-600 mt-2 block font-bold">
                      {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center ml-3 mt-1">
                      <User size={12} className="text-zinc-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ) : !data.settings.show_history ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={20} className="text-zinc-600" />
            </div>
            <p className="text-[13px] font-bold text-zinc-600">
              Người chia sẻ đã ẩn lịch sử hội thoại
            </p>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[13px] font-bold text-zinc-600">
              Chưa có nội dung hội thoại
            </p>
          </div>
        )}

        {/* Fork CTA bottom */}
        {data.settings.allow_fork && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 p-6 bg-white/[0.02] border border-white/10 rounded-[28px] text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <GitFork size={20} className="text-white" />
            </div>
            <h3 className="text-[16px] font-black text-white mb-2">
              Tiếp tục hội thoại này
            </h3>
            <p className="text-[12px] text-zinc-500 font-medium mb-5">
              Tạo phiên chat riêng của bạn, kế thừa ngữ cảnh từ người chia sẻ
            </p>
            <button
              onClick={handleFork}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-black text-[12px] rounded-2xl uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
            >
              <GitFork size={14} />
              Bắt đầu hỏi
              <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
