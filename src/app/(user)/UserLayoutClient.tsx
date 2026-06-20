"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { PremiumConfirmDialog } from "@/components/ui/PremiumConfirmDialog";
import { UpgradeNotification } from "@/components/user/UpgradeNotification";
import { useNotifications } from "@/hooks/useNotifications";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/user/NotificationBell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/library": "Thư viện của tôi",
  "/upload": "Tải lên mới",
  "/chat/ai/new": "Chat với AI",
  "/planner": "Kế hoạch học",
  "/rooms": "Phòng học nhóm",
  "/community": "Thư viện chung",
  "/dashboard": "Trang chủ",
  "/analytics": "Tiến trình",
  "/settings/profile": "Hồ sơ",
  "/settings/password": "Mật khẩu",
  "/settings/billings": "Thanh toán",
  "/settings/theme": "Giao diện",
  "/settings/feedbacks": "Góp ý",
  "/settings/abouts": "Giới thiệu",
  "/settings": "Cài đặt",
};

function getPageLabel(pathname: string): string {
  if (routeLabels[pathname]) return routeLabels[pathname];
  if (pathname.startsWith("/chat/ai/")) return "Chat với AI";
  if (pathname.startsWith("/doc/")) return "Tài liệu";
  if (pathname.startsWith("/rooms/")) return "Phòng học nhóm";
  if (pathname.startsWith("/settings/")) return "Cài đặt";
  return "Mindex";
}

export default function UserLayout({ children }: { children: ReactNode }) {
  useNotifications();
  useServiceWorker();

  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);

  const { data: meData } = useSWR<{ success: boolean; data: any }>(
    "/auth/me",
    fetcher as any,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    }
  );

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

  const pageLabel = getPageLabel(pathname);

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>
          <div className="relative flex h-full w-full flex-1 flex-col">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.04),transparent_35%)]" />
            <div className="relative z-10 flex h-full w-full flex-1 flex-col">
              {children}
            </div>
          </div>
        </SidebarInset>
        <PremiumConfirmDialog />
        <UpgradeNotification />
      </SidebarProvider>
    </TooltipProvider>
  );
}
