"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function JoinRoomModal({ isOpen, onClose, initialCode = "" }: JoinRoomModalProps) {
  const [code, setCode] = useState(initialCode);
  const [step, setStep] = useState(1); // 1: Input, 2: Info & Consent
  const [isLoading, setIsLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const router = useRouter();

  // Cập nhật code khi initialCode thay đổi
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi<any>(`/rooms/info?code=${code.toUpperCase()}`);
      if (res.success) {
        setRoomInfo(res.data);
        setStep(2);
      }
    } catch (error: any) {
      toast.error(error.message || "Mã mời không hợp lệ hoặc phòng đã đầy");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi<any>("/rooms/join", { 
        method: 'POST', 
        body: JSON.stringify({ invite_code: code.toUpperCase() }) 
      });
      if (res.success) {
        toast.success("Đã tham gia phòng!");
        router.push(`/rooms/${res.data.id}`);
        reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể tham gia phòng");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCode("");
    setStep(1);
    setRoomInfo(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
      <DialogContent className="sm:max-w-[450px] bg-[#0F1117] border-white/10 text-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-secondary" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">Tham gia phòng học</DialogTitle>
          <DialogDescription className="text-white/40">
            Nhập mã mời để bắt đầu học nhóm cùng bạn bè.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-white/60">Mã mời (8 ký tự)</Label>
              <Input
                id="code"
                placeholder="Ví dụ: ABCXYZ"
                maxLength={8}
                className="bg-white/5 border-white/10 focus:border-secondary/50 text-white placeholder:text-white/20 h-14 text-center font-mono text-xl uppercase tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && roomInfo && (
          <div className="py-4 space-y-5">
            <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Bạn đang vào phòng</span>
              <h3 className="text-lg font-bold text-white">{roomInfo.name}</h3>
              <p className="text-xs text-white/40 mt-1">Chủ phòng: {roomInfo.host_name}</p>
              <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 font-bold">
                {roomInfo.member_count} / 5 Thành viên
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-3">
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
                <ShieldCheck size={18} />
                Xác nhận quyền riêng tư
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Khi tham gia, bạn đồng ý rằng: <br />
                <span className="font-bold text-white">• Toàn bộ tài liệu bạn upload</span> trong phòng này sẽ được chia sẻ với các thành viên khác. <br />
                <span className="font-bold text-white">• Bạn có thể xem và hỏi AI</span> dựa trên tài liệu của những thành viên khác trong phòng này.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 1 && (
            <Button 
              className="w-full h-12 rounded-xl font-bold bg-white hover:bg-zinc-200 text-black transition-all" 
              disabled={code.length < 6 || isLoading}
              onClick={handleCheck}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Kiểm tra mã
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" className="flex-1 h-12 rounded-xl text-white/40" onClick={() => setStep(1)}>Quay lại</Button>
              <Button 
                className="flex-[2] h-12 rounded-xl font-bold bg-white hover:bg-zinc-200 text-black transition-all shadow-lg shadow-white/5" 
                onClick={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Đồng ý & Tham gia
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
