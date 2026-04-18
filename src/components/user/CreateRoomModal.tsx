"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ShieldCheck, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdRoom, setCreatedRoom] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên phòng");
      return;
    }

    setIsLoading(true);
    try {
      const res = (await fetchApi("/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      })) as { success: boolean; data: any; message?: string };

      if (res.success) {
        setCreatedRoom(res.data);
        setStep(3);
        toast.success("Đã tạo phòng học nhóm thành công!");
      } else {
        toast.error(res.message || "Không thể tạo phòng");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Đã sao chép vào bộ nhớ tạm");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setName("");
    setStep(1);
    setCreatedRoom(null);
    onClose();
  };

  const fullInviteLink = createdRoom 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${createdRoom.invite_link}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
      <DialogContent className="sm:max-w-[460px] bg-[#0A0B10] border border-white/10 text-white shadow-2xl p-0 overflow-hidden rounded-[24px]">
        <div className="relative p-8 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full space-y-6 flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
                  <Users className="w-8 h-8 text-white/80" />
                </div>
                
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-black tracking-tight text-white">Tạo phòng học mới</DialogTitle>
                  <DialogDescription className="text-white/40 font-medium">
                    Cùng học tập và chia sẻ tài liệu với bạn bè qua Mindex AI.
                  </DialogDescription>
                </div>

                <div className="w-full space-y-4 py-2">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold ml-1">Tên phòng học</label>
                    <Input
                      placeholder="Ví dụ: Ôn thi Giải tích 1..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 focus:border-white/20 focus:ring-0 rounded-xl text-sm px-4 text-white transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                    <ShieldCheck className="w-4 h-4 text-white/20 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-white/30 leading-relaxed italic">
                      Phòng chat được bảo mật. Chỉ những người có mã mời mới có thể tham gia.
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleCreate} 
                  disabled={isLoading}
                  className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin text-black" /> : "Tạo phòng ngay"}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-8 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-[24px] bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Phòng đã sẵn sàng!</h3>
                  <p className="text-sm text-white/40 font-medium">Gửi mã hoặc link này cho bạn bè</p>
                </div>

                <div className="w-full space-y-5">
                  {/* Mã mời Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black block">Mã mời</label>
                    <div 
                      onClick={() => copyToClipboard(createdRoom.invite_code)}
                      className="group cursor-pointer p-5 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-4 transition-all hover:bg-white/15"
                    >
                      <span className="text-3xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        {createdRoom.invite_code}
                      </span>
                      <Copy size={16} className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  {/* Link mời Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black block">Link tham gia nhanh</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center text-[11px] text-white font-medium truncate h-12 italic">
                        {fullInviteLink}
                      </div>
                      <Button 
                        size="icon" 
                        className="h-12 w-12 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all shrink-0"
                        onClick={() => copyToClipboard(fullInviteLink)}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-2">
                  <Button 
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-white/10"
                    onClick={() => {
                      onClose();
                      router.push(`/rooms/${createdRoom.id}`);
                    }}
                  >
                    Vào phòng học ngay
                  </Button>
                  <p className="mt-4 text-[10px] text-white/20 italic">
                    * Tài liệu chia sẻ sẽ hiển thị cho tất cả thành viên.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
