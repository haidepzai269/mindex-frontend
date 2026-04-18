"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [message, setMessage] = useState("Đang kiểm tra mã mời...");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setMessage("Mã mời không hợp lệ hoặc đã hết hạn.");
      return;
    }

    const autoJoin = async () => {
      try {
        const res = await fetchApi("/rooms/join", {
          method: "POST",
          body: JSON.stringify({ invite_code: code }),
        });

        if (res.success) {
          setStatus("success");
          setMessage(`Đang vào phòng ${res.data.name}...`);
          setTimeout(() => {
            router.push(`/rooms/${res.data.id}`);
          }, 1500);
        } else {
          setStatus("error");
          setMessage(res.message || "Không thể tham gia phòng này.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Có lỗi xảy ra khi kết nối máy chủ.");
      }
    };

    autoJoin();
  }, [code, router]);

  return (
    <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-[32px] bg-white/5 border border-white/10 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-2">
          {status === "loading" && <Loader2 size={36} className="text-secondary animate-spin" />}
          {status === "error" && <AlertTriangle size={36} className="text-red-400" />}
          {status === "success" && <CheckCircle2 size={36} className="text-green-400" />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {status === "loading" && "Tham gia phòng học"}
            {status === "error" && "Không thể tham gia"}
            {status === "success" && "Thành công!"}
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {status === "error" && (
          <div className="pt-4 flex flex-col gap-3">
            <Button 
              className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-black font-bold"
              onClick={() => router.push("/library")}
            >
              Về thư viện của tôi
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 rounded-xl text-white/40"
              onClick={() => router.push("/rooms")}
            >
              Nhập mã khác
            </Button>
          </div>
        )}

        {status === "loading" && (
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-secondary"
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020205] flex items-center justify-center">
        <Loader2 className="text-secondary animate-spin" size={32} />
      </div>
    }>
      <JoinRoomContent />
    </Suspense>
  );
}
