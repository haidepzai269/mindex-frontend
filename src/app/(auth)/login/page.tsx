"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, KeyRound, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response: any = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.success) {
        const { access_token, refresh_token, user: userData } = response.data;
        const userRole = userData.role || 'user';

        // Save tokens to cookies for middleware access
        if (access_token) {
          Cookies.set("access_token", access_token, { expires: 1/24, secure: true, sameSite: 'lax' });
        }
        if (refresh_token) {
          Cookies.set("refresh_token", refresh_token, { expires: 7, secure: true, sameSite: 'lax' });
        }

        // Update user info in store
        setUser({
           id: userData.id,
           email: userData.email,
           name: userData.name,
           role: userRole,
           bio: userData.bio || "",
           urls: userData.urls || [],
           avatar_url: userData.avatar_url || "",
           quota: userData.quota || { pinnedCount: 0, maxPins: 3 }
        });

        if (userRole === 'admin') {
          toast.success("Đăng nhập Admin thành công!");
          setPendingUser(userData);
          setShowRoleDialog(true);
        } else {
          toast.success("Đăng nhập thành công!");
          router.push("/library");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Đăng nhập thất bại. Kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (path: string) => {
    setShowRoleDialog(false);
    router.push(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 glass-card relative z-10 mx-4">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-gradient flex items-center justify-center shadow-[0_0_20px_rgba(184,41,255,0.4)] mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Chào mừng đến Mindex</h1>
          <p className="text-sm text-white/50 mt-1">Đăng nhập tài khoản sinh viên</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase text-white/60">Mật khẩu</label>
              <Link href="/reset-password" className="text-xs text-primary hover:text-white transition-colors">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                type="password" 
                placeholder="••••••••" 
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
                <KeyRound size={18} className="mr-2" /> Đăng nhập
              </>
            )}
          </Button>
          <GoogleLoginButton intent="login" />
        </form>

        <div className="mt-8 text-center text-sm text-white/50">
          Chưa có tài khoản? <a href="/register" className="text-white hover:text-primary transition-colors font-medium">Đăng ký ngay</a>
        </div>
      </div>

      <RoleSelectionDialog 
        open={showRoleDialog} 
        onOpenChange={setShowRoleDialog}
        onSelect={handleRoleSelect}
      />
    </div>
  );
}
