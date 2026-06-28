"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/store/useChatStore";
import type { RichContentMessage, WeatherData, NewsResult, CryptoPrice } from "@/types/rich-content";
import { WeatherCard } from "@/components/user/rich-content/WeatherCard";
import { NewsCarousel } from "@/components/user/rich-content/NewsCarousel";
import { CryptoCard } from "@/components/user/rich-content/CryptoCard";
import {
  Zap,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ExternalLink,
  X,
  RotateCcw,
  Trash2,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { AIThinkingPanel } from "@/components/user/AIThinkingPanel";
import { usePdfStore } from "@/store/usePdfStore";
import { toast } from "sonner";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onDelete?: () => void | Promise<void>;
  onRestore?: () => void | Promise<void>;
  actionPending?: boolean;
  deleteIconOnly?: boolean;
}

function extractText(children: any): string {
  return React.Children.toArray(children)
    .map((child: any) => {
      if (typeof child === "string") return child;
      if (typeof child === "number") return child.toString();
      if (child.props?.children) return extractText(child.props.children);
      if (Array.isArray(child)) return extractText(child);
      return "";
    })
    .join("");
}

function CopyButton({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all",
        copied
          ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
          : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50",
        className,
      )}
      title={copied ? "Da sao chep" : "Sao chep"}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function RichContentBlock({ data }: { data: RichContentMessage }) {
  switch (data.type) {
    case "weather":
      return <WeatherCard data={data.data as WeatherData} className="my-3" />;
    case "news":
      return <NewsCarousel data={data.data as NewsResult} className="my-3" />;
    case "crypto":
      return <CryptoCard data={data.data as CryptoPrice} className="my-3" />;
    default:
      return null;
  }
}

const markdownComponents: any = {
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-[1.6rem] font-black tracking-tight mt-8 mb-4 pb-3 border-b border-border text-foreground"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-[1.3rem] font-black tracking-tight mt-7 mb-3 pb-2 border-b border-border/60 text-foreground"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className="text-[1.1rem] font-black mt-6 mb-2 pl-3 border-l-[3px] border-primary text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-base font-bold mt-5 mb-2 text-foreground" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: any) => (
    <h5
      className="text-sm font-bold mt-4 mb-1.5 text-foreground uppercase tracking-wider"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: any) => (
    <h6
      className="text-sm font-bold mt-3 mb-1 text-muted-foreground uppercase tracking-widest"
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-4 last:mb-0 leading-[1.8] text-[15px]" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-foreground/80" {...props}>
      {children}
    </em>
  ),
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
      {...props}
    >
      {children}
      <ExternalLink size={11} className="opacity-60 flex-shrink-0" />
    </a>
  ),
  hr: () => (
    <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="my-5 pl-4 pr-4 py-3 border-l-4 border-primary/50 bg-primary/5 rounded-r-xl text-muted-foreground italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-4 space-y-2 pl-0 list-none" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="my-4 space-y-2 pl-5 list-decimal marker:text-primary marker:font-bold"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ordered, ...props }: any) => (
    <li
      className="flex items-start gap-2.5 leading-[1.7] text-[15px]"
      {...props}
    >
      {!ordered && (
        <span className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      )}
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),
  pre: ({ node, children, ...props }: any) => {
    const content = extractText(children);
    const codeNode = node?.children?.[0];
    const langClass: string = codeNode?.properties?.className?.[0] ?? "";
    const lang = langClass.replace("language-", "").toUpperCase() || "CODE";

    return (
      <div className="relative group my-6 rounded-2xl overflow-hidden border border-border shadow-sm w-full">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/70 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
            </span>
            <span className="text-[10px] font-black text-muted-foreground/70 tracking-widest uppercase">
              {lang}
            </span>
          </div>
          <CopyButton content={content} />
        </div>
        <pre
          className="m-0 p-5 overflow-x-auto bg-muted/30 rounded-none text-[13.5px] leading-relaxed"
          {...props}
        >
          {children}
        </pre>
      </div>
    );
  },
  code: ({ inline, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="bg-primary/8 text-primary px-[0.4em] py-[0.15em] rounded-md font-mono text-[0.85em] font-semibold border border-primary/15"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="block font-mono text-[13.5px] leading-relaxed text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children, ...props }: any) => {
    const content = extractText(children);
    return (
      <div className="relative group my-6">
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full text-[14px] border-collapse" {...props}>
            {children}
          </table>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton content={content} />
        </div>
      </div>
    );
  },
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted/60 border-b border-border" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-border/50" {...props}>
      {children}
    </tbody>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="px-4 py-3 text-left text-[11px] font-black text-muted-foreground uppercase tracking-wider"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-[14px] text-foreground/80" {...props}>
      {children}
    </td>
  ),
  img: ({ src, alt, ...props }: any) => (
    <span className="block my-5">
      <img
        src={src}
        alt={alt}
        className="rounded-2xl shadow-md max-w-full border border-border/50"
        loading="lazy"
        {...props}
      />
      {alt && (
        <span className="block mt-2 text-[12px] text-center text-muted-foreground italic">
          {alt}
        </span>
      )}
    </span>
  ),
};

