"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldAlert, Key, Loader2, Eye, EyeOff } from "lucide-react";

export default function AccountForm() {
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
    otp_code: ""
  });

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>("/auth/me/send-otp", {
        method: "POST"
      });
      if (res.success) {
        toast.success("Mã xác thực đã được gửi tới Email của bạn");
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi mã xác thực");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (!formData.otp_code) {
      toast.error("Vui lòng nhập mã xác thực OTP từ Email!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>("/auth/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password,
          otp_code: formData.otp_code
        })
      });
      if (res.success) {
        toast.success(res.message);
        setFormData({ old_password: "", new_password: "", confirm_password: "", otp_code: "" });
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Key className="text-secondary" size={20} />
          Bảo mật tài khoản
        </CardTitle>
        <CardDescription className="text-white/50">
          Hãy thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form id="account-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 ml-1">Mật khẩu cũ</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                value={formData.old_password}
                onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                className="bg-white/5 border-white/10 h-11 pr-10"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-semibold text-white/70 ml-1">Mật khẩu mới</label>
               <Input 
                 type="password"
                 value={formData.new_password}
                 onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                 className="bg-white/5 border-white/10 h-11"
                 required
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-semibold text-white/70 ml-1">Xác nhận mật khẩu</label>
               <Input 
                 type="password"
                 value={formData.confirm_password}
                 onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                 className="bg-white/5 border-white/10 h-11"
                 required
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 ml-1">Mã xác thực Email</label>
            <div className="flex gap-3">
              <Input 
                placeholder="Nhập mã 6 chữ số..."
                value={formData.otp_code}
                onChange={(e) => setFormData({ ...formData, otp_code: e.target.value })}
                className="bg-white/5 border-white/10 h-11 flex-1"
                maxLength={6}
              />
              <Button 
                type="button" 
                onClick={handleSendOtp} 
                disabled={sendingOtp || cooldown > 0}
                variant="outline"
                className="h-11 px-6 border-white/10 bg-white/5 hover:bg-white/10 min-w-[120px]"
              >
                {sendingOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : cooldown > 0 ? (
                  `${cooldown}s`
                ) : (
                  "Gửi mã"
                )}
              </Button>
            </div>
            <p className="text-[11px] text-white/30 italic">Mã xác thực sẽ được gửi tới địa chỉ email tài khoản của bạn.</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-500 items-start">
             <ShieldAlert size={20} className="shrink-0 mt-0.5" />
             <div className="text-[11px] leading-normal font-medium italic opacity-80">
                Ghi chú: Bạn bắt buộc phải nhập mã OTP từ Email để xác nhận đổi mật khẩu. Sau khi đổi thành công, bạn có thể được yêu cầu đăng nhập lại.
             </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="border-t border-white/5 bg-white/[0.02]">
        <Button 
          form="account-form" 
          type="submit" 
          disabled={loading}
          className="bg-primary-gradient h-11 px-8 font-bold"
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Đổi mật khẩu
        </Button>
      </CardFooter>
    </Card>
  );
}
