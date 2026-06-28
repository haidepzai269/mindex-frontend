"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Send, Loader2, User, AtSign } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE_URL } from "@/lib/api";

interface EmailComposerProps {
  onBack: () => void;
}

const ADMIN_EMAIL = "haidepzai2692006@gmail.com";
const FIRST_EMAIL_KEY = "mindex-first-feedback-email-sent";

export default function EmailComposer({ onBack }: EmailComposerProps) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề email");
      return;
    }
    if (!body.trim()) {
      toast.error("Vui lòng nhập nội dung email");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: JSON.stringify({ subject, body }),
      });

      const data = await res.json();
      if (data.success) {
        // Check lần đầu gửi email
        const isFirstTime = !localStorage.getItem(FIRST_EMAIL_KEY);
        if (isFirstTime) {
          localStorage.setItem(FIRST_EMAIL_KEY, "true");
          toast.success(
            "🎉 Cảm ơn bạn đã gửi góp ý đầu tiên! Ý kiến của bạn rất quý giá với chúng tôi.",
            { duration: 6000 }
          );
        } else {
          toast.success("Email góp ý đã được gửi thành công!");
        }

        setSubject("");
        setBody("");
        // Quay về chat mode sau 1.5s
        setTimeout(() => onBack(), 1500);
      } else {
        toast.error(data.error || "Có lỗi xảy ra khi gửi email");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/90 backdrop-blur md:col-span-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Mail size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Soạn email góp ý</h3>
              <p className="text-[11px] text-muted-foreground">Gửi trực tiếp đến ban quản trị</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Fields */}
      <div className="space-y-0 border-b border-border/70">
        {/* From */}
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User size={14} />
            <span className="w-10 font-medium">Từ:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {user?.email || "—"}
            </span>
            <span className="text-xs text-muted-foreground">({user?.name || "Bạn"})</span>
          </div>
        </div>

        {/* To */}
        <div className="flex items-center gap-3 border-b border-border/40 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AtSign size={14} />
            <span className="w-10 font-medium">Đến:</span>
          </div>
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {ADMIN_EMAIL}
          </span>
          <span className="text-xs text-muted-foreground">(Admin)</span>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail size={14} />
            <span className="w-10 font-medium">Chủ đề:</span>
          </div>
          <Input
            placeholder="Ví dụ: Góp ý tính năng tìm kiếm..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-9 flex-1 border-none bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        <Textarea
          placeholder="Nhập nội dung góp ý của bạn tại đây...&#10;&#10;Bạn có thể chia sẻ:&#10;• Ý tưởng cải thiện sản phẩm&#10;• Báo lỗi gặp phải&#10;• Đề xuất tính năng mới&#10;• Trải nghiệm sử dụng"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[280px] w-full resize-none border-none bg-transparent text-sm leading-relaxed shadow-none focus-visible:ring-0"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-border/70 bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Email sẽ được gửi từ hệ thống Mindex. Admin có thể Reply trực tiếp về email của bạn.
          </p>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !body.trim()}
            className="gap-2 rounded-xl px-6 shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={16} />
                Gửi email
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
