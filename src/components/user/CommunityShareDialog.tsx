"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Globe,
  GlobeLock,
  Loader2,
  Users,
  Clock,
  Zap,
  ShieldCheck,
  ThumbsUp,
  Info,
} from "lucide-react";

interface CommunityShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
  docTitle: string;
  isPublic: boolean;
  onSuccess?: () => void;
}

export function CommunityShareDialog({
  open,
  onOpenChange,
  docId,
  docTitle,
  isPublic,
  onSuccess,
}: CommunityShareDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const res: any = await fetchApi(`/community/documents/${docId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_public: !isPublic }),
      });
      if (res.success) {
        toast.success(
          !isPublic
            ? "✅ Đã chia sẻ vào Thư viện cộng đồng! Tài liệu sẽ được lưu 30 ngày."
            : "Đã rút tài liệu khỏi Thư viện cộng đồng"
        );
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(res.message || "Lỗi không xác định");
      }
    } catch (err: any) {
      const errCode = err.data?.error || err.data?.code;
      if (errCode === "SHARE_QUOTA_EXCEEDED") {
        toast.error("Đã đạt giới hạn!", {
          description: "Bạn chỉ được chia sẻ tối đa 3 tài liệu. Hãy rút 1 tài liệu cũ.",
        });
      } else if (errCode === "PERMISSION_DENIED") {
        toast.error("Không có quyền!", {
          description: err.data?.message || "Chỉ chủ sở hữu hoặc người đồng quản lý mới có quyền thực hiện thao tác này.",
        });
      } else {
        toast.error("Không thể thực hiện. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border border-white/10 text-white shadow-2xl shadow-black/60 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-[18px] font-bold">
            {isPublic ? (
              <GlobeLock className="text-red-400" size={20} />
            ) : (
              <Globe className="text-emerald-400" size={20} />
            )}
            {isPublic ? "Rút khỏi cộng đồng" : "Chia sẻ vào cộng đồng"}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            <span className="text-white/80 font-medium">"{docTitle}"</span>
          </DialogDescription>
        </DialogHeader>

        {!isPublic ? (
          // ── Giao diện Share ──
          <div className="mt-4 space-y-4">
            {/* Benefits */}
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-3">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={12} className="fill-emerald-400" /> Lợi ích khi chia sẻ
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 text-sm text-white/70">
                  <Clock size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    Tài liệu được <span className="text-white font-medium">lưu vĩnh viễn miễn phí</span> thay vì hết hạn
                    sau 24 giờ — miễn là có người truy cập.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/70">
                  <Users size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    Sinh viên khác có thể sử dụng tài liệu của bạn.{" "}
                    <span className="text-white font-medium">Không tốn thêm quota embedding</span> của họ.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/70">
                  <ThumbsUp size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    Đạt <span className="text-white font-medium">100 upvote</span> → nhận thêm 1 slot ghim tài liệu
                    miễn phí (Gamification).
                  </span>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={12} /> Quy tắc lưu trữ
              </p>
              <ul className="space-y-1.5 text-xs text-white/50">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/30 shrink-0"></span>
                  Tài liệu sẽ sống <span className="text-white/80 mx-1 font-medium">30 ngày</span> và được gia hạn tự
                  động mỗi khi có người truy cập.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/30 shrink-0"></span>
                  Không ai truy vấn trong 30 ngày → hệ thống tự đào thải (Survival of the Fittest).
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/30 shrink-0"></span>
                  Quota tối đa: <span className="text-white/80 font-medium mx-1">3 tài liệu</span> công khai cùng lúc.
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>Bạn có thể rút tài liệu bất cứ lúc nào trong trang Thư viện.</span>
            </div>
          </div>
        ) : (
          // ── Giao diện Unshare ──
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 space-y-2 text-sm text-white/70">
              <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Xác nhận thu hồi</p>
              <p>
                Sau khi rút, tài liệu sẽ <span className="text-white font-medium">không còn xuất hiện</span> trong Thư
                viện cộng đồng.
              </p>
              <p className="text-white/50 text-xs">
                Tài liệu sẽ quay lại trạng thái hết hạn sau 24 giờ (trừ khi bạn ghim ⭐).
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/50 hover:text-white hover:bg-white/5"
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleShare}
            disabled={isLoading}
            className={
              isPublic
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            }
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : isPublic ? (
              <GlobeLock size={16} className="mr-2" />
            ) : (
              <Globe size={16} className="mr-2" />
            )}
            {isLoading ? "Đang xử lý..." : isPublic ? "Rút khỏi cộng đồng" : "Xác nhận chia sẻ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
