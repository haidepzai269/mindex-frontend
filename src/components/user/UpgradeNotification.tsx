"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Zap, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UpgradeNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Chỉ hiển thị cho user chưa nâng cấp (FREE hoặc không có tier)
    const isFreeUser = !user || (user.tier !== "PRO" && user.tier !== "ULTRA");
    
    if (isFreeUser) {
      const hasShown = sessionStorage.getItem("mindex_upgrade_notice_shown");
      if (!hasShown) {
        // Delay một chút để tạo cảm giác tự nhiên sau khi login
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("mindex_upgrade_notice_shown", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-sm relative"
          >
            {/* Nút đóng */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 z-[110] bg-background border border-border rounded-full p-1.5 shadow-xl hover:bg-accent hover:text-foreground transition-colors text-muted-foreground"
            >
              <X size={14} />
            </button>

            <Card className="relative overflow-hidden border border-border bg-card shadow-2xl rounded-3xl p-6 flex flex-col items-center text-center">
              
              {/* Icon Crown ở chính giữa */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-5 text-amber-500">
                <Crown size={28} fill="currentColor" className="animate-pulse" />
              </div>

              {/* Badge ưu đãi */}
              <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 font-black px-2.5 py-0.5 text-[9px] tracking-wider uppercase mb-3 rounded-full">
                Special Offer
              </Badge>

              <CardTitle className="text-xl font-black text-foreground tracking-tight uppercase">
                Mindex Pro &amp; Ultra
              </CardTitle>
              
              <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-2.5 mb-6 px-1">
                Nâng tầm trải nghiệm nghiên cứu của bạn. Truy cập không giới hạn, phân tích sâu và tốc độ Neural AI vượt trội.
              </CardDescription>

              {/* Features list */}
              <div className="w-full space-y-2 mb-6">
                <FeatureItem icon={<Zap className="text-amber-500" size={13} />} text="Ghim tài liệu không giới hạn" />
                <FeatureItem icon={<Star className="text-amber-500" size={13} />} text="Bảo mật cấp độ Ultra &amp; Xuất bản PDF" />
              </div>

              {/* Action buttons */}
              <CardFooter className="p-0 w-full flex flex-col gap-3">
                <Link 
                  href="/settings"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm"
                  )}
                  onClick={handleClose}
                >
                  Nâng cấp gói ngay
                </Link>
                <button 
                  onClick={handleClose}
                  className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors uppercase tracking-widest font-bold mt-1"
                >
                  Tiếp tục với bản miễn phí
                </button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground/90 font-bold bg-muted/30 border border-border/40 px-3.5 py-2.5 rounded-2xl text-left">
      {icon}
      <span>{text}</span>
    </div>
  );
}
