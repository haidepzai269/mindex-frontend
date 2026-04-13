"use client";

import { GoogleLogin } from "@react-oauth/google";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

import Cookies from "js-cookie";

interface GoogleLoginButtonProps {
  intent: "login" | "register";
}

export function GoogleLoginButton({ intent }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const response: any = await fetchApi("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          token: credentialResponse.credential, // ID Token
          intent,
        }),
      });

      if (response.success) {
        const { access_token, refresh_token, user: userData } = response.data;
        
        // Save tokens to cookies for middleware access
        const cookieOptions = { expires: 7, path: '/', sameSite: 'Lax' as const, secure: true, domain: window.location.hostname };
        if (access_token) {
          Cookies.set("access_token", access_token, cookieOptions);
        }
        if (refresh_token) {
          Cookies.set("refresh_token", refresh_token, cookieOptions);
        }
        
        // Cập nhật thông tin user vào store
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'user',
          bio: userData.bio || "",
          urls: userData.urls || [],
          avatar_url: userData.avatar_url || "",
          quota: userData.quota || { pinnedCount: 0, maxPins: 3 }
        });

        toast.success("Đăng nhập bằng Google thành công!");
        router.push("/library");
      }
    } catch (error: any) {
      // Xử lý lỗi đặc biệt: Tài khoản tồn tại bằng mật khẩu
      if (error.error === "ACCOUNT_EXISTS_WITH_PASSWORD") {
        toast.error("Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bình thường.");
      } else {
        toast.error(error.message || "Đăng nhập Google thất bại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10"></span>
        </div>
        <div className="relative px-4 bg-background">
          <span className="text-xs uppercase text-white/40 font-medium tracking-wider">Hoặc sử dụng</span>
        </div>
      </div>
      
      <div className="w-full flex justify-center google-btn-container">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            toast.error("Đăng nhập Google thất bại");
          }}
          use_fedcm_for_prompt={false}
          theme="filled_black"
          shape="pill"
          width="100%"
          text="continue_with"
        />
      </div>

      <style jsx global>{`
        .google-btn-container > div {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }
        .google-btn-container iframe {
          margin: 0 auto !important;
        }
      `}</style>
    </div>
  );
}
