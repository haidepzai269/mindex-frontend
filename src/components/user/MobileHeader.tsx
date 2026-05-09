"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, LogOut, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "./NotificationBell";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

export function MobileHeader({ onSheetOpenChange }: { onSheetOpenChange?: (open: boolean) => void }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const quota = useAuthStore((state) => state.quota);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);

  const handleOpen = (val: boolean) => {
    setOpen(val);
    onSheetOpenChange?.(val);
  };

  if (pathname.startsWith("/doc/")) return null;

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Mindex</span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <button
            className="relative outline-none focus:outline-none"
            onClick={() => handleOpen(true)}
          >
            <Avatar className={cn(
              "w-8 h-8 border shadow-lg transition-transform hover:scale-105 overflow-hidden",
              user?.tier === "PRO" ? "border-yellow-400" :
              user?.tier === "ULTRA" ? "border-rose-400" : "border-border"
            )}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold text-xs">
                  {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                </AvatarFallback>
              )}
            </Avatar>
            {user?.tier !== "FREE" && (
              <span className={cn(
                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                user?.tier === "PRO" ? "bg-yellow-500" : "bg-rose-500"
              )} />
            )}
          </button>
        </div>
      </header>

      {/* Framer Motion drawer — trượt mượt từ phải */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => handleOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.85 }}
              className="fixed inset-y-0 right-0 z-[61] w-[300px] sm:w-[350px] bg-card/98 backdrop-blur-2xl border-l border-border shadow-2xl flex flex-col"
            >
              {/* Nút đóng */}
              <button
                onClick={() => handleOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="px-6 pt-6 pb-2">
                <span className="font-bold text-foreground text-base">Tài khoản</span>
              </div>

              <div className="flex flex-col gap-6 px-6 pb-6 flex-1 overflow-y-auto">
                {/* User Info */}
                <div className="flex items-center gap-4 mt-2">
                  <Avatar className={cn(
                    "w-14 h-14 border-2 shadow-2xl overflow-hidden shrink-0",
                    user?.tier === "PRO" ? "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]" :
                    user?.tier === "ULTRA" ? "border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.3)]" :
                    "border-border"
                  )}>
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold text-lg">
                        {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground truncate text-base">{user?.name || "Người dùng"}</span>
                      {user?.tier === "PRO" && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 uppercase shrink-0">Pro</span>
                      )}
                      {user?.tier === "ULTRA" && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/60 uppercase shrink-0">Ultra</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || "Không rõ email"}</span>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Quota */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Hạn mức của bạn</h4>
                  <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-foreground/80">
                        <FileText size={13} className="text-amber-500" />
                        Tài liệu đã ghim
                      </span>
                      <span className="text-foreground font-bold">
                        {quota?.pinnedCount ?? quota?.pinnedDocs ?? 0}
                        <span className="text-muted-foreground font-normal"> / {quota?.maxPins ?? quota?.pinnedDocsLimit ?? 3}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          (quota?.pinnedCount ?? 0) >= (quota?.maxPins ?? 3) ? "bg-red-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(((quota?.pinnedCount ?? 0) / (quota?.maxPins ?? 3)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() => { logout(); handleOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
