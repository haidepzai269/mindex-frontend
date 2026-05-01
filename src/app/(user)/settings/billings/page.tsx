"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function UserBillingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useSWR<{ success: boolean; data: any }>("/billings/packages", fetcher as any);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    const cancel = searchParams.get("cancel");

    if (orderCode && cancel === "false") {
      setPaymentError(false);
      toast.promise(
        fetchApi<any>(`/billings/verify?orderCode=${orderCode}`).then((res) => {
          setTimeout(() => {
            window.location.href = "/settings/billings";
          }, 1500);
          return res;
        }),
        {
          loading: "Đang xác thực hóa đơn của bạn...",
          success: "Nâng cấp gói cước thành công!",
          error: "Xác nhận giao dịch thất bại.",
        }
      );
    } else if (orderCode && cancel === "true") {
      setPaymentError(true);
      toast.error("Đã hủy thanh toán.");
      router.replace("/settings/billings");
    }
  }, [searchParams, router]);

  const handleUpgrade = async (pkg: string) => {
    try {
      setIsProcessing(true);
      toast.loading("Đang kết nối PayOS...", { id: "payos" });
      const res = await fetchApi<any>("/billings/create-payment-link", {
        method: "POST",
        body: JSON.stringify({ package_name: pkg }),
      });
      toast.dismiss("payos");
      if (res?.success && res?.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.error("Không trả về link.");
      }
    } catch (e: any) {
      toast.dismiss("payos");
      toast.error(e.message || e.response?.data?.message || "Lỗi tạo thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

  const proPrice = data?.data?.PRO || 5000;
  const ultraPrice = data?.data?.ULTRA || 10000;
  const isPro = user?.tier === "PRO";
  const isUltra = user?.tier === "ULTRA";

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-8 p-8">
      <div className="relative z-10 mb-10 mt-8 space-y-3 text-center">
        <AnimatePresence>
          {paymentError && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-center">
              <Alert variant="destructive" className="max-w-xl py-4 shadow-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Thanh toán thất bại</AlertTitle>
                <AlertDescription>Giao dịch của bạn không thể hoàn tất hoặc đã bị hủy. Vui lòng kiểm tra lại và thử lại.</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {(isPro || isUltra) && !paymentError && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-center">
              <Alert className="max-w-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <AlertTitle>Giao dịch thành công</AlertTitle>
                <AlertDescription>
                  {isPro ? "Chúc mừng bạn đã nâng cấp lên gói PRO thành công!" : "Chúc mừng bạn đã nâng cấp lên gói ULTRA thành công!"}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className="mb-1 text-4xl font-extrabold tracking-tight text-foreground">
          Nâng Cấp Gói <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">Trí Tuệ Mindex</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground">
          Mở khóa toàn bộ giới hạn và làm chủ lượng tri thức vô hạn. Chọn gói phù hợp với cường độ học tập của bạn.
        </p>
      </div>

      {(isLoading || isProcessing) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="relative z-10 mx-auto grid max-w-4xl items-stretch gap-8 md:grid-cols-2">
        <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
          <PackageCard
            title="Gói PRO"
            description="Lựa chọn hàng đầu để quản lý tài nguyên học tập."
            price={proPrice}
            accent="amber"
            active={isPro}
            disabled={isPro || isUltra || isProcessing}
            features={[
              "Ghim tối đa 5 tài liệu quan trọng",
              "Chia sẻ template 5 tài liệu",
              "Biểu tượng Vàng Gold VIP",
              "Ưu tiên phản hồi AI",
            ]}
            onClick={() => handleUpgrade("PRO")}
            buttonLabel={isPro ? "Đang sử dụng" : isUltra ? "Bạn đã có gói cao hơn" : "Nâng cấp lên PRO"}
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
          />
        </motion.div>

        <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
          <PackageCard
            title="Gói ULTRA"
            description="Mở khóa sức mạnh tuyệt đối, dành cho power user."
            price={ultraPrice}
            accent="rose"
            active={isUltra}
            disabled={isUltra || isProcessing}
            badge="Đề xuất"
            features={[
              "Ghim tối đa 10 tài liệu quan trọng",
              "Chia sẻ template lên đến 10 tài liệu",
              "Biểu tượng Neon Đỏ đẳng cấp",
              "Premium AI Model Access",
              "Được support 1-1 riêng biệt",
            ]}
            onClick={() => handleUpgrade("ULTRA")}
            buttonLabel={isUltra ? "Đang sử dụng" : "Nâng cấp lên ULTRA"}
            icon={<Zap className="h-5 w-5 text-rose-500" />}
          />
        </motion.div>
      </div>
    </div>
  );
}

function PackageCard({
  title,
  description,
  price,
  features,
  onClick,
  buttonLabel,
  icon,
  accent,
  active,
  disabled,
  badge,
}: {
  title: string;
  description: string;
  price: number;
  features: string[];
  onClick: () => void;
  buttonLabel: string;
  icon: React.ReactNode;
  accent: "amber" | "rose";
  active: boolean;
  disabled: boolean;
  badge?: string;
}) {
  const accentMap = {
    amber: {
      shell: "border-amber-400/30 bg-gradient-to-b from-amber-50 to-white dark:from-[#1b1308] dark:to-[#0d0a07]",
      line: "via-amber-400",
      title: "text-foreground",
      desc: "text-muted-foreground",
      price: "text-foreground",
      sub: "text-muted-foreground",
      feature: "text-foreground/80",
      icon: "text-amber-500",
      button: active ? "bg-muted text-muted-foreground" : "bg-foreground text-background hover:opacity-90",
      ring: "ring-2 ring-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.15)]",
      badge: "border-amber-400/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    rose: {
      shell: "border-rose-400/30 bg-gradient-to-b from-rose-50 to-white dark:from-[#1c0816] dark:to-[#0a0208]",
      line: "via-rose-500",
      title: "text-foreground",
      desc: "text-muted-foreground dark:text-rose-100/60",
      price: "text-foreground dark:text-rose-100",
      sub: "text-muted-foreground dark:text-rose-100/40",
      feature: "text-foreground/80 dark:text-rose-100/70",
      icon: "text-rose-500",
      button: active ? "bg-muted text-muted-foreground" : "bg-rose-600 text-white hover:bg-rose-500",
      ring: "ring-2 ring-rose-500/40 shadow-[0_0_40px_rgba(225,29,72,0.2)]",
      badge: "border-rose-400/30 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    },
  } as const;

  const style = accentMap[accent];

  return (
    <Card className={cn("relative flex h-full flex-col overflow-hidden backdrop-blur", style.shell, active ? style.ring : "")}>
      <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent", style.line)} />

      <div className="relative z-10 flex flex-1 flex-col p-8">
        {badge ? (
          <div className="absolute right-4 top-4">
            <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", style.badge)}>{badge}</span>
          </div>
        ) : null}

        <div className="mb-2 flex items-center gap-2">
          <span className={style.icon}>{icon}</span>
          <h3 className={cn("text-xl font-bold", style.title)}>{title}</h3>
        </div>
        <p className={cn("mb-6 text-sm", style.desc)}>{description}</p>

        <div className="mb-6 flex items-baseline gap-1">
          <span className={cn("text-4xl font-black", style.price)}>{price.toLocaleString()}đ</span>
          <span className={cn("font-medium", style.sub)}>/ tháng</span>
        </div>

        <ul className="mb-8 flex-1 space-y-4">
          {features.map((feature) => (
            <li className={cn("flex gap-3 text-sm", style.feature)} key={feature}>
              <Check className={cn("h-5 w-5 shrink-0", style.icon)} />
              {feature}
            </li>
          ))}
        </ul>

        <Button onClick={onClick} disabled={disabled} className={cn("w-full py-6 text-base font-bold transition-all", style.button)}>
          {buttonLabel}
          {!active && !disabled && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
}
