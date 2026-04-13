"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface NewFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NewFeedbackDialog({ open, onOpenChange, onSuccess }: NewFeedbackDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/feedbacks/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Đã gửi góp ý thành công!");
        setSubject("");
        setMessage("");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Góp ý hệ thống</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Hãy chia sẻ ý kiến hoặc báo lỗi để chúng tôi hoàn thiện Mindex hơn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Tiêu đề</label>
            <Input
              placeholder="Ví dụ: Góp ý về giao diện, Báo lỗi upload..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nội dung chi tiết</label>
            <Textarea
              placeholder="Nhập nội dung góp ý của bạn tại đây..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[150px] focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5">
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/80 text-white min-w-[100px]"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi góp ý"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
