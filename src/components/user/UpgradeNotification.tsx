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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm relative"
          >
            {/* Nút đóng */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 z-[110] bg-background border border-white/10 rounded-full p-1.5 shadow-xl hover:bg-white/10 transition-colors text-white/70"
            >
              <X size={16} />
            </button>

            <Card className="relative overflow-hidden border-white/10 bg-[#0A0B10] shadow-[0_0_50px_rgba(184,41,255,0.15)]">
              {/* Overlay gradient cho card */}
              <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-t from-[#0A0B10] via-transparent to-transparent" />
              
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  src="/images/premium-upgrade.png"
                  alt="Mindex Premium"
                  className="w-full h-full object-cover brightness-75 scale-105"
                />
                {/* Các hạt hiệu ứng lấp lánh (trang trí) */}
                <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                   <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
                   <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse delay-700" />
                   <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>

              <CardHeader className="relative z-40 -mt-6">
                <CardAction>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-bold px-2 py-0.5 flex gap-1 items-center">
                    <Crown size={12} fill="currentColor" />
                    Special Offer
                  </Badge>
                </CardAction>
                <CardTitle className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Mindex Pro / Ultra
                </CardTitle>
                <CardDescription className="text-white/60 leading-relaxed mt-2">
                   Nâng tầm trải nghiệm nghiên cứu của bạn. Truy cập không giới hạn, phân tích sâu và tốc độ Neural AI vượt trội.
                </CardDescription>
              </CardHeader>

              <div className="px-4 pb-2 relative z-40 space-y-2">
                 <FeatureItem icon={<Zap className="text-yellow-400" size={14} />} text="Ghim tài liệu không giới hạn" />
                 <FeatureItem icon={<Star className="text-rose-400" size={14} />} text="Bảo mật cấp độ Ultra & Export PDF" />
              </div>

              <CardFooter className="relative z-40 pt-4 pb-6">
                <div className="flex flex-col w-full gap-3">
                    <Link 
                        href="/settings"
                        className={cn(
                            buttonVariants({ size: "lg" }),
                            "w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all font-bold text-white h-11 shadow-[0_10px_20px_-5px_rgba(184,41,255,0.4)] flex items-center justify-center rounded-xl"
                        )}
                        onClick={handleClose}
                    >
                        Nâng cấp gói ngay
                    </Link>
                    <button 
                        onClick={handleClose}
                        className="text-[11px] text-white/30 hover:text-white/50 transition-colors uppercase tracking-widest font-semibold"
                    >
                        Tiếp tục với bản miễn phí
                    </button>
                </div>
              </CardFooter>
              
              {/* Ánh sáng quét qua card */}
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-2 text-[12px] text-white/70 font-medium bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
            {icon}
            {text}
        </div>
    )
}
