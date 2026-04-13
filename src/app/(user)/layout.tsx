"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Library, Upload, Globe, Settings, FileText, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/store/useAuthStore";
import { PremiumConfirmDialog } from "@/components/ui/PremiumConfirmDialog";
import { UpgradeNotification } from "@/components/user/UpgradeNotification";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLoadingStore } from "@/store/useLoadingStore";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/user/NotificationBell";
import { MobileNavigation } from "@/components/user/MobileNavigation";
import { MobileHeader } from "@/components/user/MobileHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function UserLayout({ children }: { children: ReactNode }) {
  useNotifications(); // Kích hoạt SSE Notifications toàn cục
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const quota = useAuthStore((state) => state.quota);
  const setUser = useAuthStore((state) => state.setUser);
  
  // Logic Sidebar Collapsible
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Fetch quota & profile reactively
  const { data: meData } = useSWR<{ success: boolean; data: any }>(user ? "/auth/me" : null, fetcher as any, {
    refreshInterval: 30000, 
  });

  useEffect(() => {
    if (meData?.success && meData.data) {
      setUser({
        id: meData.data.id,
        name: meData.data.name,
        email: meData.data.email,
        role: meData.data.role,
        bio: meData.data.bio,
        urls: meData.data.urls,
        avatar_url: meData.data.avatar_url,
        tier: meData.data.tier,
        quota: {
          pinnedCount: meData.data.quota.pinned_docs,
          maxPins: meData.data.quota.pinned_docs_limit,
          pinnedDocs: meData.data.quota.pinned_docs,
          pinnedDocsLimit: meData.data.quota.pinned_docs_limit,
          publicDocs: meData.data.quota.public_docs,
          publicDocsLimit: meData.data.quota.public_docs_limit,
        }
      });
    }
  }, [meData, setUser]);
  
  const { data: docsData } = useSWR<{ success: boolean; data: any[] }>(user ? "/documents" : null, fetcher as any);
  const recentDocs = docsData?.data?.slice(0, 10) || [];

  const { startLoading, stopLoading } = useLoadingStore();

  useEffect(() => {
    startLoading();
    const timer = setTimeout(() => {
      stopLoading();
    }, 700);
    return () => {
      clearTimeout(timer);
      stopLoading();
    };
  }, [pathname, startLoading, stopLoading]);

  return (
    <TooltipProvider delay={200}>
      <div className="flex h-screen bg-background w-full overflow-hidden">
        {/* SIDEBAR DESKTOP */}
        <motion.aside 
          initial={false}
          animate={{ width: isCollapsed ? 80 : 256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden md:flex flex-shrink-0 flex-col bg-[#0A0B10] text-white border-r border-white/5 h-full relative z-[60]"
        >
          {/* Nút Toggle Sidebar (Nằm ở giữa border) */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-10 w-6 h-6 bg-[#1A1B23] border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-primary transition-all shadow-xl z-50 group"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-500 blur-md opacity-0 group-hover:opacity-100" />
          </button>
          
          {/* LOGO AREA */}
          <div className={cn(
            "h-20 flex items-center transition-all duration-300",
            isCollapsed ? "justify-center px-0" : "px-6 gap-3"
          )}>
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-2xl flex-shrink-0">
               <BookOpen className="w-6 h-6 text-white/90" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-2xl tracking-tighter text-white/90 overflow-hidden whitespace-nowrap"
              >
                Mindex
              </motion.span>
            )}
            
            {!isCollapsed && user?.tier === "PRO" && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.4)] animate-pulse ml-0.5 uppercase">Pro</span>
            )}
            {!isCollapsed && user?.tier === "ULTRA" && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/60 shadow-[0_0_15px_rgba(225,29,72,0.5)] animate-pulse ml-0.5 uppercase">Ultra</span>
            )}
          </div>

          {/* NAVIGATION */}
          <nav className={cn(
            "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
            isCollapsed ? "px-0 items-center" : "px-4"
          )}>
            <div className={cn(
              "space-y-1.5 mb-2 w-full transition-all flex flex-col items-center shrink-0",
              !isCollapsed && "overflow-y-auto pr-1 items-stretch custom-scrollbar h-auto"
            )}>
              <NavItem href="/library" icon={<Library size={20} />} label="Thư viện của tôi" active={pathname === '/library'} collapsed={isCollapsed} />
              <NavItem href="/upload" icon={<Upload size={20} />} label="Tài liệu mới" active={pathname.startsWith('/upload')} collapsed={isCollapsed} />
              <NavItem href="/community" icon={<Globe size={20} />} label="Thư viện chung" active={pathname === '/community'} collapsed={isCollapsed} />
              <NavItem href="/settings" icon={<Settings size={20} />} label="Cài đặt" active={pathname === '/settings'} collapsed={isCollapsed} />
            </div>

            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
                <Separator className="my-2 bg-white/5 shrink-0" />
                <div className="px-3 mb-3 mt-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden shrink-0">Tài liệu gần đây</div>
                <div className="space-y-1 overflow-y-auto pr-1 flex-1 custom-scrollbar pb-4 min-h-0">
                   {recentDocs.length > 0 ? (
                     recentDocs.map((doc) => (
                       <RecentDoc key={doc.id} id={doc.id} title={doc.title} expiring={!!doc.expired_at} />
                     ))
                   ) : (
                     <div className="px-4 py-2 text-[10px] text-white/20 italic">Chưa có tài liệu nào</div>
                   )}
                </div>
              </motion.div>
            )}
          </nav>

          {/* BOTTOM USER INFO */}
          <div className={cn(
            "bg-white/[0.02] mt-auto border-t border-white/5 transition-all duration-300 shrink-0",
            isCollapsed ? "p-4 flex justify-center" : "p-5"
          )}>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 space-y-2.5">
                 <div className="flex justify-between text-[11px] font-medium text-white/60 px-1">
                    <span className="flex items-center gap-1.5"><FileText size={12} className="text-secondary" /> Đã ghim</span>
                    <span className="text-white">{quota?.pinnedCount ?? quota?.pinnedDocs ?? 0} / {quota?.maxPins ?? quota?.pinnedDocsLimit ?? 3}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out relative",
                        (quota?.pinnedCount ?? 0) >= (quota?.maxPins ?? 3) 
                          ? "bg-white/80" 
                          : (quota?.pinnedCount ?? 0) >= 2
                            ? "bg-white/40"
                            : "bg-white/20"
                      )}
                      style={{ width: `${Math.min(((quota?.pinnedCount ?? 0) / (quota?.maxPins ?? 3)) * 100, 100)}%` }}
                    />
                  </div>
              </motion.div>
            )}

            <div className={cn(
               "relative flex items-center transition-all group overflow-hidden",
               isCollapsed ? "justify-center p-0 rounded-full w-10 h-10 mx-auto" : "gap-3 p-2 rounded-xl",
               !isCollapsed && (
                 user?.tier === "PRO" 
                   ? "bg-[#1f1a0e] border border-yellow-500/50 hover:bg-[#2a2313] shadow-[0_0_15px_rgba(234,179,8,0.15)]" 
                   : user?.tier === "ULTRA"
                     ? "bg-[#1c0816] border border-rose-500/60 hover:bg-[#2b0c22] shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                     : "bg-white/5 border border-white/5 hover:bg-white/[0.08]"
               )
             )}>
               <Tooltip>
                 <TooltipTrigger>
                   <Avatar className={cn("border transition-transform group-hover:scale-105 overflow-hidden flex items-center justify-center relative z-10",
                      "w-10 h-10 shrink-0",
                      user?.tier === "PRO" ? "border-yellow-400" : user?.tier === "ULTRA" ? "border-rose-400" : "border-white/20"
                   )}>
                     {user?.avatar_url ? (
                       <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold">
                         {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                       </AvatarFallback>
                     )}
                   </Avatar>
                 </TooltipTrigger>
                 {isCollapsed && (
                   <TooltipContent side="right">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold">{user?.name || "Người dùng Mindex"}</span>
                        <span className="text-[10px] opacity-60">Nhấn để đăng xuất</span>
                      </div>
                   </TooltipContent>
                 )}
               </Tooltip>

               {!isCollapsed && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 min-w-0 relative z-10">
                   <span className={cn("text-sm font-semibold truncate", user?.tier === "PRO" ? "text-yellow-400" : user?.tier === "ULTRA" ? "text-rose-400 drop-shadow-[0_0_5px_rgba(225,29,72,0.8)]" : "text-white")}>{user?.name || "Sinh viên Mindex"}</span>
                   <span className="text-[10px] text-white/40 truncate font-medium">{user?.email || "user@mindex.vn"}</span>
                 </motion.div>
               )}
               
               {!isCollapsed && (
                 <button 
                   onClick={() => logout()}
                   className="text-white/30 hover:text-red-400 p-1.5 transition-colors relative z-10"
                   title="Đăng xuất"
                 >
                   <LogOut size={16} />
                 </button>
               )}
               
               {isCollapsed && (
                  <button 
                    onClick={() => logout()}
                    className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                    title="Đăng xuất"
                  />
               )}
            </div>
          </div>
        </motion.aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[#020205] overflow-hidden">
          <MobileHeader />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 flex flex-col h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNavigation />
        <PremiumConfirmDialog />
        <UpgradeNotification />
      </div>
    </TooltipProvider>
  );
}

