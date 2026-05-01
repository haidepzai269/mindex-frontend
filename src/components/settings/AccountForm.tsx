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
    otp_code: "",
  });

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>("/auth/me/send-otp", {
        method: "POST",
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
          otp_code: formData.otp_code,
        }),
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
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Key className="text-primary" size={20} />
          Bảo mật tài khoản
        </CardTitle>
        <CardDescription>Hãy thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form id="account-form" onSubmit={handleSubmit} className="space-y-5">
          <Field label="Mật khẩu cũ">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.old_password}
                onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                className="h-11 border-border bg-background pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Mật khẩu mới">
              <Input
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className="h-11 border-border bg-background"
                required
              />
            </Field>
            <Field label="Xác nhận mật khẩu">
              <Input
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                className="h-11 border-border bg-background"
                required
              />
            </Field>
          </div>

          <Field label="Mã xác thực Email" hint="Mã xác thực sẽ được gửi tới địa chỉ email tài khoản của bạn.">
            <div className="flex gap-3">
              <Input
                placeholder="Nhập mã 6 chữ số..."
                value={formData.otp_code}
                onChange={(e) => setFormData({ ...formData, otp_code: e.target.value })}
                className="h-11 flex-1 border-border bg-background"
                maxLength={6}
              />
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || cooldown > 0}
                variant="outline"
                className="h-11 min-w-[120px] border-border bg-background hover:bg-accent"
              >
                {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown > 0 ? `${cooldown}s` : "Gửi mã"}
              </Button>
            </div>
          </Field>

          <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
            <ShieldAlert size={20} className="mt-0.5 shrink-0" />
            <div className="text-[11px] font-medium italic leading-normal opacity-90">
              Ghi chú: Bạn bắt buộc phải nhập mã OTP từ Email để xác nhận đổi mật khẩu. Sau khi đổi thành công, bạn có thể được yêu cầu đăng nhập lại.
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="border-t border-border/70 bg-muted/30">
        <Button form="account-form" type="submit" disabled={loading} className="h-11 px-8 font-bold">
          {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
          Đổi mật khẩu
        </Button>
      </CardFooter>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-sm font-semibold text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-[11px] italic text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
