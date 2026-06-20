"use client"

import {
  LogOut,
  ChevronsUpDown,
  BadgeCheck,
  CreditCard,
  Palette,
  MessageSquare,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function NavUser() {
  const { isMobile } = useSidebar()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  tooltip={user?.name || "Người dùng"}
                  className={cn(
                    "transition-colors duration-200",
                    user?.tier === "PRO" &&
                      "bg-amber-500/[0.06] hover:bg-amber-500/[0.12] dark:bg-amber-400/[0.06] dark:hover:bg-amber-400/[0.12]",
                    user?.tier === "ULTRA" &&
                      "bg-rose-500/[0.06] hover:bg-rose-500/[0.12] dark:bg-rose-400/[0.06] dark:hover:bg-rose-400/[0.12]"
                  )}
                />
              }
            >
              <Avatar
                className={cn(
                  "h-8 w-8 rounded-full border",
                  user?.tier === "PRO"
                    ? "border-amber-400/60"
                    : user?.tier === "ULTRA"
                    ? "border-rose-400/60"
                    : "border-border"
                )}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className={cn(
                    "truncate font-semibold",
                    user?.tier === "PRO" && "text-amber-700 dark:text-amber-400",
                    user?.tier === "ULTRA" && "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {user?.name || "Sinh viên Mindex"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || "user@mindex.io.vn"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar
                      className={cn(
                        "h-8 w-8 rounded-full border",
                        user?.tier === "PRO"
                          ? "border-amber-400/60"
                          : user?.tier === "ULTRA"
                          ? "border-rose-400/60"
                          : "border-border"
                      )}
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Avatar"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {user?.name?.substring(0, 2).toUpperCase() || "SV"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name || "Sinh viên Mindex"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || "user@mindex.io.vn"}
                      </span>
                    </div>
                    {user?.tier === "PRO" && (
                      <span className="rounded border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                        Pro
                      </span>
                    )}
                    {user?.tier === "ULTRA" && (
                      <span className="rounded border border-rose-400/50 bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-rose-500">
                        Ultra
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/settings/profile" />}>
                  <BadgeCheck />
                  Hồ sơ
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings/billings" />}>
                  <CreditCard />
                  Thanh toán
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings/theme" />}>
                  <Palette />
                  Giao diện
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings/feedbacks" />}>
                  <MessageSquare />
                  Góp ý
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
