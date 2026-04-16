"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Mail, Lock, KeyRound, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    otp_code: "",
    new_password: "",
    confirm_password: "",
  });
  const router = useRouter();

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.email) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>("/auth/forgot-password/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: formData.email }),
      });
      if (res.success) {
        toast.success(res.message);
        setStep(2);
        setCooldown(60);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi mã xác thực");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          otp_code: formData.otp_code,
          new_password: formData.new_password,
        }),
      });
      if (res.success) {
        toast.success("Đặt lại mật khẩu thành công!");
        setStep(3); // Thành công
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 glass-card relative z-10 mx-4">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-4 transition-all group-hover:bg-secondary/80">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Khôi phục mật khẩu</h1>
          <p className="text-sm text-white/50 mt-1 text-center">
            {step === 1 && "Nhập email của bạn để nhận mã xác thực"}
            {step === 2 && `Mã xác thực đã được gửi tới ${formData.email}`}
            {step === 3 && "Mật khẩu của bạn đã được cập nhật"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-white/60">Email tài khoản</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input 
                  type="email" 
                  placeholder="2112xxxx@student.hcmus.edu.vn" 
                  className="glass-input pl-10" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-primary h-12">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tiếp tục"}
            </Button>

            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-white/60">Mã xác thực (OTP)</label>
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="6 chữ số" 
                  className="glass-input text-center tracking-[0.5em] font-bold" 
                  maxLength={6}
                  required 
                  value={formData.otp_code}
                  onChange={(e) => setFormData({...formData, otp_code: e.target.value})}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="glass-card border-white/10 hover:bg-white/5" 
                  disabled={cooldown > 0 || loading}
                  onClick={() => handleSendOTP()}
                >
                  {cooldown > 0 ? `${cooldown}s` : "Gửi lại"}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-white/60">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="glass-input pl-10" 
                  required 
                  value={formData.new_password}
                  onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-white/60">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="glass-input pl-10" 
                  required 
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-primary h-12 mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đặt lại mật khẩu"}
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/30">
              <CheckCircle2 size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Thành công!</h3>
              <p className="text-sm text-white/50">Mật khẩu của bạn đã được khôi phục. Đang chuyển hướng về trang đăng nhập...</p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-white/90 px-4 text-sm font-bold text-black hover:bg-white transition-all shadow-md"
            >
              Đến trang đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
