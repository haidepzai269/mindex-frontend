"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/store/useChatStore";
import { User, Zap, ChevronDown, ChevronUp, FileText, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { AIThinkingIndicator } from "@/components/user/AIThinkingIndicator";
import { useChatStore } from "@/store/useChatStore";
import { usePdfStore } from "@/store/usePdfStore";
import { toast } from "sonner";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
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
      <div className="relative group my-6 rounded-2xl overflow-hidden border border-border shadow-sm w-full">
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
  const hasSources = !!(message.sources && message.sources.length > 0);
  const [showSources, setShowSources] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [showThinkingDetails, setShowThinkingDetails] = useState(true);
  const streamStatus = useChatStore((state) => state.streamStatus);
  const streamInsights = useChatStore((state) => state.streamInsights);

  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigateToChunk = usePdfStore((s) => s.navigateToChunk);
  const activeChunk = usePdfStore((s) => s.activeChunk);
  const thinkingDetail =
    streamStatus === "searching"
      ? "Đang tìm nguồn liên quan và kiểm tra ngữ cảnh trước khi trả lời."
      : "Đang phân tích câu hỏi, chọn ngữ cảnh phù hợp và chuẩn bị câu trả lời.";
  const visibleThinkingInsights = streamInsights.length > 0 ? streamInsights : [thinkingDetail];

  // Fetch rating state on mount
  useEffect(() => {
    if (isUser || isStreaming || !message.log_id) return;
    let isMounted = true;
    fetchApi(`/feedbacks/rating/${message.log_id}`)
      .then((res: any) => {
        if (isMounted && res && res.data) {
          setVoted(res.data.thumbs ? "up" : "down");
        }
      })
      .catch((err) => {
        console.debug("Failed to fetch rating for message:", message.log_id, err);
      });
    return () => {
      isMounted = false;
    };
  }, [message.log_id, isUser, isStreaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Đã sao chép tin nhắn vào bộ nhớ tạm");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleRating = async (thumbs: boolean) => {
    if (submitting || !message.log_id) return;
    setSubmitting(true);
    const voteType = thumbs ? "up" : "down";
    const previousVote = voted;

    // Optimistic UI update
    setVoted(voteType === voted ? null : voteType);

    try {
      await fetchApi("/feedbacks/rating", {
        method: "POST",
        body: JSON.stringify({
          log_id: message.log_id,
          thumbs: thumbs,
        }),
      });
      toast.success(thumbs ? "Đã đánh giá hữu ích" : "Đã đánh giá không hữu ích");
    } catch (err) {
      console.error("[Rating] Failed:", err);
      setVoted(previousVote);
      toast.error("Không thể lưu đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const renderAssistantContent = (content: string) => (
    <div className={cn(
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
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

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
          "flex flex-col gap-3.5 min-w-0",
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
            {isStreaming ? (
              <div className="w-full max-w-2xl space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setShowThinkingDetails((open) => !open)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-expanded={showThinkingDetails}
                  title={showThinkingDetails ? "Ẩn phân tích AI" : "Mở phân tích AI"}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Zap size={16} className="fill-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <AIThinkingIndicator status={streamStatus} />
                  </span>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground">
                    {showThinkingDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </span>
                </button>

                {showThinkingDetails && (
                  <div className="border-t border-border/60 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-3">
                      {visibleThinkingInsights.map((insight, index) => (
                        <div
                          key={`${index}-${insight}`}
                          className="relative pl-5 animate-in fade-in slide-in-from-bottom-1 duration-200"
                        >
                          <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                          {index < visibleThinkingInsights.length - 1 && (
                            <span className="absolute left-[3px] top-5 bottom-[-0.75rem] w-px bg-border" />
                          )}
                          <p className="text-sm leading-6 text-muted-foreground">
                            {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>

                {message.content && renderAssistantContent(message.content)}
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
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Action toolbar for AI response */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1.5 mt-3 text-muted-foreground/60">
              {/* 1. Sao chép */}
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted hover:text-foreground transition-all duration-200"
                title={copied ? "Đã sao chép" : "Sao chép tin nhắn"}
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>

              {/* 2. Like */}
              <button
                onClick={() => handleRating(true)}
                disabled={submitting || !message.log_id}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-all duration-200",
                  voted === "up"
                    ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : "hover:text-foreground"
                )}
                title="Hữu ích"
              >
                <ThumbsUp size={14} fill={voted === "up" ? "currentColor" : "none"} />
              </button>

              {/* 3. Dislike */}
              <button
                onClick={() => handleRating(false)}
                disabled={submitting || !message.log_id}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-all duration-200",
                  voted === "down"
                    ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                    : "hover:text-foreground"
                )}
                title="Không hữu ích"
              >
                <ThumbsDown size={14} fill={voted === "down" ? "currentColor" : "none"} />
              </button>

              {/* 4. Nguồn (icon tài liệu kèm số lượng trong ngoặc) */}
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
                    (showSources || selectedSource) ? "text-primary bg-primary/10 hover:bg-primary/20" : "hover:text-foreground"
                  )}
                  title="Nguồn trích dẫn"
                >
                  <FileText size={14} />
                  <span>({message.sources.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Sources scrollable container */}
          {!isUser && showSources && message.sources && message.sources.length > 0 && (
            <div className="mt-3 w-full rounded-2xl border border-border/50 bg-muted/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20">
                <FileText size={11} className="text-muted-foreground/60" />
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                  Nguồn trích dẫn
                </span>
                <span className="ml-auto text-[10px] font-bold text-muted-foreground/50">
                  {message.sources.length} nguồn
                </span>
              </div>
              {/* Scrollable list — fixed height, no overflow bleed */}
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
                          navigateToChunk(page, source.content ?? "", source.chunk_index);
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
                          : "cursor-pointer hover:bg-muted/30"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border transition-colors",
                        isActive
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted border-border/60 group-hover/src:border-primary/40"
                      )}>
                        {isWebSource ? (
                          <ExternalLink size={12} className="text-blue-500" />
                        ) : (
                          <span className={cn(
                            "text-[10px] font-black uppercase",
                            isActive ? "text-primary" : "text-muted-foreground group-hover/src:text-primary"
                          )}>
                            P{page ?? "?"}
                          </span>
                        )}
                      </div>

                      {/* Title + subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[12px] font-semibold text-foreground truncate">
                            {isWebSource
                              ? source.title || "Nguồn web"
                              : `Đoạn #${source.chunk_index ?? i + 1}`}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground/60 truncate mt-0.5">
                          {isWebSource
                            ? source.provider || source.url || "Web"
                            : source.doc_title || "Tài liệu"}
                        </p>
                      </div>

                      {/* Right side: badge + action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black px-1.5 py-0 h-5",
                          isWebSource
                            ? "bg-blue-500/5 text-blue-500 border-blue-500/20"
                            : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                        )}>
                          {isWebSource ? "WEB" : `${Math.round((score || 0) * 100)}%`}
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
                          <span className={cn(
                            "text-[10px] transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground/30 group-hover/src:text-primary/50"
                          )}>
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

          {/* Selected source preview — hiện sau khi user click vào 1 nguồn */}
          {!isUser && selectedSource && !showSources && (
            <div className="mt-3 w-full rounded-2xl border border-border/50 bg-muted/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/40 bg-muted/20">
                <div className={cn(
                  "w-6 h-6 shrink-0 rounded-lg flex items-center justify-center border",
                  selectedSource.type === "web"
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-primary/10 border-primary/20"
                )}>
                  {selectedSource.type === "web" ? (
                    <ExternalLink size={11} className="text-blue-500" />
                  ) : (
                    <span className="text-[9px] font-black text-primary">
                      P{selectedSource.page_number ?? selectedSource.page ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11.5px] font-semibold text-foreground truncate block">
                    {selectedSource.type === "web"
                      ? selectedSource.title || "Nguồn web"
                      : `Đoạn #${selectedSource.chunk_index}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 truncate block">
                    {selectedSource.type === "web"
                      ? selectedSource.provider || "Web"
                      : selectedSource.doc_title || "Tài liệu"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
                  title="Đóng"
                >
                  <X size={13} />
                </button>
              </div>
              {/* Content text */}
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
                    Mở nguồn <ExternalLink size={11} />
                  </a>
                )}
                {selectedSource.type !== "web" && (
                  <span className="mt-3 block text-[10px] font-bold text-primary/50 uppercase tracking-wider">
                    ▶ Đang xem trong tài liệu
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
