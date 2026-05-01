"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, Loader2, Camera, Upload } from "lucide-react";

export default function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    urls: [] as string[],
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        urls: user.urls || [],
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  const handleAddUrl = () => {
    setFormData((prev) => ({ ...prev, urls: [...prev.urls, ""] }));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData((prev) => ({ ...prev, urls: newUrls }));
  };

  const handleRemoveUrl = (index: number) => {
    setFormData((prev) => ({ ...prev, urls: prev.urls.filter((_, i) => i !== index) }));
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
      const presignResponse: any = await fetchApi("/processing/presign", { method: "POST" });
      if (!presignResponse.success) throw new Error("Không thể lấy chữ ký upload");

      const { signature, timestamp, api_key, upload_url } = presignResponse.data;

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

      setFormData((prev) => ({ ...prev, avatar_url: uploadData.secure_url }));
      toast.success("Đã tải ảnh lên thành công. Đừng quên nhấn Lưu hồ sơ!");
    } catch (error: any) {
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
        body: JSON.stringify(formData),
      });
      if (res.success && user) {
        toast.success("Đã cập nhật hồ sơ thành công!");
        setUser({ ...user, ...formData });
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Hồ sơ công khai</CardTitle>
        <CardDescription>
          Thông tin này sẽ được hiển thị cho các người dùng khác khi bạn chia sẻ tài liệu.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex items-center gap-6">
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          <div className="group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-border transition-all group-hover:border-primary/50">
              {isUploadingAvatar ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/15 text-2xl font-bold text-primary">
                  {formData.name.substring(0, 2).toUpperCase() || "SV"}
                </AvatarFallback>
              )}
            </Avatar>
            {!isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/10 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-black/40">
                <Camera size={24} className="text-foreground dark:text-white" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-background hover:bg-accent"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload size={14} className="mr-2" />}
              Thay đổi ảnh
            </Button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">JPG, PNG, GIF. Max 2MB.</p>
          </div>
        </div>

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          <Field label="Tên hiển thị" hint="Tên này sẽ xuất hiện trên các đóng góp của bạn trong thư viện chung.">
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên của bạn..."
              className="h-11 border-border bg-background"
            />
          </Field>

          <Field label="Email" hint="Bạn có thể quản lý email định danh trong mục cài đặt tài khoản.">
            <Input value={user?.email || ""} disabled className="h-11 cursor-not-allowed border-border bg-muted text-muted-foreground" />
          </Field>

          <Field label="Bio (Giới thiệu bản thân)">
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Bạn là ai? Bạn đang học chuyên ngành gì?"
              className="min-h-[100px] resize-none border-border bg-background"
            />
          </Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="ml-1 text-sm font-semibold text-foreground">Liên kết (URLs)</label>
              <Button type="button" onClick={handleAddUrl} variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10">
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
                    className="h-10 flex-1 border-border bg-background"
                  />
                  <Button type="button" onClick={() => handleRemoveUrl(index)} variant="ghost" size="icon" className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500">
                    <X size={16} />
                  </Button>
                </div>
              ))}
              {formData.urls.length === 0 && (
                <div className="rounded-xl border border-dashed border-border px-4 py-4 text-center text-xs text-muted-foreground">
                  Chưa có liên kết nào được thêm.
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="border-t border-border/70 bg-muted/30">
        <Button form="profile-form" type="submit" disabled={loading} className="h-11 px-8 font-bold">
          {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
          Cập nhật hồ sơ
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
