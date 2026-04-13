"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User as UserIcon, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
}

export function RoleSelectionDialog({ open, onOpenChange, onSelect }: RoleSelectionDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-white/10 text-white shadow-2xl backdrop-blur-xl p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-bold tracking-tight text-center">
              Lựa chọn vai trò
            </DialogTitle>
            <DialogDescription className="text-white/40 text-center text-sm">
              Bạn có quyền truy cập quản trị. Hãy chọn trang bạn muốn vào.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <button
              onClick={() => onSelect("/admin/system")}
              className="group relative flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white group-hover:text-primary transition-colors">Vào trang Quản trị</div>
                <div className="text-xs text-white/30">Quản lý hệ thống, token và người dùng</div>
              </div>
              <ArrowRight size={18} className="text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onSelect("/library")}
              className="group relative flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:scale-110 transition-transform">
                <UserIcon size={24} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white">Vào trang Người dùng</div>
                <div className="text-xs text-white/30">Xem tài liệu, chat và học tập</div>
              </div>
              <ArrowRight size={18} className="text-white/20 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-4 border-t border-white/10 flex justify-center">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
            Mindex System Auth · Secure Access
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
