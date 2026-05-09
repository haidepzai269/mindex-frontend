"use client";

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/store/useChatStore";
import { User, Zap, ChevronDown, ChevronUp, FileText, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { AIThinkingIndicator } from "@/components/user/AIThinkingIndicator";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// ── Rating ──────────────────────────────────────────────────────────────────
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
        body: JSON.stringify({ log_id: logId, thumbs: thumb === "up", comment: commentText || undefined }),
      });
      setVoted(thumb);
      if (thumb === "up") setShowComment(false);
    } catch (err) {
      console.error("[Rating] Failed:", err);
    } finally {
      setSubmitting(false);
    }
  }, [logId, submitting]);

  const handleThumbDown = () => {
    if (voted === "down") { submitRating("up"); setShowComment(false); }
    else setShowComment(true);
  };

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mr-1">Phản hồi</span>
        <button
          onClick={() => voted !== "up" ? submitRating("up") : submitRating("down")}
          disabled={submitting}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all duration-200",
            voted === "up"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/30 border-border text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10"
          )}
        >
          <ThumbsUp size={13} /><span>Hữu ích</span>
        </button>
        <button
          onClick={handleThumbDown}
          disabled={submitting}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all duration-200",
            voted === "down"
              ? "bg-red-500/15 border-red-500/40 text-red-500"
              : "bg-muted/30 border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10"
          )}
        >
          <ThumbsDown size={13} /><span>Không đúng</span>
        </button>
        {voted && (
          <span className="text-[11px] text-muted-foreground font-medium animate-in fade-in duration-300">
            {voted === "up" ? "✓ Cảm ơn phản hồi!" : "✓ Đã ghi nhận"}
          </span>
        )}
      </div>
      {showComment && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Sai ở đâu? (tùy chọn — nhấn Gửi để bỏ qua)"
            rows={2}
            className="w-full max-w-md resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <button onClick={() => submitRating("down", comment)} disabled={submitting} className="px-4 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[12px] font-bold hover:bg-red-500/30 transition-all">
              {submitting ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
            <button onClick={() => setShowComment(false)} className="px-4 py-1.5 rounded-xl border border-border text-muted-foreground text-[12px] font-bold hover:text-foreground transition-all">
              Bỏ qua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Text extraction (for copy) ───────────────────────────────────────────────
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

// ── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ content, className }: { content: string; className?: string }) {
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
        className
      )}
      title={copied ? "Đã sao chép" : "Sao chép"}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Markdown components ──────────────────────────────────────────────────────
const markdownComponents: any = {
  // Headings
  h1: ({ children, ...props }: any) => (
    <h1 className="text-[1.6rem] font-black tracking-tight mt-8 mb-4 pb-3 border-b border-border text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-[1.3rem] font-black tracking-tight mt-7 mb-3 pb-2 border-b border-border/60 text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-[1.1rem] font-black mt-6 mb-2 pl-3 border-l-[3px] border-primary text-foreground" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-base font-bold mt-5 mb-2 text-foreground" {...props}>{children}</h4>
  ),
  h5: ({ children, ...props }: any) => (
    <h5 className="text-sm font-bold mt-4 mb-1.5 text-foreground uppercase tracking-wider" {...props}>{children}</h5>
  ),
  h6: ({ children, ...props }: any) => (
    <h6 className="text-sm font-bold mt-3 mb-1 text-muted-foreground uppercase tracking-widest" {...props}>{children}</h6>
  ),

  // Paragraph
  p: ({ children, ...props }: any) => (
    <p className="mb-4 last:mb-0 leading-[1.8] text-[15px]" {...props}>{children}</p>
  ),

  // Strong & Em
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-foreground" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-foreground/80" {...props}>{children}</em>
  ),

  // Links
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

  // Horizontal rule
  hr: () => (
    <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  ),

  // Blockquote
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="my-5 pl-4 pr-4 py-3 border-l-4 border-primary/50 bg-primary/5 rounded-r-xl text-muted-foreground italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Unordered list — custom bullet dots
  ul: ({ children, ...props }: any) => (
    <ul className="my-4 space-y-2 pl-0 list-none" {...props}>{children}</ul>
  ),

  // Ordered list
  ol: ({ children, ...props }: any) => (
    <ol className="my-4 space-y-2 pl-5 list-decimal marker:text-primary marker:font-bold" {...props}>{children}</ol>
  ),

  // List item — detect parent context via className
  li: ({ children, className, ordered, ...props }: any) => (
    <li className="flex items-start gap-2.5 leading-[1.7] text-[15px]" {...props}>
      {!ordered && (
        <span className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      )}
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),

  // Code block (pre + code)
  pre: ({ node, children, ...props }: any) => {
    const content = extractText(children);
    const codeNode = node?.children?.[0];
    const langClass: string = codeNode?.properties?.className?.[0] ?? "";
    const lang = langClass.replace("language-", "").toUpperCase() || "CODE";

    return (
      <div className="relative group my-6 rounded-2xl overflow-hidden border border-border shadow-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/70 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
            </span>
            <span className="text-[10px] font-black text-muted-foreground/70 tracking-widest uppercase">{lang}</span>
          </div>
          <CopyButton content={content} />
        </div>
        {/* Code content */}
        <pre className="m-0 p-5 overflow-x-auto bg-muted/30 rounded-none text-[13.5px] leading-relaxed" {...props}>
          {children}
        </pre>
      </div>
    );
  },

  // Inline code
  code: ({ node, inline, className, children, ...props }: any) => {
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
      <code className="block font-mono text-[13.5px] leading-relaxed text-foreground" {...props}>
        {children}
      </code>
    );
  },

  // Table
  table: ({ node, children, ...props }: any) => {
    const content = extractText(children);
    return (
      <div className="relative group my-6">
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full text-[14px] border-collapse" {...props}>{children}</table>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton content={content} />
        </div>
      </div>
    );
  },
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted/60 border-b border-border" {...props}>{children}</thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-border/50" {...props}>{children}</tbody>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-[11px] font-black text-muted-foreground uppercase tracking-wider" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-[14px] text-foreground/80" {...props}>{children}</td>
  ),

  // Image
  img: ({ src, alt, ...props }: any) => (
    <span className="block my-5">
      <img
        src={src}
        alt={alt}
        className="rounded-2xl shadow-md max-w-full border border-border/50"
        loading="lazy"
        {...props}
      />
      {alt && <span className="block mt-2 text-[12px] text-center text-muted-foreground italic">{alt}</span>}
    </span>
  ),
};

