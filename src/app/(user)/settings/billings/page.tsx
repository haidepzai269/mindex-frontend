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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function UserBillingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useSWR<{ success: boolean; data: any }>("/billings/packages", fetcher as any);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const status = searchParams.get("status");
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
          success: "Nâng cấp gói cước thành công! 🎉",
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
        body: JSON.stringify({ package_name: pkg }) 
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
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto w-full relative">
      <div className="text-center space-y-3 mb-10 mt-8 relative z-10">
        <AnimatePresence>
          {paymentError && (
             <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 flex justify-center"
             >
               <Alert variant="destructive" className="max-w-xl py-4 flex items-start gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                 <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                 <div className="text-left flex flex-col gap-1">
                   <AlertTitle className="text-lg font-bold leading-none">Thanh toán thất bại</AlertTitle>
                   <AlertDescription className="text-sm opacity-90">
                      Giao dịch của bạn không thể hoàn tất hoặc đã bị hủy. Vui lòng kiểm tra lại phương thức thanh toán và thử lại.
                   </AlertDescription>
                 </div>
               </Alert>
             </motion.div>
          )}

          {(isPro || isUltra) && !paymentError && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex justify-center"
            >
              <Alert className="max-w-xl bg-green-500/10 border-green-500/50 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)] py-4 backdrop-blur-sm text-left flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <AlertTitle className="text-lg font-bold leading-none">Giao dịch thành công</AlertTitle>
                  <AlertDescription className="text-sm opacity-90">
                    {isPro ? "Chúc mừng bạn đã nâng cấp lên gói PRO thành công! 🎉" : "Chúc mừng bạn đã nâng cấp lên gói ULTRA thành công! 🚀"}
                  </AlertDescription>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">
          Nâng Cấp Gói <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Trí Tuệ Mindex</span>
        </h1>
        <p className="text-white/50 text-base max-w-2xl mx-auto">
          Mở khóa toàn bộ giới hạn và làm chủ lượng tri thức vô hạn. Tham gia cùng hàng trăm cao thủ khác.
        </p>
      </div>

      {(isLoading || isProcessing) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto relative z-10">
        {/* PRO CARD */}
        <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
          <Card className={`relative overflow-hidden h-full flex flex-col bg-[#111115] border-white/10 ${isPro ? 'ring-2 ring-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'hover:border-white/20'} transition-all`}>
            {/* VIP Tia sáng */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-xl text-white">Gói PRO</h3>
              </div>
              <p className="text-white/40 text-sm mb-6">Lựa chọn hàng đầu để quản lý tài nguyên học tập.</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{proPrice.toLocaleString()}đ</span>
                <span className="text-white/40 font-medium">/ tháng</span>
              </div>
              
              <ul className="space-y-4 flex-1 mb-8">
                {["Ghim tối đa 5 tài liệu quan trọng", "Chia sẻ template 5 tài liệu", "Biểu tượng Vàng Gold VIP", "Prioritized Response AI (Tốc độ x2)"].map((f, i) => (
                  <li className="flex gap-3 text-sm text-white/70" key={i}>
                    <Check className="w-5 h-5 text-yellow-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleUpgrade("PRO")} 
                disabled={isPro || isUltra || isProcessing}
                className={`w-full py-6 text-base font-bold transition-all ${isPro ? 'bg-white/10 text-white cursor-not-allowed' : 'bg-white text-black hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'}`}
              >
                {isPro ? "Đang sử dụng" : isUltra ? "Bạn đã có gói cao hơn" : "Nâng cấp lên PRO"}
                {!isPro && !isUltra && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* ULTRA CARD */}
        <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
          <Card className={`relative overflow-hidden h-full flex flex-col bg-gradient-to-b from-[#1c0816] to-[#0a0208] border-rose-500/30 ${isUltra ? 'ring-2 ring-rose-500 shadow-[0_0_40px_rgba(225,29,72,0.3)]' : 'hover:border-rose-500/50'} transition-all`}>
            {/* Neon đỏ tia sáng */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
            
            <div className="p-8 flex-1 flex flex-col relative z-10">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">
                  ĐỀ XUẤT
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-xl text-white">Gói ULTRA</h3>
              </div>
              <p className="text-rose-200/40 text-sm mb-6">Mở khóa sức mạnh tuyệt đối, dành cho Pro User.</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-rose-100">{ultraPrice.toLocaleString()}đ</span>
                <span className="text-rose-100/40 font-medium">/ tháng</span>
              </div>
              
              <ul className="space-y-4 flex-1 mb-8">
                {["Ghim tối đa 10 tài liệu quan trọng", "Chia sẻ template lên đến 10 tài liệu", "Biểu tượng Neon Đỏ Đẳng Cấp", "Premium AI Model Access (Cerebras, Groq...)", "Được support 1-1 riêng biệt"].map((f, i) => (
                  <li className="flex gap-3 text-sm text-rose-100/70" key={i}>
                    <Check className="w-5 h-5 text-rose-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleUpgrade("ULTRA")} 
                disabled={isUltra || isProcessing}
                className={`w-full py-6 text-base font-bold transition-all ${isUltra ? 'bg-white/10 text-white cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]'}`}
              >
                {isUltra ? "Đang sử dụng" : "Nâng cấp lên ULTRA"}
                {!isUltra && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
            
            {/* Background Blob */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
