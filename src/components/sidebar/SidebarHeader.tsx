"use client"

import { BookOpen } from "lucide-react"
import { SidebarHeader as SidebarHeaderPrimitive, useSidebar } from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

export function SidebarHeaderContent() {
  const { state } = useSidebar()
  const user = useAuthStore((s) => s.user)
  const isCollapsed = state === "collapsed"

  return (
    <SidebarHeaderPrimitive>
      <div
        className={cn(
          "relative flex items-center transition-all duration-300",
          isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-4"
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
            user?.tier === "PRO"
              ? "border-amber-400/30 bg-amber-500/15 text-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.3)] dark:text-amber-400"
              : user?.tier === "ULTRA"
              ? "border-rose-400/30 bg-rose-500/15 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              : "border-primary/15 bg-primary/10 text-primary"
          )}
        >
          <BookOpen className="h-5 w-5" />
        </div>

        {!isCollapsed && (
          <>
            <span
              className={cn(
                "whitespace-nowrap text-xl font-bold tracking-tighter",
                user?.tier === "PRO"
                  ? "animate-gold-shimmer bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 bg-clip-text text-transparent"
                  : user?.tier === "ULTRA"
                  ? "animate-gold-shimmer bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 bg-clip-text text-transparent"
                  : "text-foreground"
              )}
            >
              Mindex
            </span>
            {user?.tier === "PRO" && (
              <span className="relative overflow-hidden rounded border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.4)] dark:text-amber-400">
                Pro
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease_infinite] bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
              </span>
            )}
            {user?.tier === "ULTRA" && (
              <span className="relative overflow-hidden rounded border border-rose-400/50 bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase shadow-[0_0_14px_rgba(244,63,94,0.5)]">
                <span className="animate-gold-shimmer bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400 bg-clip-text text-transparent">
                  Ultra
                </span>
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease_infinite] bg-gradient-to-r from-transparent via-pink-300/30 to-transparent" />
              </span>
            )}
          </>
        )}
      </div>
    </SidebarHeaderPrimitive>
  )
}
