"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, Loader2, Camera, Upload } from "lucide-react";
import { useRef } from "react";

export default function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    urls: [] as string[],
    avatar_url: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        urls: user.urls || [],
        avatar_url: user.avatar_url || ""
      });
    }
  }, [user]);

  const handleAddUrl = () => {
    setFormData(prev => ({ ...prev, urls: [...prev.urls, ""] }));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, urls: newUrls }));
  };

  const handleRemoveUrl = (index: number) => {
    setFormData(prev => ({ ...prev, urls: prev.urls.filter((_, i) => i !== index) }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // 1. Lấy Signature từ backend
      const presignResponse: any = await fetchApi("/processing/presign", { method: "POST" });
      if (!presignResponse.success) throw new Error("Không thể lấy chữ ký upload");
      
      const { signature, timestamp, api_key, upload_url } = presignResponse.data;

      // 2. Upload trực tiếp lên Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("api_key", api_key);
      uploadFormData.append("timestamp", timestamp);
      uploadFormData.append("signature", signature);
      uploadFormData.append("folder", "mindex_uploads");
      uploadFormData.append("resource_type", "raw");

      const uploadResp = await fetch(upload_url, {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResp.ok) throw new Error("Lỗi khi upload lên Cloudinary");
      const uploadData = await uploadResp.json();
      
      setFormData(prev => ({ ...prev, avatar_url: uploadData.secure_url }));
      toast.success("Đã tải ảnh lên thành công. Đừng quên nhấn Lưu hồ sơ!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Không thể tải ảnh lên");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: any }>("/auth/me/profile", {
        method: "PATCH",
        body: JSON.stringify(formData)
      });
      if (res.success && user) {
        toast.success("Đã cập nhật hồ sơ thành công!");
        // Update local store
        setUser({ ...user, ...formData });
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Hồ sơ công khai</CardTitle>
        <CardDescription className="text-white/50">
          Thông tin này sẽ được hiển thị cho các người dùng khác khi bạn chia sẻ tài liệu.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="w-24 h-24 border-2 border-white/10 group-hover:border-primary/50 transition-all overflow-hidden flex items-center justify-center">
              {isUploadingAvatar ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {formData.name.substring(0, 2).toUpperCase() || "SV"}
                </AvatarFallback>
              )}
            </Avatar>
            {!isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </div>
          <div className="space-y-2">
             <Button 
               variant="outline" 
               size="sm" 
               className="bg-white/5 border-white/10 hover:bg-white/10"
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploadingAvatar}
             >
               {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
               Thay đổi ảnh
             </Button>
             <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">JPG, PNG, GIF. Max 2MB.</p>
          </div>
        </div>

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 ml-1">Tên hiển thị</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên của bạn..."
              className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
            />
            <p className="text-[11px] text-white/30 italic">Tên này sẽ xuất hiện trên các đóng góp của bạn trong thư viện chung.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 ml-1">Email</label>
            <Input 
              value={user?.email || ""}
              disabled
              className="bg-white/5 border-white/5 text-white/40 cursor-not-allowed h-11"
            />
            <p className="text-[11px] text-white/30 italic">Bạn có thể quản lý email định danh trong mục cài đặt tài khoản.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 ml-1">Bio (Giới thiệu bản thân)</label>
            <Textarea 
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Bạn là ai? Bạn đang học chuyên ngành gì?"
              className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-white/70 ml-1">Liên kết (URLs)</label>
              <Button type="button" onClick={handleAddUrl} variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 text-xs">
                <Plus size={14} className="mr-1" /> Thêm URL
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://..."
                    className="bg-white/5 border-white/10 h-10 flex-1"
                  />
                  <Button type="button" onClick={() => handleRemoveUrl(index)} variant="ghost" size="icon" className="text-white/20 hover:text-red-400 hover:bg-red-400/5">
                    <X size={16} />
                  </Button>
                </div>
              ))}
              {formData.urls.length === 0 && (
                <div className="text-center py-4 border border-dashed border-white/5 rounded-xl text-white/20 text-xs">
                  Chưa có liên kết nào được thêm.
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="border-t border-white/5 bg-white/[0.02]">
        <Button 
          form="profile-form" 
          type="submit" 
          disabled={loading}
          className="bg-primary-gradient hover:scale-105 transition-transform shadow-[0_0_20px_rgba(184,41,255,0.3)] h-11 px-8 font-bold"
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Cập nhật hồ sơ
        </Button>
      </CardFooter>
    </Card>
  );
}
