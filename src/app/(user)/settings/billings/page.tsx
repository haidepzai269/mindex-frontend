"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchApi, fetcher } from "@/lib/api";
import { PaymentHistorySection, type PaymentEntry } from "@/components/user/billing/PaymentHistorySection";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export default function UserBillingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useSWR<{ success: boolean; data: any }>("/billings/packages", fetcher as any);
  const { data: historyData } = useSWR<{ success: boolean; data: PaymentEntry[] }>(
    "/billings/history",
    fetcher as any
  );
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
        toast.error("Không trả về link thanh toán.");
      }
    } catch (error: any) {
      toast.dismiss("payos");
      toast.error(error.message || error.response?.data?.message || "Lỗi tạo thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

  const proPrice = data?.data?.PRO || 5000;
  const ultraPrice = data?.data?.ULTRA || 10000;
  const isPro = user?.tier === "PRO";
  const isUltra = user?.tier === "ULTRA";
  const paymentHistory = historyData?.data || [];

  const historySummary = useMemo(() => {
    const paidCount = paymentHistory.filter((item) => item.status === "PAID").length;
    const latestPayment = paymentHistory[0];

    return {
      paidCount,
      latestPayment,
    };
  }, [paymentHistory]);

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.08),transparent_18%)] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <AnimatePresence>
          {paymentError && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
              <Alert variant="destructive" className="max-w-2xl py-4 shadow-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Thanh toán thất bại</AlertTitle>
                <AlertDescription>
                  Giao dịch của bạn không thể hoàn tất hoặc đã bị hủy. Vui lòng kiểm tra lại và thử lại.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {(isPro || isUltra) && !paymentError && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
              <Alert className="max-w-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <AlertTitle>Gói hiện tại đang hoạt động</AlertTitle>
                <AlertDescription>
                  {isPro
                    ? "Tài khoản của bạn đang sử dụng gói PRO."
                    : "Tài khoản của bạn đang sử dụng gói ULTRA."}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tiêu đề trang */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Billing và lịch sử giao dịch
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Chọn gói phù hợp với cường độ học tập của bạn và theo dõi toàn bộ giao dịch trong cùng một màn hình.
          </p>
        </div>

        {/* Tóm tắt tài khoản */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gói hiện tại</p>
            <p className="mt-2 text-2xl font-black text-foreground">{user?.tier || "FREE"}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Giao dịch thành công</p>
            <p className="mt-2 text-2xl font-black text-foreground">{historySummary.paidCount}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lần thanh toán gần nhất</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {historySummary.latestPayment
                ? new Date(historySummary.latestPayment.created_at).toLocaleDateString("vi-VN")
                : "Chưa có"}
            </p>
          </div>
        </div>
      </div>

      {(isLoading || isProcessing) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Khu vực 2 gói song song - full width */}
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3">
            Chọn gói nâng cấp
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PackageCard
            title="Gói PRO"
            description="Lựa chọn cân bằng để mở rộng hạn mức học tập và ưu tiên AI."
            price={proPrice}
            accent="amber"
            active={isPro}
            disabled={isPro || isUltra || isProcessing}
            features={[
              "Ghim tối đa 5 tài liệu quan trọng",
              "Chia sẻ template 5 tài liệu",
              "Ưu tiên phản hồi AI",
              "Badge PRO trong hệ thống",
            ]}
            onClick={() => handleUpgrade("PRO")}
            buttonLabel={isPro ? "Đang sử dụng" : isUltra ? "Bạn đang có gói cao hơn" : "Nâng cấp lên PRO"}
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
          />

          <PackageCard
            title="Gói ULTRA"
            description="Dành cho power user cần giới hạn cao nhất và trải nghiệm ưu tiên."
            price={ultraPrice}
            accent="rose"
            active={isUltra}
            disabled={isUltra || isProcessing}
            badge="Đề xuất"
            features={[
              "Ghim tối đa 10 tài liệu quan trọng",
              "Chia sẻ template tối đa 10 tài liệu",
              "Truy cập mô hình AI Premium",
              "Hỗ trợ ưu tiên",
            ]}
            onClick={() => handleUpgrade("ULTRA")}
            buttonLabel={isUltra ? "Đang sử dụng" : "Nâng cấp lên ULTRA"}
            icon={<Zap className="h-5 w-5 text-rose-500" />}
          />
        </div>
      </div>

      {/* Quyền lợi + Lịch sử giao dịch bên dưới */}
      <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <Card className="overflow-hidden border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Quyền lợi nâng cấp</p>
            </div>
            <ul className="space-y-3">
              {[
                "Tăng quota tài liệu và tác vụ học tập",
                "Mở rộng khả năng chia sẻ và ghim tài liệu",
                "Tối ưu trải nghiệm AI cho nhu cầu học tập nặng",
              ].map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <PaymentHistorySection paymentHistory={paymentHistory} />
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

      <div className="relative z-10 flex flex-1 flex-col p-6 lg:p-8">
        {badge ? (
          <div className="absolute right-4 top-4">
            <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", style.badge)}>{badge}</span>
          </div>
        ) : null}

        <div className="mb-2 flex items-center gap-2">
          <span className={style.icon}>{icon}</span>
          <h3 className={cn("text-xl font-bold", style.title)}>{title}</h3>
        </div>
        <p className={cn("mb-5 text-sm leading-relaxed", style.desc)}>{description}</p>

        <div className="mb-5 flex items-baseline gap-1">
          <span className={cn("text-4xl font-black", style.price)}>{price.toLocaleString()}đ</span>
          <span className={cn("font-medium", style.sub)}>/ tháng</span>
        </div>

        <ul className="mb-6 flex-1 space-y-3">
          {features.map((feature) => (
            <li className={cn("flex gap-3 text-sm", style.feature)} key={feature}>
              <Check className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon)} />
              {feature}
            </li>
          ))}
        </ul>

        <Button onClick={onClick} disabled={disabled} className={cn("w-full py-5 text-base font-bold transition-all", style.button)}>
          {buttonLabel}
          {!active && !disabled && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
}
