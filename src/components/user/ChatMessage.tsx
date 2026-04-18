"use client";

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/store/useChatStore";
import { User, Zap, ChevronDown, ChevronUp, FileText, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// Component Thumbs Up/Down Rating
function ResponseRating({ logId }: { logId: string }) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitRating = useCallback(async (thumb: "up" | "down", commentText?: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetchApi("/feedbacks/rating", {
        method: "POST",
        body: JSON.stringify({
          log_id: logId,
          thumbs: thumb === "up",
          comment: commentText || undefined,
        }),
      });
      setVoted(thumb);
      if (thumb === "up") setShowComment(false);
    } catch (err) {
      console.error("[Rating] Failed to submit rating:", err);
    } finally {
      setSubmitting(false);
    }
  }, [logId, submitting]);

  const handleThumbDown = () => {
    if (voted === "down") {
      // Đổi lại thành up
      submitRating("up");
      setShowComment(false);
    } else {
      setShowComment(true);
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-3">
      {/* Thumbs row */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mr-1">
          Phản hồi
        </span>
        <button
          onClick={() => voted !== "up" ? submitRating("up") : submitRating("down")}
          disabled={submitting}
          title="Hữu ích"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all duration-200",
            voted === "up"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
              : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10"
          )}
        >
          <ThumbsUp size={13} />
          <span>Hữu ích</span>
        </button>

        <button
          onClick={handleThumbDown}
          disabled={submitting}
          title="Không hữu ích"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all duration-200",
            voted === "down"
              ? "bg-red-500/15 border-red-500/40 text-red-400"
              : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
          )}
        >
          <ThumbsDown size={13} />
          <span>Không đúng</span>
        </button>

        {voted && (
          <span className="text-[11px] text-zinc-600 font-medium animate-in fade-in duration-300">
            {voted === "up" ? "✓ Cảm ơn phản hồi!" : "✓ Đã ghi nhận"}
          </span>
        )}
      </div>

      {/* Comment box khi chọn thumbs down */}
      {showComment && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Sai ở đâu? (tùy chọn — nhấn Gửi để bỏ qua)"
            rows={2}
            className="w-full max-w-md resize-none rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => submitRating("down", comment)}
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[12px] font-bold hover:bg-red-500/30 transition-all"
            >
              {submitting ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
            <button
              onClick={() => setShowComment(false)}
              className="px-4 py-1.5 rounded-xl border border-zinc-800 text-zinc-500 text-[12px] font-bold hover:text-zinc-400 transition-all"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}
    </div>
  );
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

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-3 top-3 p-2 rounded-lg bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all z-10 opacity-0 group-hover:opacity-100 shadow-xl backdrop-blur-sm"
      title="Sao chép"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={cn(
      "group flex w-full flex-col gap-4 py-8 animate-in fade-in duration-700",
      isUser ? "items-end" : "items-start border-b border-zinc-900/50"
    )}>
      <div className={cn(
        "flex max-w-[90%] gap-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-2">
            <div className={cn(
            "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border transition-all duration-500",
            isUser 
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                : "bg-zinc-900 text-primary border-zinc-800 shadow-[0_0_20px_rgba(184,41,255,0.05)]"
            )}>
            {isUser ? <User size={20} /> : <Zap size={20} className="fill-primary" />}
            </div>
        </div>

        {/* Content Section */}
        <div className={cn(
          "flex flex-col gap-3.5",
          isUser ? "items-end" : "items-start pt-1"
        )}>
          {/* Header Metadata */}
          <div className={cn("flex items-center gap-3 px-1", isUser && "flex-row-reverse")}>
            <span className="text-[12px] font-black text-white tracking-tight uppercase">
              {isUser ? "BẠN" : "MINDEX AI"}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              {message.timestamp ? format(new Date(message.timestamp), "HH:mm") : ""}
            </span>
          </div>

          {/* Message Content */}
          <div className={cn(
            "text-[15.5px] leading-[1.6] transition-all duration-500",
            isUser 
                ? "bg-zinc-900 text-white px-7 py-4.5 rounded-[2.5rem] rounded-tr-sm border border-zinc-800 shadow-2xl" 
                : "text-zinc-300 w-full"
          )}>
            {isStreaming && !message.content ? (
              <div className="flex gap-1.5 items-center py-2 px-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce"></span>
              </div>
            ) : (
                <div className="prose prose-invert prose-zinc max-w-none 
                    prose-p:leading-[1.7] prose-p:mb-5 
                    prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-5
                    prose-ol:list-decimal prose-ol:pl-5 prose-ol:mb-5
                    prose-li:mb-2 prose-li:text-zinc-300
                    prose-strong:text-white prose-strong:font-bold
                    prose-pre:bg-black prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl prose-pre:p-6 
                    prose-code:text-primary prose-table:border prose-table:border-zinc-800 shadow-sm">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            pre: ({node, children, ...props}: any) => {
                                const content = extractText(children);
                                return (
                                    <div className="relative group">
                                        <CopyButton content={content} />
                                        <pre {...props}>{children}</pre>
                                    </div>
                                );
                            },
                            table: ({node, children, ...props}: any) => {
                                const content = extractText(children);
                                return (
                                    <div className="relative group my-8">
                                        <CopyButton content={content} />
                                        <div className="overflow-x-auto rounded-2xl border border-zinc-900">
                                            <table className="w-full text-sm" {...props}>{children}</table>
                                        </div>
                                    </div>
                                );
                            },
                            th: ({node, ...props}) => <th className="bg-zinc-900 px-5 py-4 text-left font-black text-white uppercase tracking-tighter" {...props} />,
                            td: ({node, ...props}) => <td className="border-t border-zinc-900 px-5 py-4 text-zinc-400 font-medium" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                                inline 
                                ? <code className="bg-zinc-900 text-primary px-2 py-0.5 rounded-md font-bold text-[13px] border border-zinc-800/50" {...props} />
                                : <code className="block font-mono text-[13.5px] leading-relaxed" {...props} />,
                            p: ({node, ...props}) => <p className="mb-5 last:mb-0" {...props} />
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
            )}
          </div>

          {/* Rating Thumbs — chỉ hiện khi assistant đã stream xong và có log_id */}
          {!isUser && !isStreaming && message.log_id && (
            <ResponseRating logId={message.log_id} />
          )}

          {/* Sources Section (Assistant only) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-6 w-full group/sources">
                <button 
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-2.5 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 rounded-2xl text-[12px] font-black text-zinc-500 hover:text-white transition-all duration-300"
                >
                  <FileText size={14} className="group-hover/sources:text-primary transition-colors" />
                  Nguồn dữ liệu trích dẫn ({message.sources.length})
                  {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showSources && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        {message.sources.map((source, i) => (
                            <div 
                            key={i} 
                            className="flex flex-col p-6 bg-zinc-900/20 border border-zinc-900 rounded-[2rem] hover:bg-zinc-900/40 hover:border-zinc-800 transition-all cursor-default group/src"
                            >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover/src:border-primary/50 transition-all">
                                        <span className="text-[11px] font-black text-primary uppercase">P{source.page_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-zinc-300">Đoạn #{source.chunk_index}</span>
                                        {source.doc_title && (
                                            <span className="text-[10px] text-zinc-500 font-bold truncate max-w-[150px] uppercase tracking-tighter">
                                                {source.doc_title}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 text-[10px] font-black px-2 mt-0.5">
                                    {Math.round(source.similarity * 100)}% Match
                                </Badge>
                            </div>
                            <p className="text-[12.5px] text-zinc-500 leading-relaxed italic font-medium group-hover/src:text-zinc-400 transition-colors">
                                "{source.content}"
                            </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
