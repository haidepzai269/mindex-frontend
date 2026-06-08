"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  FileText,
  Globe,
  ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/user/NotificationBell";
import { fetchApi } from "@/lib/api";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  DOCUMENT_UPLOAD_MAX_BYTES,
  uploadDocument,
  validateDocumentFile,
} from "@/lib/upload";
import { useProcessingSSE } from "@/hooks/useProcessingSSE";
import {
  UploadAnalyzer,
  DocState,
  ImgState,
} from "@/components/user/UploadAnalyzer";

// ── Constants ─────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const EMPTY_IMAGES = Array.from(
  { length: 5 },
  () => null
) as Array<ImageSlot | null>;

type ImageSlot = { file: File; preview: string };
type UploadPhase = "idle" | "uploading" | "processing" | "success" | "error";

// ── Image slots (idle state) ──────────────────────────────────
function ImageSlots({
  images,
  onAdd,
  onRemove,
}: {
  images: Array<ImageSlot | null>;
  onAdd: (files: File[]) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filledCount = images.filter(Boolean).length;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onAdd(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onAdd(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      className="grid grid-cols-5 gap-2"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleInput}
      />
      {images.map((img, i) => (
        <div key={i} className="relative aspect-square">
          {img ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <img
                src={img.preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 transition-colors hover:bg-black/80"
              >
                <X size={11} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => filledCount < 5 && inputRef.current?.click()}
              disabled={filledCount >= 5}
              className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ImageIcon size={18} />
              <span className="text-[10px] font-medium">Thêm</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId");

  const [docFile, setDocFile] = useState<File | null>(null);
  const [images, setImages] = useState<Array<ImageSlot | null>>(EMPTY_IMAGES);
  const [phase, setPhase] = useState<UploadPhase>(
    initialDocId ? "processing" : "idle"
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDocId);
  const [imgDoneSet, setImgDoneSet] = useState<Set<number>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  const { data: sseData, error: sseError } = useProcessingSSE(activeDocId);

  // SSE status transitions
  useEffect(() => {
    if (!sseData) return;
    if (sseData.status === "ready") {
      setPhase("success");
      staggerImgsDone();
    } else if (sseData.status === "error") {
      setPhase("error");
      setErrorMsg(
        sseData.message ||
          "Tài liệu không đủ điều kiện xử lý. Vui lòng kiểm tra lại nội dung file."
      );
    }
  }, [sseData]);

  // SSE connection error
  useEffect(() => {
    if (sseError && phase === "processing") {
      setPhase("error");
      setErrorMsg(sseError);
    }
  }, [sseError]);

  function staggerImgsDone() {
    images.forEach((img, i) => {
      if (!img) return;
      setTimeout(() => {
        setImgDoneSet((prev) => new Set([...prev, i]));
      }, i * 200);
    });
  }

  // Image management
  const addImages = useCallback((files: File[]) => {
    const valid: File[] = [];
    for (const f of files) {
      const ext = ("." + f.name.split(".").pop()!).toLowerCase();
      if (!IMAGE_EXTS.includes(ext)) {
        toast.error(`${f.name}: chỉ hỗ trợ JPG, PNG, WEBP`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name}: vượt quá 5MB`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) return;

    setImages((prev) => {
      const next = [...prev];
      let slot = 0;
      for (const f of valid) {
        while (slot < 5 && next[slot] !== null) slot++;
        if (slot >= 5) {
          toast.error("Tối đa 5 ảnh mỗi lần upload.");
          break;
        }
        next[slot] = { file: f, preview: URL.createObjectURL(f) };
        slot++;
      }
      return next;
    });
  }, []);

  const removeImage = useCallback((idx: number) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx]!.preview);
      next[idx] = null;
      return next;
    });
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  // Document dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    const err = validateDocumentFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    setDocFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => toast.error("Chỉ hỗ trợ PDF/DOCX tối đa 50MB."),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    maxSize: DOCUMENT_UPLOAD_MAX_BYTES,
  });

  // Upload
  const handleUpload = async () => {
    if (!docFile) return;
    setPhase("uploading");
    setUploadProgress(0);
    setImgDoneSet(new Set());
    setErrorMsg(undefined);

    const imageFiles = images.filter(Boolean).map((i) => i!.file);

    try {
      const response = await uploadDocument({
        file: docFile,
        images: imageFiles,
        onProgress: setUploadProgress,
      });

      const result = response.data;
      setActiveDocId(result.document_id);
      setUploadProgress(100);

      if (result.is_duplicate && result.status === "ready") {
        setPhase("success");
        staggerImgsDone();
        toast.success(result.message || "Tài liệu đã có trong thư viện.");
        return;
      }

      setPhase("processing");
      toast.success(
        result.message || "Tải lên thành công, đang phân tích tài liệu."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra trong quá trình upload.";
      toast.error(message);
      setPhase("idle");
    }
  };

  // Share
  const handleShare = async () => {
    if (!activeDocId || phase !== "success") return;
    setIsSharing(true);
    try {
      await fetchApi(`/community/documents/${activeDocId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_public: true }),
      });
      toast.success("Đã chia sẻ vào Thư viện chung.");
      router.push("/library");
    } catch (error: any) {
      toast.error(
        error?.data?.message || error?.message || "Không thể chia sẻ tài liệu."
      );
    } finally {
      setIsSharing(false);
    }
  };

  // ── Derived values for UploadAnalyzer ──
  const docState: DocState =
    phase === "uploading"
      ? "uploading"
      : phase === "processing"
      ? "scanning"
      : phase === "success"
      ? "done"
      : phase === "error"
      ? "error"
      : "uploading";

  const imgStates: ImgState[] = images.map((img, i) => {
    if (!img) return "queue";
    if (phase === "error") return "error";
    if (phase === "success") return imgDoneSet.has(i) ? "done" : "scanning";
    if (phase === "processing") return "scanning";
    if (phase === "uploading") return "uploading";
    return "queue";
  });

  const imgSrcs = images.map((img) => img?.preview);

  const summaryPercent =
    phase === "uploading"
      ? Math.min(30, Math.floor(uploadProgress * 0.3))
      : phase === "processing"
      ? 30 + Math.floor((sseData?.progress ?? 0) * 0.7)
      : phase === "success"
      ? 100
      : 0;

  const summaryText =
    phase === "uploading"
      ? "Đang tải lên..."
      : phase === "processing"
      ? sseData?.message || "Đang phân tích tài liệu..."
      : phase === "success"
      ? "Hoàn tất!"
      : "Xử lý thất bại";

  const docName = docFile?.name ?? "Tài liệu";
  const docSize = docFile
    ? `${(docFile.size / (1024 * 1024)).toFixed(2)} MB`
    : "";

  // ── Render ──
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto px-4 pb-28 pt-6 md:px-8 md:pb-8 md:pt-16">
      <div className="absolute right-8 top-6 z-50 hidden md:block">
        <NotificationBell />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[20%] -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[150px]" />

      <div className="mx-auto w-full max-w-3xl">
        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Tải lên tài liệu mới
              </h1>
              <p className="text-sm text-muted-foreground">
                Kéo thả hoặc chọn file. Ảnh đính kèm sẽ được OCR để bổ sung nội
                dung.
              </p>
            </div>

            <div className="space-y-6">
              {/* Document section */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Tài liệu
                </p>
                {!docFile ? (
                  <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-accent/30"
                    }`}
                  >
                    <input
                      {...getInputProps()}
                      accept={DOCUMENT_UPLOAD_ACCEPT}
                    />
                    <UploadCloud
                      size={28}
                      className="mx-auto mb-3 text-muted-foreground"
                    />
                    <p className="mb-1 font-medium text-foreground">
                      Kéo thả PDF hoặc DOCX vào đây
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      hoặc click để chọn file
                    </p>
                    <Button variant="outline" size="sm">
                      Chọn tài liệu
                    </Button>
                    <p className="mt-4 text-xs text-muted-foreground/50">
                      PDF · DOCX · Tối đa 50MB
                    </p>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-4">
                    <button
                      type="button"
                      onClick={() => setDocFile(null)}
                      className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        docFile.name.endsWith(".pdf")
                          ? "bg-red-500/10 text-red-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="truncate text-sm font-medium text-foreground">
                        {docFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(docFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Images section */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Ảnh đính kèm{" "}
                    <span className="normal-case font-normal text-muted-foreground/40">
                      (tùy chọn)
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/40">
                    {images.filter(Boolean).length}/5
                  </p>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  OCR tự động trích xuất văn bản từ ảnh để bổ sung nội dung ·
                  JPG / PNG / WEBP · Tối đa 5MB/ảnh
                </p>
                <ImageSlots
                  images={images}
                  onAdd={addImages}
                  onRemove={removeImage}
                />
              </div>

              {docFile && (
                <Button
                  onClick={handleUpload}
                  className="h-12 w-full text-base"
                >
                  <UploadCloud size={20} className="mr-2" />
                  Tải lên & phân tích
                  {images.filter(Boolean).length > 0 && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      +{images.filter(Boolean).length} ảnh
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVE (uploading / processing / success / error) ── */}
        {phase !== "idle" && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <UploadAnalyzer
              docName={docName}
              docSize={docSize}
              docState={docState}
              uploadProgress={uploadProgress}
              sseProgress={sseData?.progress ?? 0}
              sseMessage={sseData?.message}
              errorMessage={errorMsg}
              imgStates={imgStates}
              imgSrcs={imgSrcs}
              summaryText={summaryText}
              summaryPercent={summaryPercent}
              summaryDone={phase === "success"}
            />

            {/* Success actions */}
            {phase === "success" && activeDocId && (
              <div className="mt-4 space-y-3">
                <Button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="h-11 w-full"
                >
                  {isSharing ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Globe size={16} className="mr-2" />
                  )}
                  Chia sẻ vào Thư viện chung
                </Button>
                <Button
                  onClick={() => router.push("/library")}
                  variant="outline"
                  className="w-full"
                >
                  Quay lại Thư viện
                </Button>
              </div>
            )}

            {/* Error state */}
            {phase === "error" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>
                    {errorMsg ||
                      "Tài liệu không đủ điều kiện xử lý. Vui lòng kiểm tra lại nội dung file."}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setPhase("idle");
                    setErrorMsg(undefined);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={() => router.push("/library")}
                  variant="ghost"
                  className="w-full"
                >
                  Quay lại Thư viện
                </Button>
              </div>
            )}

            {/* Processing: no actions yet */}
            {phase === "processing" && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Bạn có thể rời trang, tài liệu sẽ tiếp tục được xử lý.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}
