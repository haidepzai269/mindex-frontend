"use client";

import { usePathname } from "next/navigation";
import { BookOpen, FileText, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "./NotificationBell";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function MobileHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const quota = useAuthStore((state) => state.quota);
  const logout = useAuthStore((state) => state.logout);

  if (pathname.startsWith("/doc/")) return null;

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
         </div>
         <span className="font-bold text-lg tracking-tight text-white/90">Mindex</span>
      </div>

      <div className="flex items-center gap-3">
         <NotificationBell />
         
         <Sheet>
            <SheetTrigger className="relative outline-none focus:outline-none">
                 <Avatar className={cn("w-8 h-8 border shadow-lg transition-transform hover:scale-105", 
                   user?.tier === "PRO" ? "border-yellow-400" : user?.tier === "ULTRA" ? "border-rose-400" : "border-white/20"
                 )}>
                   {user?.avatar_url ? (
                     <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold text-xs">
                       {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                     </AvatarFallback>
                   )}
                 </Avatar>
                 {user?.tier !== "FREE" && (
                    <span className={cn("absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background", user?.tier === "PRO" ? "bg-yellow-500" : "bg-rose-500")} />
                 )}
            </SheetTrigger>
            
            <SheetContent side="right" className="w-[300px] bg-[#0A0B10]/95 backdrop-blur-2xl border-white/5 p-6 sm:w-[350px]">
               <SheetHeader className="mb-6 mt-4">
                 <SheetTitle className="text-left text-white font-bold">Tài khoản</SheetTitle>
               </SheetHeader>
               
               <div className="flex flex-col gap-6">
                 {/* User Info */}
                 <div className="flex items-center gap-4">
                   <Avatar className={cn("w-14 h-14 border-2 shadow-2xl overflow-hidden", 
                     user?.tier === "PRO" ? "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : 
                     user?.tier === "ULTRA" ? "border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.3)]" : "border-white/20"
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
                     <div className="flex items-center gap-2">
                       <span className="font-bold text-white truncate text-lg">{user?.name || "Người dùng"}</span>
                       {user?.tier === "PRO" && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 uppercase">Pro</span>}
                       {user?.tier === "ULTRA" && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/60 uppercase">Ultra</span>}
                     </div>
                     <span className="text-xs text-white/40 truncate">{user?.email || "Không rõ email"}</span>
                   </div>
                 </div>

                 <Separator className="bg-white/5" />

                 {/* Quota */}
                 <div className="space-y-4">
                   <h4 className="text-sm font-semibold text-white/80">Hạn mức của bạn</h4>
                   
                   <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                     <div className="flex justify-between text-xs font-medium text-white/60">
                       <span className="flex items-center gap-1.5 text-white/80"><FileText size={14} className="text-amber-500" /> Tài liệu đã ghim</span>
                       <span className="text-white font-bold">{quota?.pinnedCount ?? quota?.pinnedDocs ?? 0} <span className="text-white/40 font-normal">/ {quota?.maxPins ?? quota?.pinnedDocsLimit ?? 3}</span></span>
                     </div>
                     <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
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

                 <div className="mt-auto pt-10">
                   <button 
                     onClick={() => logout()}
                     className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold hover:bg-red-500/20 transition-colors"
                   >
                     <LogOut size={16} /> Đăng xuất
                   </button>
                 </div>
               </div>
            </SheetContent>
         </Sheet>
      </div>
    </header>
  );
}
