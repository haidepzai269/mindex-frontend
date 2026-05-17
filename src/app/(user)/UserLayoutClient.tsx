"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Library,
  Upload,
  Globe,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { PremiumConfirmDialog } from "@/components/ui/PremiumConfirmDialog";
import { UpgradeNotification } from "@/components/user/UpgradeNotification";
import { useNotifications } from "@/hooks/useNotifications";
import { MobileNavigation } from "@/components/user/MobileNavigation";
import { MobileHeader } from "@/components/user/MobileHeader";
import { formatTimeAgo } from "@/lib/time";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export default function UserLayout({ children }: { children: ReactNode }) {
  useNotifications();
  useServiceWorker();

  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const quota = useAuthStore((state) => state.quota);
  const setUser = useAuthStore((state) => state.setUser);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const { data: meData } = useSWR<{ success: boolean; data: any }>(user ? "/auth/me" : null, fetcher as any, {
    refreshInterval: 300000, // 5 phút thay vì 30s — tránh poll liên tục
    revalidateOnFocus: true,  // Vẫn refresh khi user quay lại tab
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
        },
      });
    }
  }, [meData, setUser]);

  const { data: docsData } = useSWR<{ success: boolean; data: any[] }>(user ? "/documents" : null, fetcher as any);
  const recentDocs = docsData?.data?.slice(0, 10) || [];


  const pinnedCount = quota?.pinnedCount ?? quota?.pinnedDocs ?? 0;
  const maxPins = quota?.maxPins ?? quota?.pinnedDocsLimit ?? 3;
  const pinPercent = Math.min((pinnedCount / maxPins) * 100, 100);

  return (
    <TooltipProvider delay={200}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "relative z-[60] hidden h-full flex-shrink-0 flex-col border-r bg-sidebar/95 text-sidebar-foreground backdrop-blur md:flex",
            user?.tier === "PRO" ? "border-amber-400/20" : user?.tier === "ULTRA" ? "border-rose-400/20" : "border-border/70"
          )}
        >
          <div className={cn(
            "pointer-events-none absolute inset-0",
            user?.tier === "PRO"
              ? "bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_40%),radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.04),transparent_60%)]"
              : user?.tier === "ULTRA"
              ? "bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.1),transparent_40%),radial-gradient(ellipse_at_bottom,rgba(244,63,94,0.05),transparent_60%)]"
              : "bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_40%)]"
          )} />

          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-10 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-lg transition-all hover:border-primary/30 hover:text-foreground"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div
            className={cn(
              "relative flex h-20 items-center transition-all duration-300",
              isCollapsed ? "justify-center px-0" : "gap-3 px-6"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-all",
              user?.tier === "PRO"
                ? "border-amber-400/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                : user?.tier === "ULTRA"
                ? "border-rose-400/30 bg-rose-500/15 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                : "border-primary/15 bg-primary/10 text-primary"
            )}>
              <BookOpen className="h-5 w-5" />
            </div>

            {!isCollapsed && (
              <>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "overflow-hidden whitespace-nowrap text-2xl font-bold tracking-tighter",
                    user?.tier === "PRO"
                      ? "animate-gold-shimmer bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 bg-clip-text text-transparent"
                      : user?.tier === "ULTRA"
                      ? "animate-gold-shimmer bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 bg-clip-text text-transparent"
                      : "text-foreground"
                  )}
                >
                  Mindex
                </motion.span>
                {user?.tier === "PRO" && (
                  <span className="relative overflow-hidden rounded border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.4)] dark:text-amber-400">
                    Pro
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease_infinite] bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
                  </span>
                )}
                {user?.tier === "ULTRA" && (
                  <span className="relative overflow-hidden rounded border border-rose-400/50 bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase shadow-[0_0_14px_rgba(244,63,94,0.5)]">
                    <span className="animate-gold-shimmer bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400 bg-clip-text text-transparent">✦ Ultra</span>
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease_infinite] bg-gradient-to-r from-transparent via-pink-300/30 to-transparent" />
                  </span>
                )}
              </>
            )}
          </div>

          <nav className={cn("relative flex flex-1 flex-col overflow-hidden", isCollapsed ? "items-center px-0" : "px-4")}>
            <div className={cn("mb-2 flex w-full flex-col space-y-1.5", isCollapsed ? "items-center" : "items-stretch")}>
              <NavItem href="/library" icon={<Library size={20} />} label="Thư viện của tôi" active={pathname === "/library"} collapsed={isCollapsed} />
              <NavItem href="/upload" icon={<Upload size={20} />} label="Tài liệu mới" active={pathname.startsWith("/upload")} collapsed={isCollapsed} />
              <NavItem href="/rooms" icon={<Users size={20} />} label="Phòng học nhóm" active={pathname.startsWith("/rooms")} collapsed={isCollapsed} />
              <NavItem href="/community" icon={<Globe size={20} />} label="Thư viện chung" active={pathname === "/community"} collapsed={isCollapsed} />
            </div>

            <AnimatePresence initial={false}>
              {!isCollapsed && !isToolsExpanded && (
                <motion.div
                  key="recent-docs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  <Separator className="my-4 bg-border/70" />
                  <div className="mb-3 mt-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Tài liệu gần đây
                  </div>
                  <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto pr-1 pb-4">
                    {recentDocs.length > 0 ? (
                      recentDocs.map((doc) => (
                        <RecentDoc
                          key={doc.id}
                          id={doc.id}
                          title={doc.title}
                          expiring={!!doc.expired_at}
                          time={doc.shared_at || doc.created_at}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-2 text-[10px] italic text-muted-foreground">Chưa có tài liệu nào</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle accordion cho Tools */}
            <div className={cn("mt-auto shrink-0", isCollapsed ? "flex flex-col items-center gap-1.5 py-2" : "pb-2")}>
              {isCollapsed ? (
                <>
                  <NavItem href="/analytics" icon={<TrendingUp size={20} />} label="Tiến trình" active={pathname === "/analytics"} collapsed={isCollapsed} />
                  <NavItem href="/planner" icon={<Calendar size={20} />} label="Kế hoạch học" active={pathname === "/planner"} collapsed={isCollapsed} />
                  <NavItem href="/settings" icon={<Settings size={20} />} label="Cài đặt" active={pathname.startsWith("/settings")} collapsed={isCollapsed} />
                </>
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {isToolsExpanded && (
                      <motion.div
                        key="tools-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col space-y-1.5 pb-1">
                          <NavItem href="/analytics" icon={<TrendingUp size={20} />} label="Tiến trình" active={pathname === "/analytics"} collapsed={isCollapsed} />
                          <NavItem href="/planner" icon={<Calendar size={20} />} label="Kế hoạch học" active={pathname === "/planner"} collapsed={isCollapsed} />
                          <NavItem href="/settings" icon={<Settings size={20} />} label="Cài đặt" active={pathname.startsWith("/settings")} collapsed={isCollapsed} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => setIsToolsExpanded((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-all hover:bg-accent/40 hover:text-foreground"
                  >
                    <span>Công cụ</span>
                    <motion.span
                      animate={{ rotate: isToolsExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="flex items-center"
                    >
                      <ChevronDown size={15} />
                    </motion.span>
                  </button>
                </>
              )}
            </div>
          </nav>

          <div
            className={cn(
              "relative mt-auto shrink-0 border-t border-border/70 bg-muted/30 backdrop-blur",
              isCollapsed ? "flex justify-center p-4" : "p-5"
            )}
          >
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 space-y-2.5">
                <div className="flex justify-between px-1 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} className="text-primary" />
                    Đã ghim
                  </span>
                  <span className="text-foreground">
                    {pinnedCount} / {maxPins}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      pinPercent >= 100
                        ? "bg-amber-500"
                        : pinPercent >= 66
                          ? "bg-primary"
                          : "bg-primary/60"
                    )}
                    style={{ width: `${pinPercent}%` }}
                  />
                </div>
              </motion.div>
            )}

            <div
              className={cn(
                "group relative flex items-center transition-all",
                isCollapsed
                  ? "mx-auto h-10 w-10 justify-center rounded-full p-0"
                  : "gap-3 rounded-xl border p-2 overflow-hidden",
                !isCollapsed &&
                  (user?.tier === "PRO"
                    ? "border-amber-400/40 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.12),inset_0_0_20px_rgba(251,191,36,0.05)]"
                    : user?.tier === "ULTRA"
                    ? "border-rose-400/40 bg-gradient-to-br from-rose-500/8 via-pink-500/5 to-rose-500/8 shadow-[0_0_25px_rgba(244,63,94,0.18),inset_0_0_20px_rgba(244,63,94,0.07)]"
                    : "border-border/70 bg-background/70")
              )}
            >
              {/* Shimmer sweep PRO */}
              {!isCollapsed && user?.tier === "PRO" && (
                <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_4s_ease_infinite] bg-gradient-to-r from-transparent via-amber-300/12 to-transparent" />
              )}
              {/* Shimmer sweep ULTRA */}
              {!isCollapsed && user?.tier === "ULTRA" && (
                <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease_infinite] bg-gradient-to-r from-transparent via-rose-300/15 to-transparent" />
              )}

              {/* Avatar with spinning ring for collapsed PRO/ULTRA */}
              <div className="relative shrink-0">
                {isCollapsed && user?.tier === "PRO" && (
                  <div
                    className="pointer-events-none absolute inset-[-3px] animate-ring-spin rounded-full opacity-90"
                    style={{ background: "conic-gradient(transparent 0deg, rgba(251,191,36,0.9) 90deg, transparent 200deg)" }}
                  />
                )}
                {isCollapsed && user?.tier === "ULTRA" && (
                  <div
                    className="pointer-events-none absolute inset-[-3px] animate-ring-spin rounded-full"
                    style={{ background: "conic-gradient(transparent 0deg, rgba(244,63,94,1) 70deg, rgba(236,72,153,0.6) 130deg, transparent 210deg)" }}
                  />
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar
                      className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border transition-transform group-hover:scale-105",
                        user?.tier === "PRO"
                          ? "border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                          : user?.tier === "ULTRA"
                          ? "border-rose-400/60 shadow-[0_0_16px_rgba(244,63,94,0.5)]"
                          : "border-border"
                      )}
                    >
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary/15 font-bold text-primary">
                          {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{user?.name || "Người dùng Mindex"}</span>
                          {user?.tier === "PRO" && (
                            <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-black uppercase text-amber-500">PRO</span>
                          )}
                          {user?.tier === "ULTRA" && (
                            <span className="rounded bg-rose-500/20 px-1 py-0.5 text-[9px] font-black uppercase text-rose-500">✦ ULTRA</span>
                          )}
                        </div>
                        <span className="text-[10px] opacity-60">Nhấn để đăng xuất</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {!isCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      user?.tier === "PRO"
                        ? "text-amber-700 dark:text-amber-400"
                        : user?.tier === "ULTRA"
                          ? "text-rose-700 dark:text-rose-400"
                          : "text-foreground"
                    )}
                  >
                    {user?.name || "Sinh viên Mindex"}
                  </span>
                  <span className="block truncate text-[10px] font-medium text-muted-foreground">
                    {user?.email || "user@mindex.io.vn"}
                  </span>
                </motion.div>
              )}

              {!isCollapsed && (
                <button
                  onClick={() => logout()}
                  className="relative z-10 p-1.5 text-muted-foreground transition-colors hover:text-rose-500"
                  title="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              )}

              {isCollapsed && (
                <button onClick={() => logout()} className="absolute inset-0 z-20 opacity-0" title="Đăng xuất" />
              )}
            </div>
          </div>
        </motion.aside>

        <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.04),transparent_35%)]" />
          <MobileHeader onSheetOpenChange={setIsMobileSheetOpen} />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="relative z-10 flex h-full w-full flex-1 flex-col pb-20 md:pb-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNavigation isSheetOpen={isMobileSheetOpen} />
        <PremiumConfirmDialog />
        <UpgradeNotification />
      </div>
    </TooltipProvider>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
  collapsed = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={cn("w-full", collapsed && "flex justify-center")}>
          <Link
            href={href}
            className={cn(
              "group relative flex items-center overflow-hidden rounded-xl text-sm font-medium transition-all duration-300",
              active
                ? "border border-primary/20 bg-primary/10 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              collapsed ? "h-12 w-12 justify-center" : "w-full gap-3 px-4 py-3"
            )}
          >
            <span className={cn("shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
              {icon}
            </span>

            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} className="overflow-hidden whitespace-nowrap tracking-tight">
                {label}
              </motion.span>
            )}

            {active && !collapsed && (
              <>
                <div className="absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <div className="ml-auto h-1 w-1 shrink-0 rounded-full bg-primary" />
              </>
            )}

            {active && collapsed && (
              <div className="absolute left-0 top-1/2 h-1/2 w-1.5 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
          </Link>
        </div>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
}

function RecentDoc({
  id,
  title,
  expiring = false,
  time,
}: {
  id: string;
  title: string;
  expiring?: boolean;
  time?: string;
}) {
  return (
    <Link href={`/doc/${id}/chat`} className="group flex w-full flex-col gap-1 rounded-lg px-4 py-2 transition-all hover:bg-accent/40">
      <div className="flex items-center gap-3">
        <FileText size={14} className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        <span className="flex-1 truncate text-sm font-normal tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
          {title}
        </span>
        {expiring && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
      </div>
      {time && <div className="pl-6 text-[10px] italic text-muted-foreground/80">{formatTimeAgo(time)}</div>}
    </Link>
  );
}
