"use client";

import { useTheme } from "next-themes";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: "light",
      label: "Sáng",
      icon: <Sun size={20} />,
      desc: "Giao diện trắng sáng, rõ ràng."
    },
    {
      id: "dark",
      label: "Tối",
      icon: <Moon size={20} />,
      desc: "Giao diện tối, dịu mắt ban đêm."
    },
    {
      id: "system",
      label: "Hệ thống",
      icon: <Monitor size={20} />,
      desc: "Tự động theo cài đặt thiết bị."
    }
  ];

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Giao diện người dùng</CardTitle>
        <CardDescription className="text-white/50">
          Tùy chỉnh màu sắc và phong cách hiển thị của Mindex.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                theme === t.id 
                  ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(184,41,255,0.2)] text-white" 
                  : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                theme === t.id ? "bg-primary text-white" : "bg-white/5 text-white/40 group-hover:text-white"
              )}>
                {t.icon}
              </div>
              <span className="font-bold text-sm mb-1">{t.label}</span>
              <span className="text-[11px] opacity-60 leading-tight">{t.desc}</span>
              
              {theme === t.id && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
