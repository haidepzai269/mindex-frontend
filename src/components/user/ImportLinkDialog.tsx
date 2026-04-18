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
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ImportLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportLinkDialog({ open, onOpenChange }: ImportLinkDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const router = useRouter();

  const handleImport = async () => {
    if (!shareUrl.trim()) {
      toast.error("Vui lòng dán link chia sẻ");
      return;
    }

    // Sử dụng Regex linh hoạt hơn để bắt UUID từ URL hoặc chuỗi ròng
    const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const match = shareUrl.match(uuidPattern);
    const id = match ? match[1] : shareUrl.trim();

    if (!id || id.length < 5) {
      toast.error("Link hoặc ID không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    // TRƯỜNG HỢP ĐẶC BIỆT: Link mời phòng chat (có ?code= hoặc /rooms/join)
    if (shareUrl.includes("code=") || shareUrl.includes("/rooms/join")) {
      const codeMatch = shareUrl.match(/code=([A-Z0-9]+)/i);
      const inviteCode = codeMatch ? codeMatch[1] : id;
      toast.success("Đã nhận diện mã mời phòng!");
      router.push(`/rooms/join?code=${inviteCode}`);
      onOpenChange(false);
      setShareUrl("");
      return;
    }

    setIsLoading(true);
    try {
      // Bất kể link gì, ưu tiên dùng API "nhận" tài liệu (ID là chìa khóa)
      try {
        const useRes: any = await fetchApi(`/community/documents/${id}/use`, { method: "POST" });
        if (useRes.success) {
          if (!useRes.data.is_duplicate) {
            toast.success("Đã thêm tài liệu mới vào thư viện!");
          }
          router.push(`/doc/${id}/chat`);
          onOpenChange(false);
          setShareUrl("");
          return;
        }
      } catch (useErr) {
        // Nếu không phải link tài liệu hoặc đã có quyền, cứ tiếp tục để xử lý link hội thoại
        console.log("Not a direct doc or already owned");
      }

      // TRƯỜNG HỢP 2: Link Chia sẻ (/shared/UUID)
      // Chuyển hướng tới trang public VIEW
      toast.success("Link hợp lệ! Đang mở trang xem trước...");
      router.push(`/shared/${id}`);
      onOpenChange(false);
      setShareUrl("");
    } catch (err: any) {
      toast.error(err.message || "Không thể thực thi link này");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border border-white/10 text-white shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <LinkIcon className="text-primary" size={24} />
            Sử dụng Link Chia sẻ
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Dán link tài liệu hoặc đoạn chat được chia sẻ để xem và tiếp tục hội thoại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Link chia sẻ</label>
            <div className="relative">
              <Input 
                value={shareUrl}
                onChange={e => setShareUrl(e.target.value)}
                placeholder="https://mindex.ai/shared/..."
                className="glass-input h-12 bg-white/5 border-white/10 pl-4 pr-12 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleImport();
                }}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">
                 <LinkIcon size={18} />
              </div>
            </div>
            <p className="text-[11px] text-white/30 italic">
              * Hệ thống sẽ tự động thêm tài liệu vào thư viện của bạn sau khi nhấn "Done".
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/50 hover:text-white hover:bg-white/5"
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !shareUrl.trim()}
            className="bg-white text-black hover:bg-white/90 border-none px-8 font-bold"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <ArrowRight size={16} className="mr-2" />
            )}
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
