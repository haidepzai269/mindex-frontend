"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  X,
  Globe,
  MessageSquare,
  Link2,
  Eye,
  GitFork,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  initialIsPublic: boolean;
  onStatusUpdate: (isPublic: boolean) => void;
  // Session info cho tab "Chia sẻ đoạn chat"
  sessionId?: string | null;
  documentExpiredAt?: string | null;
}

type Tab = "document" | "chat";

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  initialIsPublic,
  onStatusUpdate,
  sessionId,
  documentExpiredAt,
}) => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<Tab>("document");

  // Tab: Tài liệu
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab: Đoạn chat
  const [showHistory, setShowHistory] = useState(true);
  const [allowFork, setAllowFork] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [chatShareLink, setChatShareLink] = useState<string | null>(null);
  const [isChatLinkCopied, setIsChatLinkCopied] = useState(false);

  useEffect(() => {
    setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  // Reset khi đóng dialog
  useEffect(() => {
    if (!isOpen) {
      setChatShareLink(null);
      setIsChatLinkCopied(false);
      setActiveTab("document");
    }
  }, [isOpen]);

  const docShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/doc/${documentId}/chat`
      : "";

  // ---- Tab Tài liệu ----
  const handleCopyDocLink = async () => {
    try {
      await navigator.clipboard.writeText(docShareUrl);
      setIsCopied(true);
      toast.success("Đã sao chép liên kết!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const handleDone = async () => {
    setIsSubmitting(true);
    try {
      const res: any = await fetchApi(`/community/documents/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_public: isPublic }),
      });

      if (res.success) {
        toast.success(
          isPublic
            ? "Đã chia sẻ lên thư viện chung!"
            : "Đã chuyển sang chế độ riêng tư."
        );
        onStatusUpdate(isPublic);
        onClose();
      } else {
        toast.error(res.error || "Có lỗi xảy ra.");
      }
    } catch (err: any) {
      if (err.data?.error === "SHARE_QUOTA_EXCEEDED") {
        toast.error("Vượt quá giới hạn!", {
          description: `Bạn chỉ được chia sẻ tối đa ${user?.quota?.publicDocsLimit || 3} tài liệu công khai.`,
        });
      } else {
        toast.error("Không thể cập nhật trạng thái chia sẻ.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Tab Đoạn chat ----
  const handleCreateChatLink = async () => {
    if (!sessionId) {
      toast.error("Chưa có đoạn chat nào để chia sẻ. Hãy bắt đầu hội thoại trước!");
      return;
    }

    setIsCreatingLink(true);
    try {
      const res: any = await fetchApi(`/documents/${documentId}/share`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          show_history: showHistory,
          allow_fork: allowFork,
        }),
      });

      if (res.success) {
        const url =
          typeof window !== "undefined"
            ? `${window.location.origin}${res.data.share_url}`
            : res.data.share_url;
        setChatShareLink(url);
        toast.success("Đã tạo link chia sẻ!");
      } else {
        toast.error(res.message || "Không thể tạo link chia sẻ.");
      }
    } catch {
      toast.error("Có lỗi khi tạo link chia sẻ.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyChatLink = async () => {
    if (!chatShareLink) return;
    try {
      await navigator.clipboard.writeText(chatShareLink);
      setIsChatLinkCopied(true);
      toast.success("Đã sao chép link chia sẻ chat!");
      setTimeout(() => setIsChatLinkCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép.");
    }
  };

  // Tính thời gian còn lại của tài liệu
  const timeRemaining = (() => {
    if (!documentExpiredAt) return null;
    const diff = new Date(documentExpiredAt).getTime() - Date.now();
    if (diff <= 0) return "Đã hết hạn";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  })();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "document", label: "Tài liệu", icon: <Globe size={14} /> },
    { id: "chat", label: "Đoạn chat", icon: <MessageSquare size={14} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#0D0D12] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Share2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Chia sẻ
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[200px]">
                      {documentTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-black shadow-md"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "document" ? (
                  <motion.div
                    key="document"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    {/* Link field */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest px-1">
                        Liên kết tài liệu
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl h-12 px-4 flex items-center overflow-hidden">
                          <Link2 size={14} className="text-zinc-600 mr-2 flex-shrink-0" />
                          <span className="text-sm text-zinc-400 truncate font-medium">
                            {docShareUrl}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyDocLink}
                          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                          {isCopied ? (
                            <Check size={18} className="text-emerald-400" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Community Share Toggle */}
                    <div
                      onClick={() => setIsPublic(!isPublic)}
                      className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isPublic
                            ? "bg-white border-white"
                            : "border-white/20 group-hover:border-white/40"
                        }`}
                      >
                        {isPublic && (
                          <Check size={16} className="text-black font-bold" strokeWidth={3} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          Share trên thư viện chung
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Bất kỳ ai cũng có thể tìm thấy và sử dụng tài liệu này
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleDone}
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-2xl bg-white text-black font-black text-sm transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-white/5"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Globe size={18} />
                      )}
                      Hoàn tất
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* Thời gian còn lại */}
                    {timeRemaining && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <Clock size={13} className="text-amber-400 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-amber-400">
                          Tài liệu còn hiệu lực:{" "}
                          <span className="text-amber-300">{timeRemaining}</span>
                          {" "}— Link chia sẻ hết hạn cùng lúc
                        </span>
                      </div>
                    )}

                    {/* Toggle: Hiển thị lịch sử */}
                    <div
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group"
                    >
                      <div
                        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
                          showHistory ? "bg-white" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                            showHistory
                              ? "translate-x-6 bg-black"
                              : "translate-x-1 bg-zinc-500"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Eye size={13} className="text-zinc-400" />
                          <span className="text-sm font-bold text-white">
                            Hiển thị toàn bộ hội thoại
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Người nhận link sẽ thấy lịch sử chat của bạn
                        </span>
                      </div>
                    </div>

                    {/* Toggle: Cho phép fork */}
                    <div
                      onClick={() => setAllowFork(!allowFork)}
                      className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group"
                    >
                      <div
                        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
                          allowFork ? "bg-white" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                            allowFork
                              ? "translate-x-6 bg-black"
                              : "translate-x-1 bg-zinc-500"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <GitFork size={13} className="text-zinc-400" />
                          <span className="text-sm font-bold text-white">
                            Cho phép tiếp tục hỏi (Fork)
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Người xem có thể tạo phiên chat riêng kế thừa ngữ cảnh
                        </span>
                      </div>
                    </div>

                    {/* Kết quả: Link đã tạo */}
                    {chatShareLink && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-[11px] font-black text-emerald-500 uppercase tracking-widest px-1">
                          ✓ Link đã sẵn sàng
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl h-12 px-4 flex items-center overflow-hidden">
                            <span className="text-sm text-emerald-300 truncate font-medium">
                              {chatShareLink}
                            </span>
                          </div>
                          <button
                            onClick={handleCopyChatLink}
                            className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90"
                          >
                            {isChatLinkCopied ? (
                              <Check size={18} className="text-emerald-400" />
                            ) : (
                              <Copy size={18} />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Nút tạo link */}
                    <button
                      onClick={handleCreateChatLink}
                      disabled={isCreatingLink || !sessionId}
                      className="w-full h-14 rounded-2xl bg-white text-black font-black text-sm transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-white/5 mt-2"
                    >
                      {isCreatingLink ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Đang tóm tắt hội thoại...
                        </>
                      ) : chatShareLink ? (
                        <>
                          <Link2 size={18} />
                          Tạo link mới
                        </>
                      ) : (
                        <>
                          <Share2 size={18} />
                          {sessionId ? "Tạo Link Chia Sẻ" : "Chưa có hội thoại"}
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