// ── Main ChatMessage component ───────────────────────────────────────────────
export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={cn(
      "group flex w-full flex-col gap-4 py-8 animate-in fade-in duration-700",
      isUser ? "items-end" : "items-start border-b border-border/50"
    )}>
      <div className={cn(
        "flex max-w-[90%] gap-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border transition-all duration-500",
            isUser
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-primary border-border"
          )}>
            {isUser ? <User size={20} /> : <Zap size={20} className="fill-primary" />}
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "flex flex-col gap-3.5",
          isUser ? "items-end" : "items-start pt-1"
        )}>
          {/* Header */}
          <div className={cn("flex items-center gap-3 px-1", isUser && "flex-row-reverse")}>
            <span className="text-[12px] font-black text-foreground tracking-tight uppercase">
              {isUser ? "BẠN" : "MINDEX AI"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              {message.timestamp ? format(new Date(message.timestamp), "HH:mm") : ""}
            </span>
          </div>

          {/* Message bubble */}
          <div className={cn(
            "transition-all duration-500",
            isUser
              ? "bg-primary text-primary-foreground px-6 py-4 rounded-[2rem] rounded-tr-sm border border-primary/20 shadow-sm text-[15px] leading-[1.65]"
              : "text-foreground w-full"
          )}>
            {isStreaming && !message.content ? (
              <div className="py-2 px-1">
                <AIThinkingIndicator />
              </div>
            ) : isUser ? (
              // User messages: plain text (no markdown)
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              // AI messages: full markdown
              <div className={cn(
                "prose dark:prose-invert max-w-none",
                // Headings
                "prose-headings:font-black prose-headings:tracking-tight",
                // Paragraph spacing
                "prose-p:leading-[1.8] prose-p:mb-4",
                // Lists
                "prose-ul:my-3 prose-ol:my-3 prose-li:my-1",
                // Inline code — handled via component above
                "prose-code:not-prose",
                // Pre — handled via component, reset prose styles
                "prose-pre:bg-transparent prose-pre:p-0 prose-pre:rounded-none prose-pre:my-0",
                // Blockquote
                "prose-blockquote:not-italic prose-blockquote:border-0 prose-blockquote:p-0 prose-blockquote:my-0",
                // Table
                "prose-table:border-0 prose-table:my-0",
                // HR
                "prose-hr:my-0",
                // Links
                "prose-a:no-underline",
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Rating */}
          {!isUser && !isStreaming && message.log_id && (
            <ResponseRating logId={message.log_id} />
          )}

          {/* Sources */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-6 w-full group/sources">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-2.5 px-4 py-2 bg-muted/40 hover:bg-muted border border-border/50 rounded-2xl text-[12px] font-black text-muted-foreground hover:text-foreground transition-all duration-300"
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
                      className="flex flex-col p-6 bg-muted/20 border border-border/50 rounded-[2rem] hover:bg-muted/40 hover:border-border transition-all cursor-default group/src"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center border border-border group-hover/src:border-primary/50 transition-all">
                            <span className="text-[11px] font-black text-primary uppercase">P{source.page_number}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-foreground">Đoạn #{source.chunk_index}</span>
                            {source.doc_title && (
                              <span className="text-[10px] text-muted-foreground/60 font-bold truncate max-w-[150px] uppercase tracking-tighter">
                                {source.doc_title}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] font-black px-2">
                          {Math.round(source.similarity * 100)}% Match
                        </Badge>
                      </div>
                      <p className="text-[12.5px] text-muted-foreground leading-relaxed italic font-medium group-hover/src:text-foreground transition-colors">
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