export function ChatMessage({
  message,
  isStreaming,
  onDelete,
  onRestore,
  actionPending = false,
  deleteIconOnly = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isDeleted = message.is_deleted === true;
  const messageContent = message.content ?? "";
  const messageAttachments = !isDeleted && isUser ? message.attachments ?? [] : [];
  const hasSources = !!(message.sources && message.sources.length > 0);
  const [showSources, setShowSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigateToChunk = usePdfStore((s) => s.navigateToChunk);
  const activeChunk = usePdfStore((s) => s.activeChunk);

  useEffect(() => {
    if (isUser || isStreaming || isDeleted || !message.log_id) return;
    let isMounted = true;

    fetchApi(`/feedbacks/rating/${message.log_id}`)
      .then((res: any) => {
        if (isMounted && res && res.data) {
          setVoted(res.data.thumbs ? "up" : "down");
        }
      })
      .catch((err) => {
        console.debug(
          "Failed to fetch rating for message:",
          message.log_id,
          err,
        );
      });

    return () => {
      isMounted = false;
    };
  }, [message.log_id, isDeleted, isStreaming, isUser]);

  useEffect(() => {
    if (isDeleted || !hasSources) {
      setShowSources(false);
      setSelectedSource(null);
    }
  }, [hasSources, isDeleted]);

  const handleCopy = async () => {
    if (!messageContent) return;

    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      toast.success("Da sao chep tin nhan vao bo nho tam");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Khong the sao chep");
    }
  };

  const handleRating = async (thumbs: boolean) => {
    if (submitting || !message.log_id) return;
    setSubmitting(true);
    const voteType = thumbs ? "up" : "down";
    const previousVote = voted;
    setVoted(voteType === voted ? null : voteType);

    try {
      await fetchApi("/feedbacks/rating", {
        method: "POST",
        body: JSON.stringify({
          log_id: message.log_id,
          thumbs,
        }),
      });
      toast.success(
        thumbs ? "Da danh gia huu ich" : "Da danh gia khong huu ich",
      );
    } catch (err) {
      console.error("[Rating] Failed:", err);
      setVoted(previousVote);
      toast.error("Khong the luu danh gia");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (actionPending || !onDelete) return;
    void onDelete();
  };

  const handleRestore = () => {
    if (actionPending || !onRestore) return;
    void onRestore();
  };

  const showInlineHoverDelete =
    deleteIconOnly && isUser && !isDeleted && !!onDelete;
  // Nút hoàn tác luôn hiện inline bên trong bubble khi hover — không dùng toolbar
  const showInlineHoverRestore = isDeleted && !!onRestore;
  const showToolbar =
    !isStreaming &&
    !showInlineHoverRestore &&
    (!isDeleted && (!isUser || (!!onDelete && !showInlineHoverDelete)));

  // Normalize LaTeX delimiters: AI thường dùng \(...\) và \[...\], remark-math chỉ nhận $...$ và $$...$$
function preprocessLatex(text: string): string {
  // \[...\] → display math $$...$$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n$$\n${inner.trim()}\n$$\n`);
  // \(...\) → inline math $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);
  return text;
}

const renderAssistantContent = (content: string) => (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none",
        "prose-headings:font-black prose-headings:tracking-tight",
        "prose-p:leading-[1.8] prose-p:mb-4",
        "prose-ul:my-3 prose-ol:my-3 prose-li:my-1",
        "prose-code:not-prose",
        "prose-pre:bg-transparent prose-pre:p-0 prose-pre:rounded-none prose-pre:my-0",
        "prose-blockquote:not-italic prose-blockquote:border-0 prose-blockquote:p-0 prose-blockquote:my-0",
        "prose-table:border-0 prose-table:my-0",
        "prose-hr:my-0",
        "prose-a:no-underline",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={markdownComponents}
      >
        {preprocessLatex(content)}
      </ReactMarkdown>
    </div>
  );

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const imageAttachments = messageAttachments.filter((a) => a.type !== "video");
  const videoAttachmentsList = messageAttachments.filter((a) => a.type === "video");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const renderAttachmentGrid = () => {
    const atts = imageAttachments;
    const count = atts.length;

    const imgCell = (idx: number, className: string, showOverlay?: boolean) => {
      const att = atts[idx];
      const extra = count - 4;
      return (
        <div
          key={att.id}
          className={cn("group/cell relative overflow-hidden cursor-pointer", className)}
          onClick={() => setLightboxIdx(idx)}
        >
          <img
            src={att.url}
            alt={att.filename}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/cell:scale-[0.96]"
            loading="lazy"
          />
          {idx === 0 && (att.ocr_text || att.ocr_preview) && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white z-10">
              OCR
            </span>
          )}
          {showOverlay && extra > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px] z-10">
              <span className="text-2xl font-black text-white">+{extra}</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/cell:bg-black/30 transition-colors duration-200 z-20">
            <ZoomIn
              size={22}
              className="text-white opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 drop-shadow-lg"
            />
          </div>
        </div>
      );
    };

    if (count === 1) {
      return (
        <div className="overflow-hidden rounded-t-[1.5rem] rounded-tr-sm">
          {imgCell(0, "h-52 w-full")}
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-t-[1.5rem] rounded-tr-sm">
          {imgCell(0, "h-44")}
          {imgCell(1, "h-44")}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="overflow-hidden rounded-t-[1.5rem] rounded-tr-sm">
          {imgCell(0, "h-36 w-full")}
          <div className="grid grid-cols-2 gap-0.5 mt-0.5">
            {imgCell(1, "h-28")}
            {imgCell(2, "h-28")}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-t-[1.5rem] rounded-tr-sm">
        {imgCell(0, "h-36")}
        {imgCell(1, "h-36")}
        {imgCell(2, "h-36")}
        {imgCell(3, "h-36", true)}
      </div>
    );
  };

  const renderVideoAttachments = () => {
    if (videoAttachmentsList.length === 0) return null;
    return (
      <div className={cn("flex gap-2 overflow-x-auto", imageAttachments.length > 0 ? "px-5 pt-2" : "rounded-t-[1.5rem] rounded-tr-sm overflow-hidden")}>
        {videoAttachmentsList.map((vid) => {
          const dur = vid.duration_seconds;
          return (
            <div
              key={vid.id}
              className="group/vid relative flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900 cursor-pointer"
              onClick={() => setPreviewVideoUrl(vid.url)}
            >
              <div className="relative h-[120px] overflow-hidden">
                <video
                  src={vid.url}
                  onLoadedData={(e) => {
                    const v = e.currentTarget;
                    v.currentTime = Math.min(0.5, v.duration * 0.1);
                  }}
                  className="h-full w-full object-cover brightness-90"
                  muted
                  playsInline
                  preload="auto"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity duration-200 bg-black/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="#fff">
                      <path d="M3 1.5L10 6L3 10.5V1.5Z" />
                    </svg>
                  </div>
                </div>
                {dur != null && (
                  <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                    {Math.floor(dur / 60)}:{String(Math.round(dur % 60)).padStart(2, "0")}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="truncate text-[10px] font-bold text-primary-foreground/80">{vid.filename}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVideoPreviewModal = () => {
    if (!previewVideoUrl) return null;
    return (
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
      </div>
    );
  };

  const renderUserContent = () => (
    <div>
      {imageAttachments.length > 0 && renderAttachmentGrid()}
      {renderVideoAttachments()}
      {messageContent && (
        <span
          className={cn(
            "whitespace-pre-wrap block",
            messageAttachments.length > 0 && "px-5 py-3",
          )}
        >
          {messageContent}
        </span>
      )}
    </div>
  );

  // Lightbox modal — dùng AnimatePresence để có exit animation
  const renderLightbox = () => {
    const att = lightboxIdx !== null ? messageAttachments[lightboxIdx] : null;
    const ocrText = att ? (att.ocr_text || att.ocr_preview) : null;

    return (
      <AnimatePresence>
        {lightboxIdx !== null && att && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setLightboxIdx(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

            {/* Close */}
            <button
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/22 transition-colors"
              onClick={() => setLightboxIdx(null)}
            >
              <X size={17} />
            </button>

            {/* Prev / Next */}
            {messageAttachments.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-20"
                  disabled={lightboxIdx === 0}
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i ?? 0) - 1); }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-20"
                  disabled={lightboxIdx === messageAttachments.length - 1}
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i ?? 0) + 1); }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Content: w-fit để OCR text luôn bằng chiều ngang ảnh */}
            <motion.div
              className="relative z-10 flex w-fit max-w-[90vw] flex-col items-stretch gap-3"
              initial={{ scale: 0.86, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={att.url}
                alt={att.filename}
                className="max-h-[65vh] rounded-2xl object-contain shadow-2xl"
                style={{ display: "block" }}
              />

              {ocrText && (
                <div className="max-h-40 w-full overflow-y-auto rounded-xl bg-black/55 px-4 py-3 border border-white/10 backdrop-blur-sm">
                  <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                    Văn bản nhận diện (OCR)
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-white/85 whitespace-pre-wrap">
                    {ocrText}
                  </p>
                </div>
              )}

              {/* Dot indicators */}
              {messageAttachments.length > 1 && (
                <div className="flex justify-center gap-1.5 pt-0.5">
                  {messageAttachments.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      className={cn(
                        "rounded-full transition-all duration-200",
                        i === lightboxIdx ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60",
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <>
    {renderLightbox()}
    {renderVideoPreviewModal()}
    <div
      className={cn(
        "group/chat-row flex w-full flex-col gap-4 py-8 animate-in fade-in duration-700",
        isUser ? "items-end pr-8 md:pr-10" : "items-start border-b border-border/50",
      )}
    >
      <div
        className={cn(
          "flex max-w-[90%] gap-6",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isUser && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border transition-all duration-500 bg-muted text-primary border-border">
              <Zap size={20} className="fill-primary" />
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-3.5 min-w-0",
            isUser ? "items-end" : "items-start pt-1",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 px-1",
              isUser && "flex-row-reverse",
            )}
          >
            <span className="text-[12px] font-black text-foreground tracking-tight uppercase">
              {isUser ? "BAN" : "MINDEX AI"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              {message.timestamp
                ? format(new Date(message.timestamp), "HH:mm")
                : ""}
            </span>
          </div>

          <div className="relative">
            {showInlineHoverDelete && (
              <button
                onClick={handleDelete}
                disabled={actionPending}
                className="absolute right-full top-1/2 mr-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground/60 opacity-0 pointer-events-none transition-all duration-200 hover:text-foreground group-hover/chat-row:opacity-100 group-hover/chat-row:pointer-events-auto disabled:opacity-40"
                title="Xoa khoi lich su chat"
              >
                {actionPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            )}

            <div
              className={cn(
                "transition-all duration-500",
                isUser
                  ? isDeleted
                    ? "bg-muted/40 text-muted-foreground px-6 py-4 rounded-[2rem] rounded-tr-sm border border-dashed border-border/70 text-[15px] leading-[1.65]"
                    : messageAttachments.length > 0
                    ? "bg-primary text-primary-foreground rounded-[1.5rem] rounded-tr-sm border border-primary/20 shadow-sm text-[15px] leading-[1.65] overflow-hidden"
                    : "bg-primary text-primary-foreground px-6 py-4 rounded-[2rem] rounded-tr-sm border border-primary/20 shadow-sm text-[15px] leading-[1.65]"
                  : isDeleted
                    ? "w-full max-w-2xl rounded-2xl border border-dashed border-border/70 bg-muted/20 px-5 py-4 text-muted-foreground"
                    : "text-foreground w-full",
              )}
            >
              {isStreaming ? (
                <div className="w-full max-w-2xl space-y-4">
                  <AIThinkingPanel />
                  {message.rich_contents && message.rich_contents.length > 0
                    ? message.rich_contents.map((rc, i) => <RichContentBlock key={i} data={rc} />)
                    : message.rich_content && <RichContentBlock data={message.rich_content} />
                  }
                  {messageContent && renderAssistantContent(messageContent)}
                </div>
              ) : isDeleted ? (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm italic",
                    isUser ? "text-inherit" : "text-muted-foreground",
                  )}
                >
                  <Trash2 size={14} className="shrink-0 opacity-70" />
                  <span>Tin nhắn này đã bị xóa</span>
                  {showInlineHoverRestore && (
                    <button
                      onClick={handleRestore}
                      disabled={actionPending}
                      className={cn(
                        "ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold",
                        "opacity-0 pointer-events-none transition-all duration-200",
                        "group-hover/chat-row:opacity-100 group-hover/chat-row:pointer-events-auto",
                        "hover:bg-background/60 hover:text-foreground",
                        "disabled:opacity-40",
                        isUser ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                      title="Hoàn tác"
                    >
                      {actionPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      <span>Hoàn tác</span>
                    </button>
                  )}
                </div>
              ) : isUser ? (
                renderUserContent()
              ) : (
                <>
                  {message.rich_contents && message.rich_contents.length > 0
                    ? message.rich_contents.map((rc, i) => <RichContentBlock key={i} data={rc} />)
                    : message.rich_content && <RichContentBlock data={message.rich_content} />
                  }
                  {renderAssistantContent(messageContent)}
                </>
              )}
            </div>
          </div>

          {showToolbar && (
            <div
              className={cn(
                "flex items-center gap-1.5 mt-3 text-muted-foreground/60",
                isUser && "justify-end",
              )}
            >
              {isDeleted ? (
                onRestore && (
                  <button
                    onClick={handleRestore}
                    disabled={actionPending}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/60 hover:bg-muted hover:text-foreground transition-all duration-200 disabled:opacity-60"
                    title="Hoàn tác"
                  >
                    {actionPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    <span className="text-[12px] font-bold">Hoàn tác</span>
                  </button>
                )
              ) : (
                <>
                  {!isUser && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted hover:text-foreground transition-all duration-200"
                        title={copied ? "Da sao chep" : "Sao chep tin nhan"}
                      >
                        {copied ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>

                      <button
                        onClick={() => handleRating(true)}
                        disabled={submitting || !message.log_id}
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-all duration-200",
                          voted === "up"
                            ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "hover:text-foreground",
                        )}
                        title="Huu ich"
                      >
                        <ThumbsUp
                          size={14}
                          fill={voted === "up" ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        onClick={() => handleRating(false)}
                        disabled={submitting || !message.log_id}
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-all duration-200",
                          voted === "down"
                            ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                            : "hover:text-foreground",
                        )}
                        title="Khong huu ich"
                      >
                        <ThumbsDown
                          size={14}
                          fill={voted === "down" ? "currentColor" : "none"}
                        />
                      </button>

                      {message.sources && message.sources.length > 0 && (
                        <button
                          onClick={() => {
                            if (selectedSource) {
                              setSelectedSource(null);
                              setShowSources(true);
                            } else {
                              setShowSources(!showSources);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1.5 h-8 px-2.5 rounded-lg hover:bg-muted transition-all duration-200 text-[12px] font-bold",
                            showSources || selectedSource
                              ? "text-primary bg-primary/10 hover:bg-primary/20"
                              : "hover:text-foreground",
                          )}
                          title="Nguon trich dan"
                        >
                          <FileText size={14} />
                          <span>({message.sources.length})</span>
                        </button>
                      )}
                    </>
                  )}

                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={actionPending}
                      className={cn(
                        "flex h-8 rounded-lg transition-all duration-200 disabled:opacity-60",
                        deleteIconOnly
                          ? "w-8 items-center justify-center hover:bg-muted hover:text-foreground"
                          : "items-center gap-1.5 border border-border/60 px-2.5 hover:bg-muted hover:text-foreground",
                      )}
                      title="Xoa khoi lich su chat"
                    >
                      {actionPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      {!deleteIconOnly && (
                        <span className="text-[12px] font-bold">Xoa</span>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {!isUser &&
            !isDeleted &&
            showSources &&
            message.sources &&
            message.sources.length > 0 && (
              <div className="mt-3 w-full rounded-2xl border border-border/50 bg-muted/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20">
                  <FileText size={11} className="text-muted-foreground/60" />
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                    Nguon trich dan
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-muted-foreground/50">
                    {message.sources.length} nguon
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-border/30">
                  {message.sources.map((source, i) => {
                    const isWebSource = source.type === "web";
                    const page = source.page_number ?? source.page;
                    const score = source.similarity ?? source.score;
                    const isActive =
                      !isWebSource &&
                      activeChunk?.page === page &&
                      activeChunk?.content === source.content;

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (!isWebSource && page) {
                            navigateToChunk(
                              page,
                              source.content ?? "",
                              source.chunk_index,
                            );
                          }
                          setSelectedSource(source);
                          setShowSources(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-colors group/src",
                          isWebSource
                            ? "cursor-default hover:bg-muted/30"
                            : isActive
                              ? "bg-primary/8 cursor-pointer"
                              : "cursor-pointer hover:bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border transition-colors",
                            isActive
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted border-border/60 group-hover/src:border-primary/40",
                          )}
                        >
                          {isWebSource ? (
                            <ExternalLink size={12} className="text-blue-500" />
                          ) : (
                            <span
                              className={cn(
                                "text-[10px] font-black uppercase",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover/src:text-primary",
                              )}
                            >
                              P{page ?? "?"}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[12px] font-semibold text-foreground truncate">
                              {isWebSource
                                ? source.title || "Nguon web"
                                : `Doan #${source.chunk_index ?? i + 1}`}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground/60 truncate mt-0.5">
                            {isWebSource
                              ? source.provider || source.url || "Web"
                              : source.doc_title || "Tai lieu"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-black px-1.5 py-0 h-5",
                              isWebSource
                                ? "bg-blue-500/5 text-blue-500 border-blue-500/20"
                                : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20",
                            )}
                          >
                            {isWebSource
                              ? "WEB"
                              : `${Math.round((score || 0) * 100)}%`}
                          </Badge>
                          {isWebSource && source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground/40 hover:text-primary transition-colors"
                            >
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span
                              className={cn(
                                "text-[10px] transition-colors",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground/30 group-hover/src:text-primary/50",
                              )}
                            >
                              ↗
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {!isUser && !isDeleted && selectedSource && !showSources && (
            <div className="mt-3 w-full rounded-2xl border border-border/50 bg-muted/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/40 bg-muted/20">
                <div
                  className={cn(
                    "w-6 h-6 shrink-0 rounded-lg flex items-center justify-center border",
                    selectedSource.type === "web"
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "bg-primary/10 border-primary/20",
                  )}
                >
                  {selectedSource.type === "web" ? (
                    <ExternalLink size={11} className="text-blue-500" />
                  ) : (
                    <span className="text-[9px] font-black text-primary">
                      P
                      {selectedSource.page_number ?? selectedSource.page ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11.5px] font-semibold text-foreground truncate block">
                    {selectedSource.type === "web"
                      ? selectedSource.title || "Nguon web"
                      : `Doan #${selectedSource.chunk_index}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 truncate block">
                    {selectedSource.type === "web"
                      ? selectedSource.provider || "Web"
                      : selectedSource.doc_title || "Tai lieu"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
                  title="Dong"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                  {selectedSource.content}
                </p>
                {selectedSource.type === "web" && selectedSource.url && (
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/70 transition-colors"
                  >
                    Mo nguon <ExternalLink size={11} />
                  </a>
                )}
                {selectedSource.type !== "web" && (
                  <span className="mt-3 block text-[10px] font-bold text-primary/50 uppercase tracking-wider">
                    ▶ Dang xem trong tai lieu
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
