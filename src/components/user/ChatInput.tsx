"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Film,
  ImagePlus,
  Loader2,
  RotateCcw,
  Send,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { VoiceInputButton } from "@/components/user/VoiceInputButton";
import { useAuthStore } from "@/store/useAuthStore";
import type { ChatAttachment } from "@/store/useChatStore";
import {
  CHAT_IMAGE_ACCEPT,
  CHAT_IMAGE_MAX_FILES,
  uploadChatImage,
  validateChatImage,
} from "@/lib/chat-attachments";
import {
  CHAT_VIDEO_ACCEPT,
  CHAT_VIDEO_MAX_FILES,
  ensureSessionForVideoUpload,
  fetchVideoQuota,
  uploadChatVideo,
  validateChatVideo,
  pollVideoStatus,
  type VideoQuotaResult,
} from "@/lib/chat-video";

interface ChatInputProps {
  onSendMessage: (message: string, model: string, thinking: boolean, attachments?: ChatAttachment[], videoAttachmentIds?: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  allowImageAttachments?: boolean;
  allowVideoAttachments?: boolean;
  targetId?: string;
  sessionId?: string | null;
  isCollection?: boolean;
  onSessionReady?: (sessionId: string) => void;
}

type LocalImageAttachment = {
  localId: string;
  file: File;
  previewUrl: string;
  status: "waiting" | "uploading" | "analyzing" | "done" | "error";
  progress: number;
  attachment?: ChatAttachment;
  error?: string;
};

type LocalVideoAttachment = {
  localId: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "processing" | "done" | "error";
  progress: number;
  attachmentId?: string;
  durationSeconds?: number;
  hasAudio?: boolean;
  frameCount?: number;
  storageUrl?: string;
  error?: string;
};

export function ChatInput({
  onSendMessage,
  disabled,
  isLoading,
  placeholder,
  allowImageAttachments = false,
  allowVideoAttachments = false,
  targetId,
  sessionId,
  isCollection = false,
  onSessionReady,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState("Mindex-1");
  const [thinking, setThinking] = useState(false);
  const [voiceBaseInput, setVoiceBaseInput] = useState("");
  const [showMainPlaceholder, setShowMainPlaceholder] = useState(true);
  const [imageAttachments, setImageAttachments] = useState<LocalImageAttachment[]>([]);
  const [imageError, setImageError] = useState("");
  const [videoAttachments, setVideoAttachments] = useState<LocalVideoAttachment[]>([]);
  const [videoError, setVideoError] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [videoQuota, setVideoQuota] = useState<VideoQuotaResult | null>(null);
  const user = useAuthStore((state) => state.user);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPollAbortRefs = useRef<Map<string, AbortController>>(new Map());
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const shouldAnimatePlaceholder = !placeholder;
  const canUseImageAttachments = allowImageAttachments && !!targetId;
  const canUseVideoAttachments = allowVideoAttachments;
  const hasBlockingAttachment = imageAttachments.some((item) => item.status !== "done") || videoAttachments.some((item) => item.status !== "done");
  const thinkingAvailable =
    user?.role === "admin" ||
    user?.tier === "PRO" ||
    user?.tier === "ULTRA";

  useEffect(() => {
    if (!shouldAnimatePlaceholder) return;

    const intervalId = window.setInterval(() => {
      setShowMainPlaceholder((prev) => !prev);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [shouldAnimatePlaceholder]);

  useEffect(() => {
    if (!allowVideoAttachments) return;
    fetchVideoQuota().then(setVideoQuota).catch(() => {});
  }, [allowVideoAttachments]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
      videoPollAbortRefs.current.forEach((ac) => ac.abort());
      videoPollAbortRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!previewVideoUrl) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewVideoUrl(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [previewVideoUrl]);

  const updateInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  const updateLocalImage = useCallback((localId: string, patch: Partial<LocalImageAttachment>) => {
    setImageAttachments((current) =>
      current.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  }, []);

  const uploadLocalImage = useCallback(async (item: LocalImageAttachment, uploadSessionId?: string | null) => {
    if (!targetId) {
      updateLocalImage(item.localId, { status: "error", error: "Thiếu chat target." });
      return uploadSessionId ?? null;
    }

    updateLocalImage(item.localId, { status: "uploading", progress: 6, error: undefined });
    try {
      const uploaded = await uploadChatImage({
        file: item.file,
        targetId,
        sessionId: uploadSessionId,
        isCollection,
        onProgress: (progress) => {
          updateLocalImage(item.localId, {
            progress,
            status: progress >= 100 ? "analyzing" : "uploading",
          });
        },
      });

      const attachment: ChatAttachment = {
        ...uploaded,
        id: uploaded.id || uploaded.attachment_id,
        status: uploaded.status === "error" ? "error" : "done",
      };
      updateLocalImage(item.localId, {
        status: attachment.status === "error" ? "error" : "done",
        progress: 100,
        attachment,
        error: attachment.error_message,
      });
      if (uploaded.session_id) {
        onSessionReady?.(uploaded.session_id);
      }
      return uploaded.session_id || uploadSessionId || null;
    } catch (error) {
      updateLocalImage(item.localId, {
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Không thể upload ảnh.",
      });
      return uploadSessionId ?? null;
    }
  }, [isCollection, onSessionReady, targetId, updateLocalImage]);

  const {
    error: voiceError,
    isListening,
    isSupported,
    stopListening,
    toggleListening,
  } = useSpeechToText({
    onTranscriptChange: (transcript) => {
      updateInput(
        transcript
          ? [voiceBaseInput.trimEnd(), transcript].filter(Boolean).join(" ")
          : voiceBaseInput
      );
    },
  });

  const handlePickImages = useCallback(() => {
    if (!canUseImageAttachments || disabled || isLoading) return;
    fileInputRef.current?.click();
  }, [canUseImageAttachments, disabled, isLoading]);

  const handleImageFiles = useCallback((files: FileList | null) => {
    if (!files || !canUseImageAttachments) return;

    const remainingSlots = CHAT_IMAGE_MAX_FILES - imageAttachments.length;
    if (remainingSlots <= 0) {
      setImageError(`Chỉ được đính kèm tối đa ${CHAT_IMAGE_MAX_FILES} ảnh.`);
      return;
    }

    const selected = Array.from(files).slice(0, remainingSlots);
    const nextItems: LocalImageAttachment[] = [];
    let nextError = "";
    for (const file of selected) {
      const validation = validateChatImage(file);
      if (validation) {
        nextError = validation;
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      nextItems.push({
        localId: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl,
        status: "waiting",
        progress: 0,
      });
    }

    if (selected.length < Array.from(files).length) {
      nextError = `Chỉ nhận ${remainingSlots} ảnh còn lại.`;
    }
    setImageError(nextError);
    if (nextItems.length === 0) return;

    setImageAttachments((current) => [...current, ...nextItems]);
    void (async () => {
      let nextSessionId = sessionId;
      for (const item of nextItems) {
        nextSessionId = await uploadLocalImage(item, nextSessionId);
      }
    })();
  }, [canUseImageAttachments, imageAttachments.length, sessionId, uploadLocalImage]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageFiles(event.target.files);
    event.target.value = "";
  }, [handleImageFiles]);

  const handleRemoveImage = useCallback((localId: string) => {
    setImageAttachments((current) => {
      const item = current.find((candidate) => candidate.localId === localId);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
      }
      return current.filter((candidate) => candidate.localId !== localId);
    });
  }, []);

  const handleRetryImage = useCallback((localId: string) => {
    const item = imageAttachments.find((candidate) => candidate.localId === localId);
    if (!item) return;
    void uploadLocalImage(item, sessionId);
  }, [imageAttachments, sessionId, uploadLocalImage]);

  const handlePickVideo = useCallback(() => {
    if (!canUseVideoAttachments || disabled || isLoading || videoAttachments.length >= CHAT_VIDEO_MAX_FILES) return;
    videoInputRef.current?.click();
  }, [canUseVideoAttachments, disabled, isLoading, videoAttachments.length]);

  const updateVideoAttachment = useCallback((localId: string, patch: Partial<LocalVideoAttachment>) => {
    setVideoAttachments((current) =>
      current.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  }, []);

  const uploadSingleVideo = useCallback(async (item: LocalVideoAttachment, uploadSessionId?: string | null): Promise<string | null> => {
    let currentSessionId = uploadSessionId;
    if (!currentSessionId) {
      try {
        currentSessionId = await ensureSessionForVideoUpload();
        onSessionReady?.(currentSessionId);
      } catch {
        updateVideoAttachment(item.localId, { status: "error", error: "Không thể tạo phiên chat. Vui lòng thử lại." });
        return currentSessionId ?? null;
      }
    }

    try {
      const result = await uploadChatVideo({
        file: item.file,
        sessionId: currentSessionId,
        onProgress: (progress) => {
          updateVideoAttachment(item.localId, { progress });
        },
      });

      if (result.cached && result.status === "done") {
        updateVideoAttachment(item.localId, {
          status: "done",
          progress: 100,
          attachmentId: result.attachment_id,
          durationSeconds: result.duration_seconds,
          hasAudio: result.has_audio,
          frameCount: result.frame_count,
          storageUrl: result.storage_url,
        });
        fetchVideoQuota().then(setVideoQuota).catch(() => {});
      } else {
        updateVideoAttachment(item.localId, {
          status: "processing",
          progress: 100,
          attachmentId: result.attachment_id,
          durationSeconds: result.duration_seconds,
          storageUrl: result.storage_url,
        });

        const abortController = new AbortController();
        videoPollAbortRefs.current.set(item.localId, abortController);

        const statusResult = await pollVideoStatus(
          result.attachment_id,
          (status) => {
            updateVideoAttachment(item.localId, {
              status: status.status === "done" ? "done" : status.status === "error" ? "error" : "processing",
            });
          },
          abortController.signal,
        );

        videoPollAbortRefs.current.delete(item.localId);

        if (statusResult.status === "done") {
          updateVideoAttachment(item.localId, {
            status: "done",
            hasAudio: statusResult.has_audio,
            frameCount: statusResult.frame_count,
          });
          fetchVideoQuota().then(setVideoQuota).catch(() => {});
        } else {
          updateVideoAttachment(item.localId, {
            status: "error",
            error: statusResult.error_message || "Xử lý video thất bại.",
          });
        }
      }
    } catch (error) {
      updateVideoAttachment(item.localId, {
        status: "error",
        error: error instanceof Error ? error.message : "Upload video thất bại.",
      });
    }
    return currentSessionId;
  }, [onSessionReady, updateVideoAttachment]);

  const handleVideoFile = useCallback((files: FileList | null) => {
    if (!files || files.length === 0 || !canUseVideoAttachments) return;

    const remainingSlots = CHAT_VIDEO_MAX_FILES - videoAttachments.length;
    if (remainingSlots <= 0) {
      setVideoError(`Chỉ được đính kèm tối đa ${CHAT_VIDEO_MAX_FILES} video.`);
      return;
    }

    const selected = Array.from(files).slice(0, remainingSlots);
    const nextItems: LocalVideoAttachment[] = [];
    let nextError = "";

    for (const file of selected) {
      const validation = validateChatVideo(file);
      if (validation) {
        nextError = validation;
        continue;
      }
      if (videoQuota && videoQuota.remaining - nextItems.length <= 0) {
        nextError = `Bạn đã đạt giới hạn ${videoQuota.limit} video/ngày. Nâng gói để sử dụng thêm.`;
        break;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      nextItems.push({
        localId: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl,
        status: "uploading",
        progress: 0,
      });
    }

    if (selected.length < Array.from(files).length) {
      nextError = `Chỉ nhận ${remainingSlots} video còn lại.`;
    }
    setVideoError(nextError);
    if (nextItems.length === 0) return;

    setVideoAttachments((current) => [...current, ...nextItems]);
    void (async () => {
      let nextSessionId = sessionId;
      for (const item of nextItems) {
        nextSessionId = await uploadSingleVideo(item, nextSessionId);
      }
    })();
  }, [canUseVideoAttachments, sessionId, uploadSingleVideo, videoAttachments.length, videoQuota]);

  const handleVideoInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleVideoFile(event.target.files);
    event.target.value = "";
  }, [handleVideoFile]);

  const handleRemoveVideo = useCallback((localId: string) => {
    const ac = videoPollAbortRefs.current.get(localId);
    if (ac) {
      ac.abort();
      videoPollAbortRefs.current.delete(localId);
    }
    setVideoAttachments((current) => {
      const item = current.find((v) => v.localId === localId);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
      }
      return current.filter((v) => v.localId !== localId);
    });
  }, []);

  const handleAttachmentTextChange = useCallback((localId: string, text: string) => {
    setImageAttachments((current) =>
      current.map((item) => {
        if (item.localId !== localId || !item.attachment) return item;
        return {
          ...item,
          attachment: {
            ...item.attachment,
            ocr_text: text,
            ocr_preview: text.slice(0, 1200),
          },
        };
      })
    );
  }, []);

  const handleSend = useCallback(() => {
    if (input.trim() && !disabled && !isLoading && !hasBlockingAttachment) {
      const readyAttachments = imageAttachments
        .filter((item) => item.status === "done" && item.attachment)
        .map((item) => item.attachment as ChatAttachment);
      const videoIds = videoAttachments
        .filter((item) => item.status === "done" && item.attachmentId)
        .map((item) => item.attachmentId as string);
      const videoAsAttachments: ChatAttachment[] = videoAttachments
        .filter((item) => item.status === "done" && item.attachmentId)
        .map((item) => ({
          id: item.attachmentId as string,
          url: item.storageUrl || item.previewUrl,
          filename: item.file.name,
          mime_type: item.file.type,
          size_bytes: item.file.size,
          type: "video" as const,
          status: "done" as const,
          duration_seconds: item.durationSeconds,
          has_audio: item.hasAudio,
          frame_count: item.frameCount,
        }));
      onSendMessage(input.trim(), model, thinkingAvailable && thinking, [...readyAttachments, ...videoAsAttachments], videoIds.length > 0 ? videoIds : undefined);
      setInput("");
      setThinking(false);
      setVoiceBaseInput("");
      setImageError("");
      setVideoError("");
      imageAttachments.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
      });
      setImageAttachments([]);
      videoAttachments.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
        const ac = videoPollAbortRefs.current.get(item.localId);
        if (ac) ac.abort();
      });
      videoPollAbortRefs.current.clear();
      setVideoAttachments([]);
      stopListening();
    }
  }, [disabled, hasBlockingAttachment, imageAttachments, input, isLoading, model, onSendMessage, stopListening, thinking, thinkingAvailable, videoAttachments]);

