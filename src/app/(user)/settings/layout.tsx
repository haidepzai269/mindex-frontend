"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, CreditCard, Palette, MessageSquare, Info } from "lucide-react";
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
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <header className="h-16 hidden md:flex items-center px-8 border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-10 w-full mb-8">
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Cài đặt hệ thống
        </h1>
      </header>

      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-0 pb-28 md:pb-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <aside className="w-full md:w-64 flex-shrink-0">
              <nav className="flex flex-row md:flex-col overflow-x-auto hide-scrollbar w-full bg-transparent border-none p-0 gap-2 pb-2 md:pb-0 border-b border-white/5 md:border-none">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all border-none whitespace-nowrap shrink-0",
                        isActive
                          ? "bg-white/5 text-white shadow-sm"
                          : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                      )}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <div className="hidden md:block ml-auto w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(184,41,255,0.8)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <div className="flex-1 w-full min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
