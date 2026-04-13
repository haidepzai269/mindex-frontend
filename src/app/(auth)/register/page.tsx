"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, UserPlus, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
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
        // Save tokens to cookies for middleware access
        const cookieOptions = { expires: 7, path: '/', sameSite: 'Lax' as const, secure: true, domain: '.mindex.io.vn' };
        if (access_token) {
          Cookies.set("access_token", access_token, cookieOptions);
        }
        if (refresh_token) {
          Cookies.set("refresh_token", refresh_token, cookieOptions);
        }
        
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 glass-card relative z-10 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-gradient flex items-center justify-center shadow-[0_0_20px_rgba(184,41,255,0.4)] mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tạo tài khoản mới</h1>
          <p className="text-sm text-white/50 mt-1">Bắt đầu hành trình học tập cùng Mindex</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-white/60">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                placeholder="Nguyễn Văn A" 
                className="glass-input pl-10" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-white/60">Email sinh viên</label>
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
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-white/60">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                type="password" 
                placeholder="Tối thiểu 8 ký tự" 
                className="glass-input pl-10" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full btn-primary h-12 mt-2">
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

        <div className="mt-8 text-center text-sm text-white/50">
          Đã có tài khoản? <a href="/login" className="text-white hover:text-primary transition-colors font-medium">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
}