  const handleToggleVoice = useCallback(() => {
    if (!isListening) {
      setVoiceBaseInput(input);
    }

    toggleListening();
  }, [input, isListening, toggleListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="relative flex flex-col w-full bg-transparent outline-none items-center">
      <div className={cn(
        "relative flex flex-col w-full bg-card/80 border border-border rounded-[1.5rem] p-2 transition-all duration-300 shadow-md",
        "focus-within:border-primary/40 focus-within:ring-[4px] focus-within:ring-primary/5",
        disabled || isLoading ? "opacity-50 grayscale" : ""
      )}>
        {canUseImageAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            accept={CHAT_IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        )}
        {canUseVideoAttachments && (
          <input
            ref={videoInputRef}
            type="file"
            accept={CHAT_VIDEO_ACCEPT}
            multiple
            className="hidden"
            onChange={handleVideoInputChange}
          />
        )}

        {imageAttachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto px-2 pt-1 pb-2 scrollbar-hide">
            {imageAttachments.map((item, index) => {
              const isScanning = item.status === "waiting" || item.status === "uploading" || item.status === "analyzing";
              const isDone = item.status === "done";
              const isError = item.status === "error";
              const statusLabel =
                item.status === "waiting"
                  ? "WAIT"
                  : item.status === "uploading"
                    ? "OCR"
                    : item.status === "analyzing"
                      ? "SCAN"
                      : item.status === "done"
                        ? "DONE"
                        : "ERR";

              return (
                <div
                  key={item.localId}
                  className="group/image relative flex w-[150px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/25 shadow-sm"
                >
                  <div className="relative h-[92px] overflow-hidden bg-muted">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-500",
                        isDone ? "scale-100" : "scale-[1.02]",
                        isError && "grayscale"
                      )}
                    />

                    {isScanning && (
                      <>
                        <div className="absolute inset-0 bg-[rgba(245,246,247,0.82)] dark:bg-background/75" />
                        <div className="chat-ocr-shimmer absolute inset-0" />
                        <div className="chat-ocr-beam absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
                        <div className="chat-ocr-glow absolute left-0 right-0 h-8 bg-gradient-to-b from-cyan-300/30 to-transparent" />
                        <svg className="chat-ocr-corners absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] text-cyan-500" viewBox="0 0 100 100" fill="none">
                          <path d="M4 24V4H24" />
                          <path d="M76 4H96V24" />
                          <path d="M96 76V96H76" />
                          <path d="M24 96H4V76" />
                        </svg>
                      </>
                    )}

                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-white/50 bg-black/55 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                      {statusLabel}
                      {isScanning && (
                        <span className="chat-ocr-dots flex gap-0.5">
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(item.localId)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-90 transition hover:bg-black"
                      title="Bỏ ảnh"
                    >
                      <X size={12} />
                    </button>

                    {isDone && (
                      <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                    {isError && (
                      <button
                        type="button"
                        onClick={() => handleRetryImage(item.localId)}
                        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                        title="Thử lại OCR"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}

                    {isScanning && (
                      <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-black/15">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.max(12, item.progress)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-black text-foreground">
                        IMG {index + 1}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {Math.max(1, Math.round(item.file.size / 1024))}KB
                      </span>
                    </div>
                    {isDone && item.attachment && (
                      <textarea
                        value={item.attachment.ocr_text || item.attachment.ocr_preview || ""}
                        onChange={(event) => handleAttachmentTextChange(item.localId, event.target.value)}
                        placeholder="OCR không có text. Bạn có thể nhập bổ sung..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-[10.5px] leading-4 text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      />
                    )}
                    {isError && (
                      <div className="flex items-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-[10px] leading-4 text-red-600 dark:text-red-300">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{item.error || "OCR failed"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {videoAttachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto px-2 pt-1 pb-2 scrollbar-hide">
            {videoAttachments.map((vid) => {
              const isActive = vid.status === "uploading" || vid.status === "processing";
              const isDone = vid.status === "done";
              const isError = vid.status === "error";

              return (
                <div
                  key={vid.localId}
                  className="group/vcard relative flex w-[150px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/25 shadow-sm"
                >
                  <div className="group/vthumb relative h-[92px] overflow-hidden bg-zinc-900">
                    <video
                      src={vid.previewUrl}
                      onLoadedData={(e) => {
                        const v = e.currentTarget;
                        v.currentTime = Math.min(0.5, v.duration * 0.1);
                      }}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-all duration-500",
                        vid.status === "uploading" && "scale-110 blur-[4px] brightness-[0.35]",
                        vid.status === "processing" && "brightness-[0.45] saturate-[0.7]",
                        isDone && "brightness-75",
                        isError && "brightness-[0.3] grayscale"
                      )}
                      muted
                      playsInline
                      preload="auto"
                    />

                    {isActive && <div className="absolute inset-0 bg-black/40" />}

                    {vid.status === "uploading" && (
                      <>
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="chat-video-shimmer absolute left-0 top-0 h-full w-[45%]" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-[26px] w-[26px] animate-spin rounded-full border-2 border-white/15 border-t-indigo-400" />
                        </div>
                      </>
                    )}

                    {vid.status === "processing" && (
                      <>
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="chat-video-shimmer-indigo absolute left-0 top-0 h-full w-[45%]" />
                        </div>
                        <div className="chat-video-scan-line absolute left-0 h-[2px] w-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="chat-video-pulse" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.4))" }}>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 3" />
                          </svg>
                        </div>
                      </>
                    )}

                    {isDone && (
                      <>
                        <div className="chat-video-check-pop absolute right-[5px] top-[5px] z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-500">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5.5L4 7.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        {vid.durationSeconds != null && (
                          <div className="absolute bottom-[5px] right-[5px] z-10 rounded bg-black/70 px-[5px] py-[1px] text-[10px] font-medium text-zinc-300">
                            {Math.floor(vid.durationSeconds / 60)}:{String(Math.round(vid.durationSeconds % 60)).padStart(2, "0")}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-[3px] bg-gradient-to-t from-black/55 to-transparent px-[7px] pb-1 pt-[18px]">
                          {vid.frameCount != null && (
                            <>
                              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                <path d="M1 7.5V6L1.5 4.5L3 3.5L4.5 5L6 2.5L8 6V7.5H1Z" fill="#6366f1" opacity="0.5" />
                              </svg>
                              <span className="text-[9px] text-zinc-400">{vid.frameCount}f</span>
                            </>
                          )}
                          {vid.hasAudio && (
                            <>
                              <span className="inline-block h-[3px] w-[3px] rounded-full bg-zinc-600" />
                              <span className="text-[9px] text-zinc-400">audio</span>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewVideoUrl(vid.previewUrl)}
                          className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center opacity-0 transition-opacity duration-200 group-hover/vthumb:opacity-100"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform duration-150 active:scale-90">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="#fff">
                              <path d="M3 1.5L10 6L3 10.5V1.5Z" />
                            </svg>
                          </div>
                        </button>
                      </>
                    )}

                    {isError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <AlertTriangle size={20} className="text-red-400" />
                      </div>
                    )}

                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full border border-white/50 bg-black/55 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                      {vid.status === "uploading" && "UPLOAD"}
                      {vid.status === "processing" && "SCAN"}
                      {isDone && "DONE"}
                      {isError && "ERR"}
                      {isActive && (
                        <span className="chat-ocr-dots flex gap-0.5">
                          <span /><span /><span />
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(vid.localId)}
                      className="absolute right-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black group-hover/vcard:opacity-90"
                      title="Bỏ video"
                    >
                      <X size={12} />
                    </button>

                    {isActive && (
                      <div className="absolute inset-x-2 bottom-2 z-10 h-1 overflow-hidden rounded-full bg-black/15">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            vid.status === "processing" ? "w-full bg-indigo-400 chat-video-progress-pulse" : "bg-indigo-500"
                          )}
                          style={vid.status === "uploading" ? { width: `${Math.max(12, vid.progress)}%` } : undefined}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-black text-foreground">
                        {vid.file.name}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {Math.max(1, Math.round(vid.file.size / 1024 / 1024))}MB
                      </span>
                    </div>
                    {isDone && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground">
                        {vid.durationSeconds != null && (
                          <span>{Math.floor(vid.durationSeconds / 60)}:{String(Math.round(vid.durationSeconds % 60)).padStart(2, "0")}</span>
                        )}
                        {vid.frameCount != null && <span>{vid.frameCount} frames</span>}
                        {vid.hasAudio != null && <span>{vid.hasAudio ? "Có âm thanh" : "Không âm thanh"}</span>}
                      </div>
                    )}
                    {isError && (
                      <div className="flex items-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-[10px] leading-4 text-red-600 dark:text-red-300">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{vid.error || "Xử lý thất bại"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => updateInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={shouldAnimatePlaceholder ? "" : placeholder}
            disabled={disabled || isLoading}
            className="w-full max-h-32 py-2 px-4 bg-transparent border-none focus:ring-0 text-[14px] font-medium resize-none overflow-y-auto scrollbar-hide text-foreground placeholder:text-muted-foreground leading-normal outline-none"
          />
          {shouldAnimatePlaceholder && !input && (
            <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 overflow-hidden h-5 text-[14px] font-medium text-muted-foreground">
              <div
                className={cn(
                  "flex flex-col transition-transform duration-500 ease-out",
                  showMainPlaceholder ? "-translate-y-5" : "translate-y-0"
                )}
              >
                <span className="h-5 leading-5 whitespace-nowrap">Shift + Enter để xuống dòng</span>
                <span className="h-5 leading-5 whitespace-nowrap">Hỏi bất cứ điều gì về tài liệu này...</span>
              </div>
            </div>
          )}
        </div>

        {voiceError && (
          <p className="px-4 pb-1 text-[11px] font-medium text-red-500">
            {voiceError}
          </p>
        )}
        {imageError && (
          <p className="px-4 pb-1 text-[11px] font-medium text-amber-600 dark:text-amber-300">
            {imageError}
          </p>
        )}
        {videoError && (
          <p className="px-4 pb-1 text-[11px] font-medium text-amber-600 dark:text-amber-300">
            {videoError}
          </p>
        )}
        {canUseVideoAttachments && videoQuota && videoQuota.remaining <= 0 && videoAttachments.length === 0 && (
          <p className="px-4 pb-1 text-[11px] font-medium text-amber-600 dark:text-amber-300">
            Bạn đã đạt giới hạn {videoQuota.limit} video/ngày. Nâng gói để sử dụng thêm.
          </p>
        )}

        <div className="flex min-w-0 items-center justify-between gap-2 px-2 pb-1 pt-1 border-t border-border/20 mt-1">
          <div className="flex min-w-0 items-center gap-1.5">
             <VoiceInputButton
               disabled={disabled || isLoading}
               isListening={isListening}
               isSupported={isSupported}
               onClick={handleToggleVoice}
             />
             {canUseImageAttachments && (
               <button
                 type="button"
                 onClick={handlePickImages}
                 disabled={disabled || isLoading || imageAttachments.length >= CHAT_IMAGE_MAX_FILES}
                 title="Đính kèm ảnh OCR"
                 aria-label="Đính kèm ảnh OCR"
                 className={cn(
                   "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                   imageAttachments.length > 0
                     ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300"
                     : "border-border/50 bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                   disabled || isLoading || imageAttachments.length >= CHAT_IMAGE_MAX_FILES
                     ? "cursor-not-allowed opacity-50"
                     : "active:scale-95"
                 )}
               >
                 <ImagePlus size={15} />
               </button>
             )}
             {canUseVideoAttachments && !(videoQuota && videoQuota.remaining <= 0) && (
               <button
                 type="button"
                 onClick={handlePickVideo}
                 disabled={disabled || isLoading || videoAttachments.length >= CHAT_VIDEO_MAX_FILES}
                 title="Đính kèm video"
                 aria-label="Đính kèm video"
                 className={cn(
                   "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                   videoAttachments.length > 0
                     ? "border-blue-400/50 bg-blue-400/10 text-blue-600 dark:text-blue-300"
                     : "border-border/50 bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                   disabled || isLoading || videoAttachments.length >= CHAT_VIDEO_MAX_FILES
                     ? "cursor-not-allowed opacity-50"
                     : "active:scale-95"
                 )}
               >
                 <Film size={15} />
               </button>
             )}
             {thinkingAvailable && (
               <button
                 type="button"
                 onClick={() => setThinking((value) => !value)}
                 disabled={disabled || isLoading}
                 title="Thinking"
                 aria-label="Thinking"
                 aria-pressed={thinking}
                 className={cn(
                   "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                   thinking
                     ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                     : "border-border/50 bg-muted/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                   disabled || isLoading ? "cursor-not-allowed opacity-50" : "active:scale-95"
                 )}
               >
                 <BrainCircuit size={15} />
               </button>
             )}
              <div className="flex min-w-0 items-center bg-muted/40 rounded-lg p-0.5 border border-border/50">
                 <button
                   onClick={() => setModel("Mindex-1")}
                   className={cn(
                     "min-w-0 whitespace-nowrap px-[clamp(0.4rem,1.4vw,0.75rem)] py-1 rounded-md text-[clamp(7px,1.35vw,10px)] leading-none font-black transition-all duration-200",
                     model === "Mindex-1"
                       ? "bg-foreground text-background shadow-sm"
                       : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  MINDEX-1
                </button>
                 <button
                   onClick={() => setModel("Mindex-2")}
                   className={cn(
                     "min-w-0 whitespace-nowrap px-[clamp(0.4rem,1.4vw,0.75rem)] py-1 rounded-md text-[clamp(7px,1.35vw,10px)] leading-none font-black transition-all duration-200",
                     model === "Mindex-2"
                       ? "bg-foreground text-background shadow-sm"
                       : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  MINDEX-2
                </button>
             </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading || hasBlockingAttachment}
            className={cn(
              "flex min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap px-[clamp(0.55rem,1.6vw,1rem)] py-1.5 rounded-xl transition-all duration-300 font-black text-[clamp(8px,1.35vw,11px)] leading-none uppercase tracking-tighter",
              input.trim() && !disabled && !isLoading && !hasBlockingAttachment
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin text-primary" />
            ) : (
              <>
                <span className="whitespace-nowrap">Gửi câu hỏi</span>
                <Send size={13} className={cn(input.trim() ? "text-primary fill-primary" : "")} />
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-4 opacity-40 hover:opacity-100 transition-opacity duration-700 cursor-default px-4">
        <div className="flex items-center gap-2 py-1">
            <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(184,41,255,1)]" />
            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] whitespace-nowrap">
                Logic - nhanh chóng - chuẩn xác
            </p>
            <Zap size={9} className="text-muted-foreground/50" />
        </div>
      </div>
      <style>{`
        @keyframes chatVideoShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes chatVideoScanDown {
          0% { top: -2px; opacity: 0; }
          8% { opacity: 0.8; }
          92% { opacity: 0.8; }
          100% { top: calc(100% - 2px); opacity: 0; }
        }
        @keyframes chatVideoPulseGlow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        @keyframes chatVideoCheckPop {
          0% { transform: scale(0); }
          65% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .chat-video-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06), transparent);
          animation: chatVideoShimmer 1.8s ease-in-out infinite;
        }
        .chat-video-shimmer-indigo {
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.06), rgba(99,102,241,0.14), rgba(99,102,241,0.06), transparent);
          animation: chatVideoShimmer 1.4s ease-in-out infinite;
        }
        .chat-video-scan-line {
          background: linear-gradient(90deg, transparent 0%, #6366f1 30%, #818cf8 50%, #6366f1 70%, transparent 100%);
          animation: chatVideoScanDown 2s ease-in-out infinite;
          opacity: 0.8;
        }
        .chat-video-pulse {
          animation: chatVideoPulseGlow 1.6s ease-in-out infinite;
        }
        .chat-video-check-pop {
          animation: chatVideoCheckPop 0.4s ease-out both;
        }
        .chat-video-progress-pulse {
          animation: chatVideoPulseGlow 1.6s ease-in-out infinite;
        }
        @keyframes chatOcrSweep {
          0% { transform: translateX(-115%) skewX(-12deg); }
          100% { transform: translateX(115%) skewX(-12deg); }
        }
        @keyframes chatOcrScan {
          0%, 100% { top: 0%; opacity: 0.25; }
          50% { top: 100%; opacity: 1; }
        }
        @keyframes chatOcrCornerDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes chatOcrDot {
          0%, 70%, 100% { transform: translateY(0); opacity: 0.35; }
          35% { transform: translateY(-2px); opacity: 1; }
        }
        .chat-ocr-shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%);
          animation: chatOcrSweep 1.4s linear infinite;
        }
        .chat-ocr-beam {
          animation: chatOcrScan 1.6s ease-in-out infinite;
        }
        .chat-ocr-glow {
          animation: chatOcrScan 1.6s ease-in-out infinite;
        }
        .chat-ocr-corners path {
          stroke: currentColor;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 36;
          stroke-dashoffset: 36;
          animation: chatOcrCornerDraw 0.55s ease-out forwards;
        }
        .chat-ocr-corners path:nth-child(2) { animation-delay: 0.08s; }
        .chat-ocr-corners path:nth-child(3) { animation-delay: 0.16s; }
        .chat-ocr-corners path:nth-child(4) { animation-delay: 0.24s; }
        .chat-ocr-dots span {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: currentColor;
          animation: chatOcrDot 0.9s ease-in-out infinite;
        }
        .chat-ocr-dots span:nth-child(2) { animation-delay: 0.18s; }
        .chat-ocr-dots span:nth-child(3) { animation-delay: 0.36s; }
      `}</style>

      {previewVideoUrl && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="relative flex h-[90vh] w-[94vw] items-center justify-center md:h-[88vh] md:w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              key={previewVideoUrl}
              src={previewVideoUrl}
              className="h-full w-full rounded-xl bg-black object-contain"
              controls
              autoPlay
              playsInline
              preload="auto"
            />
            <button
              type="button"
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-black/80 md:right-4 md:top-4"
            >
              <X size={20} />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