function NavItem({ href, icon, label, active = false, collapsed = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean; collapsed?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger className={cn("w-full block flex justify-center", !collapsed && "block")}>
        <Link 
          href={href} 
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
            active 
              ? 'bg-white/[0.08] text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_20px_-10px_rgba(0,0,0,0.5)]' 
              : 'text-white/40 hover:bg-white/5 hover:text-white/70',
            collapsed ? "justify-center w-12 h-12" : "w-full px-4 py-3 gap-3"
          )}
        >
          <span className={cn(
             "transition-colors shrink-0",
             active ? 'text-white' : 'text-white/20 group-hover:text-white/40'
          )}>
            {icon}
          </span>
          
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              className="tracking-tight whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
          
          {active && !collapsed && (
            <>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_12px_rgba(184,41,255,0.4)]" />
              <div className="ml-auto w-1 h-1 rounded-full bg-white/80 shadow-[0_0_8px_white] shrink-0" />
            </>
          )}

          {active && collapsed && (
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-primary rounded-r-full shadow-[0_0_10px_rgba(184,41,255,0.8)]" />
          )}
        </Link>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function RecentDoc({ id, title, expiring = false }: { id: string; title: string; expiring?: boolean }) {
  return (
    <Link href={`/doc/${id}/chat`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white/90 transition-all group w-full">
      <FileText size={16} className="text-white/20 group-hover:text-secondary/60 transition-colors shrink-0" />
      <span className="truncate flex-1 font-normal tracking-tight">{title}</span>
      {expiring && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse shrink-0"></div>}
    </Link>
  );
}
