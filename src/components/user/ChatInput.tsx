"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
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

interface ChatInputProps {
  onSendMessage: (message: string, model: string, thinking: boolean, attachments?: ChatAttachment[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  allowImageAttachments?: boolean;
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

export function ChatInput({
  onSendMessage,
  disabled,
  isLoading,
  placeholder,
  allowImageAttachments = false,
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
  const user = useAuthStore((state) => state.user);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const shouldAnimatePlaceholder = !placeholder;
  const canUseImageAttachments = allowImageAttachments && !!targetId;
  const hasBlockingAttachment = imageAttachments.some((item) => item.status !== "done");
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
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

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
      updateLocalImage(item.localId, { status: "error", error: "Thieu chat target." });
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
        error: error instanceof Error ? error.message : "Khong the upload anh.",
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
      setImageError(`Chi duoc dinh kem toi da ${CHAT_IMAGE_MAX_FILES} anh.`);
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
      nextError = `Chi nhan ${remainingSlots} anh con lai.`;
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
      onSendMessage(input.trim(), model, thinkingAvailable && thinking, readyAttachments);
      setInput("");
      setThinking(false);
      setVoiceBaseInput("");
      setImageError("");
      imageAttachments.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
      });
      setImageAttachments([]);
      stopListening();
    }
  }, [disabled, hasBlockingAttachment, imageAttachments, input, isLoading, model, onSendMessage, stopListening, thinking, thinkingAvailable]);

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
                      title="Bo anh"
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
                        title="Thu lai OCR"
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
                        placeholder="OCR khong co text. Ban co the nhap bo sung..."
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
                 title="Dinh kem anh OCR"
                 aria-label="Dinh kem anh OCR"
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
    </div>
  );
}
