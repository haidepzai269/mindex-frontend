"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, UserPlus, Mail, Lock, User, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  // Real-time email check states
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [emailError, setEmailError] = useState("");

  const checkEmail = useCallback(async (email: string) => {
    if (!email) {
      setEmailStatus('idle');
      return;
    }

    // Basic regex check before API call
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('invalid');
      setEmailError("Email không hợp lệ");
      return;
    }

    setEmailStatus('checking');
    try {
      const response: any = await fetchApi(`/auth/check-email?email=${encodeURIComponent(email)}`);
      if (response.success) {
        if (response.data.available) {
          setEmailStatus('available');
          setEmailError("");
        } else {
          setEmailStatus('taken');
          setEmailError("Email này đã được sử dụng");
        }
      }
    } catch (err) {
      setEmailStatus('error' as any);
      console.error("Check email failed", err);
    }
  }, []);

  useEffect(() => {
    if (formData.email) {
      const timer = setTimeout(() => {
        checkEmail(formData.email);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setEmailStatus('idle');
    }
  }, [formData.email, checkEmail]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response: any = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.success) {
        toast.success("Đăng ký thành công!");
        
        const { access_token, refresh_token } = response.data;
        // Save tokens to cookies via internal API for better reliability on Cloudflare
        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
        });
        
        // Update store
        setUser({
           id: response.data.user_id,
           email: response.data.email,
           name: response.data.name,
           role: 'user',
           bio: response.data.bio || "",
           urls: response.data.urls || [],
           avatar_url: response.data.avatar_url || "",
           quota: { pinnedCount: 0, maxPins: 3 }
        });

        router.push("/library");
      }
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-3 sm:px-6 sm:py-4">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-secondary/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="glass-card relative z-10 w-full max-w-md p-5 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-col items-center sm:mb-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary transition-all group-hover:bg-secondary/80 sm:mb-4 sm:h-12 sm:w-12">
            <BookOpen className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản mới</h1>
          <p className="text-sm text-muted-foreground mt-1">Bắt đầu hành trình học tập cùng Mindex</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input 
                placeholder="Nguyễn Văn A" 
                className="glass-input !h-10 pl-10 sm:!h-11" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Email sinh viên</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
              <Input 
                type="email" 
                placeholder="2112xxxx@student.hcmus.edu.vn" 
                className={cn(
                  "glass-input !h-10 pl-10 transition-all duration-300 sm:!h-11",
                  emailStatus !== 'idle' && "pr-10",
                  emailStatus === 'available' && "border-emerald-500/50 bg-emerald-500/5",
                  emailStatus === 'taken' && "border-red-500/50 bg-red-500/5",
                  emailStatus === 'invalid' && "border-amber-500/50 bg-amber-500/5"
                )} 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {emailStatus === 'checking' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                {emailStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />}
                {emailStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-500 animate-in zoom-in duration-300" />}
                {emailStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-amber-500 animate-in zoom-in duration-300" />}
              </div>
            </div>
            {emailError && (
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                {emailError}
              </p>
            )}
            {emailStatus === 'available' && (
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                Email khả dụng
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input 
                type="password" 
                placeholder="Tối thiểu 8 ký tự" 
                className="glass-input !h-10 pl-10 sm:!h-11" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || emailStatus === 'taken' || emailStatus === 'checking' || emailStatus === 'invalid'} 
            className="btn-primary mt-1 h-10 w-full sm:h-11"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={18} className="mr-2" /> Đăng ký ngay
              </>
            )}
          </Button>

          <GoogleLoginButton intent="register" />
        </form>

        <div className="mt-5 text-center text-xs text-muted-foreground sm:mt-6 sm:text-sm">
          Đã có tài khoản? <a href="/login" className="text-foreground hover:text-primary transition-colors font-medium">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
}
