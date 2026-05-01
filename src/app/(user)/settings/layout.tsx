"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Info, MessageSquare, Palette, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/settings/profile",
      icon: <User size={18} />,
      label: "Hồ sơ cá nhân",
    },
    {
      href: "/settings/password",
      icon: <Shield size={18} />,
      label: "Tài khoản & Bảo mật",
    },
    {
      href: "/settings/billings",
      icon: <CreditCard size={18} />,
      label: "Gói dịch vụ & Hạn mức",
    },
    {
      href: "/settings/theme",
      icon: <Palette size={18} />,
      label: "Giao diện",
    },
    {
      href: "/settings/feedbacks",
      icon: <MessageSquare size={18} />,
      label: "Góp ý hệ thống",
    },
    {
      href: "/settings/abouts",
      icon: <Info size={18} />,
      label: "Về Mindex",
    },
  ];

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px] dark:bg-primary/5" />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] rounded-full bg-sky-500/10 blur-[100px] dark:bg-secondary/5" />

      <header className="sticky top-0 z-10 mb-8 hidden h-16 w-full items-center border-b border-border/70 bg-background/75 px-8 backdrop-blur-md md:flex">
        <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          Cài đặt hệ thống
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-0">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-6 md:flex-row md:gap-8">
            <aside className="w-full flex-shrink-0 md:w-64">
              <nav className="hide-scrollbar flex w-full flex-row gap-2 overflow-x-auto border-b border-border/70 pb-2 md:flex-col md:border-none md:pb-0">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 transition-all md:gap-3 md:px-4 md:py-3",
                        isActive
                          ? "border-primary/20 bg-primary/10 text-foreground shadow-sm"
                          : "border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto hidden h-4 w-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)] md:block" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <div className="w-full min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
