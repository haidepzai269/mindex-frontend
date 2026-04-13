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
        
        // Save tokens to cookies via internal API for better reliability on Cloudflare
        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
        });
        
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
      
      <div className="w-full flex justify-center google-btn-container overflow-hidden rounded-full max-w-[400px] mx-auto">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            toast.error("Đăng nhập Google thất bại");
          }}
          use_fedcm_for_prompt={false}
          theme="filled_black"
          shape="pill"
          width="320px"
          text="continue_with"
          logo_alignment="left"
        />
      </div>

      <style jsx global>{`
        .google-btn-container {
          background-color: transparent !important;
          color-scheme: dark !important;
        }
        .google-btn-container > div {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          background-color: transparent !important;
        }
        .google-btn-container iframe {
          margin: 0 auto !important;
          border-radius: 9999px !important;
          color-scheme: dark !important;
        }
      `}</style>
    </div>
  );
}
