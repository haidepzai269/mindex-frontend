"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = {
  id: "light" | "dark" | "system";
  label: string;
  desc: string;
  icon: typeof Sun;
  preview: string;
};

const themes: ThemeOption[] = [
  {
    id: "light",
    label: "Sáng",
    desc: "Nền sáng dịu, tương phản tốt và dễ đọc vào ban ngày.",
    icon: Sun,
    preview:
      "border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-700",
  },
  {
    id: "dark",
    label: "Tối",
    desc: "Nền tối sâu, dịu mắt và hợp cho các phiên làm việc dài.",
    icon: Moon,
    preview:
      "border-white/10 bg-[linear-gradient(180deg,#09090b_0%,#18181b_100%)] text-white/80",
  },
  {
    id: "system",
    label: "Hệ thống",
    desc: "Tự động đồng bộ với cài đặt light/dark của thiết bị.",
    icon: Monitor,
    preview:
      "border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#111827_52%,#020617_100%)] text-slate-700",
  },
];

export default function AppearanceSection() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "system";
  const currentResolvedTheme = mounted ? resolvedTheme : undefined;

  const getThemeStatus = (id: ThemeOption["id"]) => {
    if (id === "system") {
      if (!currentResolvedTheme) return "Đang xác định";
      return `Đang theo ${currentResolvedTheme === "dark" ? "giao diện tối" : "giao diện sáng"}`;
    }

    return id === currentResolvedTheme ? "Đang áp dụng" : "Sẵn sàng";
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Giao diện người dùng</CardTitle>
        <CardDescription>
          Chuyển giữa light, dark hoặc để Mindex tự động theo theme hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = currentTheme === themeOption.id;

            return (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id)}
                className={cn(
                  "relative flex flex-col items-start overflow-hidden rounded-xl border bg-background/80 p-4 text-left transition-all",
                  "hover:bg-accent/40",
                  isActive
                    ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]"
                    : "border-border/70 hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "mb-4 flex h-28 w-full items-end rounded-lg border p-3 shadow-sm",
                    themeOption.preview
                  )}
                >
                  <div className="w-full space-y-2">
                    <div className="h-2.5 w-2/3 rounded-full bg-current/80" />
                    <div className="h-2 w-1/2 rounded-full bg-current/40" />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="h-7 rounded-md bg-current/20" />
                      <div className="h-7 rounded-md bg-current/15" />
                      <div className="h-7 rounded-md bg-current/10" />
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex w-full items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{themeOption.label}</div>
                    <div className="text-[11px] leading-tight text-muted-foreground">
                      {getThemeStatus(themeOption.id)}
                    </div>
                  </div>
                </div>

                <span className="text-[12px] leading-relaxed text-muted-foreground">
                  {themeOption.desc}
                </span>

                {isActive && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {currentTheme === "system"
            ? `Mindex đang bám theo theme thiết bị: ${currentResolvedTheme === "dark" ? "tối" : "sáng"}.`
            : `Mindex đang ép dùng giao diện ${currentTheme === "dark" ? "tối" : "sáng"} bất kể cài đặt thiết bị.`}
        </div>
      </CardContent>
    </Card>
  );
}
