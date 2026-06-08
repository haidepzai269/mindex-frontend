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
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
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
        body: JSON.stringify({ ...formData, remember_me: rememberMe }),
      });

      if (response.success) {
        const { access_token, refresh_token, user: userData } = response.data;
        const userRole = userData.role || 'user';

        // Save tokens to cookies via internal API for better reliability on Cloudflare
        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token, remember_me: rememberMe }),
        });

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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-3 sm:px-6 sm:py-4">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-secondary/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="glass-card relative z-10 w-full max-w-md p-5 sm:p-6 lg:p-7">
        
        <div className="mb-5 flex flex-col items-center sm:mb-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary transition-all group-hover:bg-secondary/80 sm:mb-4 sm:h-12 sm:w-12">
            <BookOpen className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chào mừng đến Mindex</h1>
          <p className="text-sm text-muted-foreground mt-1">Đăng nhập tài khoản sinh viên</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Email sinh viên</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input 
                type="email" 
                placeholder="2112xxxx@student.hcmus.edu.vn" 
                className="glass-input !h-10 pl-10 sm:!h-11" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Mật khẩu</label>
              <Link href="/reset-password" className="text-xs text-primary hover:text-foreground transition-colors">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="glass-input !h-10 pl-10 sm:!h-11" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-border bg-muted accent-primary cursor-pointer"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
              Duy trì đăng nhập (10 ngày)
            </label>
          </div>

          <Button type="submit" disabled={loading} className="btn-primary mt-1 h-10 w-full sm:h-11">
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

        <div className="mt-5 text-center text-xs text-muted-foreground sm:mt-6 sm:text-sm">
          Chưa có tài khoản? <a href="/register" className="text-foreground hover:text-primary transition-colors font-medium">Đăng ký ngay</a>
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
