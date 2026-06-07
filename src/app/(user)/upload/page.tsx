"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertCircle, CheckCircle2, FileText, Globe, Loader2, UploadCloud, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NotificationBell } from "@/components/user/NotificationBell";
import { fetchApi } from "@/lib/api";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  DOCUMENT_UPLOAD_MAX_BYTES,
  uploadDocument,
  validateDocumentFile,
} from "@/lib/upload";
import { useProcessingSSE } from "@/hooks/useProcessingSSE";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId");

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDocId);
  const [activeDocTitle, setActiveDocTitle] = useState("Tài liệu");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  const { data: sseData, error: sseError } = useProcessingSSE(activeDocId);

  useEffect(() => {
    if (initialDocId) {
      setActiveDocId(initialDocId);
      setStatus("processing");
    }
  }, [initialDocId]);

  useEffect(() => {
    if (!sseData) return;
    if (sseData.status === "ready") {
      setStatus("success");
    } else if (sseData.status === "error") {
      setStatus("error");
    }
  }, [sseData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nextFile = acceptedFiles[0];
    if (!nextFile) return;
    const validationError = validateDocumentFile(nextFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(nextFile);
    setActiveDocTitle(nextFile.name);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => toast.error("Chỉ hỗ trợ PDF/DOCX tối đa 50MB."),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: DOCUMENT_UPLOAD_MAX_BYTES,
  });

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setUploadProgress(0);

    try {
      const response = await uploadDocument({
        file,
        onProgress: setUploadProgress,
      });

      const result = response.data;
      setActiveDocId(result.document_id);
      setUploadProgress(100);

      if (result.is_duplicate && result.status === "ready") {
        setStatus("success");
        toast.success(result.message || "Tài liệu đã có trong thư viện.");
        return;
      }

      setStatus("processing");
      toast.success(result.message || "Tải lên thành công, đang phân tích tài liệu.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra trong quá trình upload.";
      toast.error(message);
      setStatus("idle");
    }
  };

  const handleShare = async () => {
    if (!activeDocId || status !== "success") return;
    setIsSharing(true);
    try {
      await fetchApi(`/community/documents/${activeDocId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_public: true }),
      });
      toast.success("Đã chia sẻ vào Thư viện chung.");
      router.push("/library");
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Không thể chia sẻ tài liệu.");
    } finally {
      setIsSharing(false);
    }
  };

  const overallProgress =
    status === "uploading"
      ? Math.min(30, Math.floor(uploadProgress * 0.3))
      : 30 + Math.floor((sseData?.progress || 0) * 0.7);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto px-4 pb-28 pt-6 md:px-8 md:pb-8 md:pt-16">
      <div className="absolute right-8 top-6 z-50 hidden md:block">
        <NotificationBell />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[20%] -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[150px]" />

      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 text-center md:mb-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-primary md:h-16 md:w-16">
            <UploadCloud className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Tải lên tài liệu mới</h1>
          <p className="text-muted-foreground">Mindex sẽ kiểm tra file, lưu bản gốc an toàn và xử lý bằng hàng đợi bền vững.</p>
        </div>

        {status === "idle" ? (
          <div className="animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-500">
            {!file ? (
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all md:p-12 ${
                  isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <input {...getInputProps()} accept={DOCUMENT_UPLOAD_ACCEPT} />
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground shadow-sm">
                  <UploadCloud size={24} />
                </div>
                <h3 className="mb-1 text-lg font-medium text-foreground">Kéo thả file PDF hoặc DOCX vào đây</h3>
                <p className="mb-6 text-sm text-muted-foreground">hoặc click để chọn file từ máy tính</p>

                <Button variant="outline">Chọn File</Button>

                <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  <span>PDF, DOCX</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>Tối đa 50MB</span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-primary/30 bg-card p-6">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFile(null);
                  }}
                  className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Bỏ chọn file"
                >
                  <X size={20} />
                </button>

                <div className="mb-6 flex flex-col items-center">
                  <FileText size={48} className="mb-4 text-primary" />
                  <h3 className="mb-1 max-w-full truncate px-4 text-lg font-semibold text-foreground">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                <Button onClick={handleUpload} className="h-12 w-full text-base">
                  <UploadCloud size={20} className="mr-2" />
                  Tải lên & bắt đầu phân tích
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card animate-in p-8 text-center fade-in zoom-in duration-300">
            <div className="relative mb-6">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border transition-colors ${
                  status === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : status === "error"
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-primary/30 bg-primary/10"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle2 size={40} className="text-emerald-500" />
                ) : status === "error" ? (
                  <AlertCircle size={40} className="text-red-500" />
                ) : (
                  <Loader2 size={40} className="animate-spin text-primary" />
                )}
              </div>
            </div>

            <h3 className="mb-2 text-xl font-semibold">
              {status === "uploading"
                ? "Đang tải lên..."
                : status === "processing"
                  ? "Đang phân tích tài liệu..."
                  : status === "success"
                    ? "Hoàn tất!"
                    : "Xử lý thất bại"}
            </h3>
            <p className="mb-8 text-sm text-muted-foreground">{activeDocTitle}</p>

            {(status === "uploading" || status === "processing") && (
              <div className="mb-8 space-y-2">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Tiến độ tổng quát</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2 bg-white/10 [&>div]:bg-primary-gradient" />
              </div>
            )}

            {status === "error" && (
              <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left text-sm text-red-500">
                <AlertCircle size={20} className="shrink-0" />
                <span>{sseData?.message || sseError || "Tài liệu không đủ điều kiện xử lý. Vui lòng kiểm tra lại nội dung file."}</span>
              </div>
            )}

            <div className="space-y-4 rounded-xl border border-border/50 bg-muted/30 p-5 text-left text-sm">
              <PipelineStep label="Giai đoạn 1: Tiếp nhận và lưu file gốc" done={status === "processing" || status === "success"} loading={status === "uploading"} />
              <PipelineStep
                label="Giai đoạn 2: Phân tích và kiểm duyệt nội dung"
                done={(sseData?.progress || 0) >= 50 || status === "success"}
                loading={status === "processing" && (sseData?.progress || 0) < 50}
              />
              <PipelineStep
                label="Giai đoạn 3: Tạo embedding và hoàn tất"
                done={status === "success"}
                loading={(sseData?.progress || 0) >= 50 && status !== "success" && status !== "error"}
              />
            </div>

            {status === "success" && activeDocId && (
              <Button onClick={handleShare} disabled={isSharing} className="mt-8 h-11 w-full">
                {isSharing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Globe size={16} className="mr-2" />}
                Chia sẻ vào Thư viện chung
              </Button>
            )}

            {(status === "success" || status === "error") && (
              <Button onClick={() => router.push("/library")} variant="outline" className="mt-3 w-full">
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
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <UploadPageContent />
    </Suspense>
  );
}

function PipelineStep({ label, done, loading }: { label: string; done: boolean; loading: boolean }) {
  return (
    <div className={`flex items-center gap-3 transition-colors ${done ? "text-emerald-600 dark:text-emerald-400" : loading ? "text-foreground" : "text-muted-foreground/40"}`}>
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {done ? <CheckCircle2 size={16} /> : loading ? <Loader2 size={16} className="animate-spin text-primary" /> : <div className="h-1.5 w-1.5 rounded-full bg-border" />}
      </div>
      <span>{label}</span>
    </div>
  );
}
