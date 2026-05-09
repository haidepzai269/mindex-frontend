"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, CheckCircle2, Loader2, X, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useProcessingSSE } from "@/hooks/useProcessingSSE";
import { NotificationBell } from "@/components/user/NotificationBell";

function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId");

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDocId);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Hook SSE để theo dõi tiến độ từ backend
  const { data: sseData, error: sseError } = useProcessingSSE(activeDocId);

  useEffect(() => {
    if (initialDocId) {
      setActiveDocId(initialDocId);
      setStatus("processing");
    }
  }, [initialDocId]);

  useEffect(() => {
    if (sseData) {
      if (sseData.status === 'ready') {
        setStatus("success");
        setTimeout(() => router.push("/library"), 2000);
      } else if (sseData.status === 'error') {
        setStatus("error");
      }
    }
  }, [sseData, router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setUploadProgress(10);
    
    try {
      // 1. Lấy Signature từ backend
      const presignResponse: any = await fetchApi("/processing/presign", { method: "POST" });
      if (!presignResponse.success) throw new Error("Không thể lấy chữ ký upload");
      
      const { signature, timestamp, api_key, upload_url } = presignResponse.data;
      setUploadProgress(30);

      // 2. Upload trực tiếp lên Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", "mindex_uploads");
      formData.append("resource_type", "raw");

      const uploadResp = await fetch(upload_url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResp.ok) throw new Error("Lỗi khi upload lên Cloudinary");
      const uploadData = await uploadResp.json();
      setUploadProgress(60);

      // 3. Gửi file trực tiếp lên Backend Go (Bỏ qua việc download từ Cloudinary)
      const backendFormData = new FormData();
      backendFormData.append("file", file);
      backendFormData.append("cloudinary_url", uploadData.secure_url);
      backendFormData.append("filename", file.name);

      const initiateResponse: any = await fetchApi("/processing/upload", {
        method: "POST",
        body: backendFormData, // multipart/form-data
        // Lưu ý: fetchApi cần hỗ trợ nhận FormData (không JSON.stringify)
      });

      if (!initiateResponse.success) throw new Error(initiateResponse.message || "Không thể khởi tạo xử lý");

      setUploadProgress(100);
      setActiveDocId(initiateResponse.data.document_id);
      setStatus("processing");
      toast.success("Tải lên thành công! Đang tiến hành phân tích...");

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Có lỗi xảy ra trong quá trình upload.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-6 md:pt-16 px-4 md:px-8 pb-28 md:pb-8 h-full relative overflow-y-auto">
      {/* Top action bar */}
      <div className="hidden md:block absolute top-6 right-8 z-50">
        <NotificationBell />
      </div>

      {/* Background decorations */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-6 md:mb-10">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <UploadCloud className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">Tải lên Tài liệu mới</h1>
          <p className="text-muted-foreground">Hệ thống đang chuẩn bị dữ liệu giúp bạn có thể bắt đầu tra cứu và trò chuyện ngay lập tức</p>
        </div>

        {status === "idle" ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            {!file ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed ${isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'} rounded-2xl p-6 md:p-12 text-center transition-all cursor-pointer hover:border-primary/50 hover:bg-accent/30`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 shadow-sm border border-border text-muted-foreground">
                   <UploadCloud size={24} />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Kéo thả file PDF hoặc DOCX vào đây</h3>
                <p className="text-sm text-muted-foreground mb-6">hoặc click để chọn file từ máy tính</p>

                <Button variant="outline">
                  Chọn File
                </Button>

                <div className="mt-8 text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center justify-center gap-4">
                  <span>PDF, DOCX</span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span>TỐI ĐA 50MB</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-primary/30 bg-card p-6 relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                  <FileText size={48} className="text-primary mb-4" />
                  <h3 className="font-semibold text-lg text-foreground mb-1 truncate max-w-full px-4">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                <div className="bg-muted/40 rounded-xl p-4 border border-border/70 mb-6 flex items-start gap-3">
                  <div className="mt-0.5 text-blue-500"><Globe size={18} /></div>
                  <div className="flex-1">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="flex h-5 items-center">
                        <input type="checkbox" className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-foreground block mb-0.5">Chia sẻ tài liệu vào Thư viện chung</span>
                        <span className="text-muted-foreground text-xs block">Tài liệu sẽ được lưu vĩnh viễn không giới hạn 24h và giúp sinh viên khác truy cập được từ tìm kiếm.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <Button onClick={handleUpload} className="w-full h-12 text-base">
                  <UploadCloud size={20} className="mr-2" /> Tải lên & Bắt đầu phân tích
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-8 animate-in zoom-in duration-300 fade-in text-center">
             <div className="mb-6 relative">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center border transition-colors ${
                  status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                  status === 'error' ? 'bg-red-500/10 border-red-500/30' : 
                  'bg-primary/10 border-primary/30'
                }`}>
                  {status === 'success' ? (
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  ) : status === 'error' ? (
                    <AlertCircle size={40} className="text-red-500" />
                  ) : (
                    <Loader2 size={40} className="text-primary animate-spin" />
                  )}
                </div>
              </div>
              
               <h3 className="text-xl font-semibold mb-2">
                 {status === 'uploading' ? 'Đang tải lên...' : 
                  status === 'processing' ? 'Đang phân tích tài liệu...' : 
                  status === 'success' ? 'Hoàn tất!' : 'Xử lý thất bại'}
               </h3>
               <p className="text-muted-foreground text-sm mb-8">{file?.name || 'Tài liệu đang xử lý'}</p>

               {(status === 'uploading' || status === 'processing') && (
                 <div className="space-y-2 mb-8">
                   <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                     <span>Tiến độ tổng quát</span>
                     <span>{status === 'uploading' ? Math.floor(uploadProgress * 0.3) : (30 + Math.floor((sseData?.progress || 0) * 0.7))}%</span>
                   </div>
                   <Progress value={status === 'uploading' ? Math.floor(uploadProgress * 0.3) : (30 + Math.floor((sseData?.progress || 0) * 0.7))} className="h-2 bg-white/10 [&>div]:bg-primary-gradient" />
                 </div>
               )}

               {status === 'error' && (
                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 flex items-center gap-3 text-red-500 text-left text-sm">
                   <AlertCircle size={20} className="shrink-0" />
                   <span>{sseError || "Tài liệu không đủ độ dài hoặc lỗi kỹ thuật. Vui lòng kiểm tra lại nội dung file."}</span>
                 </div>
               )}

               <div className="space-y-4 text-sm text-left bg-muted/30 rounded-xl p-5 border border-border/50">
                  <PipelineStep 
                    label="Giai đoạn 1: Tiếp nhận và đọc tài liệu" 
                    done={status === 'processing' || status === 'success'} 
                    loading={status === 'uploading'} 
                  />
                  <PipelineStep 
                    label="Giai đoạn 2: Phân tích và kiểm duyệt nội dung" 
                    done={(sseData?.progress || 0) >= 50 || status === 'success'} 
                    loading={status === 'processing' && (sseData?.progress || 0) < 50} 
                  />
                  <PipelineStep 
                    label="Giai đoạn 3: Tối ưu dữ liệu và hoàn tất" 
                    done={status === 'success'} 
                    loading={(sseData?.progress || 0) >= 50 && status !== 'success' && status !== 'error'} 
                  />
               </div>

              {(status === 'success' || status === 'error') && (
                <Button onClick={() => router.push('/library')} variant="outline" className="w-full mt-8">
                  Quay lại Thư viện
                </Button>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <UploadPageContent />
    </Suspense>
  )
}

function PipelineStep({ label, done, loading }: { label: string, done: boolean, loading: boolean }) {
  return (
    <div className={`flex items-center gap-3 transition-colors ${done ? 'text-emerald-600 dark:text-emerald-400' : loading ? 'text-foreground' : 'text-muted-foreground/40'}`}>
      <div className="w-5 h-5 flex flex-shrink-0 items-center justify-center">
        {done ? (
          <CheckCircle2 size={16} />
        ) : loading ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}
