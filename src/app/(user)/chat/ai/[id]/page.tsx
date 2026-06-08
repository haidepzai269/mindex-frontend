"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import useSWR, { mutate as swrMutate } from "swr";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  BrainCircuit,
  FileText,
  Globe2,
  Loader2,
  MessageSquarePlus,
  PanelLeft,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "@/components/user/ChatInput";
import { ChatMessage } from "@/components/user/ChatMessage";
import { fetchApi, fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useChatSSE } from "@/hooks/useChatSSE";
import { useChatStore, type ChatMessage as StoreChatMessage } from "@/store/useChatStore";
import { ChatScrollDots } from "@/components/user/ChatScrollDots";

type ChatSession = {
  session_id: string;
  title: string;
  summary: string;
  started_at: string;
  message_count: number;
};

const suggestions = [
  "Tổng hợp các ý chính về chủ đề này",
  "So sánh các nguồn liên quan",
  "Có điểm nào mâu thuẫn giữa các tài liệu không?",
  "Giải thích khái niệm này bằng ví dụ dễ hiểu",
];

export default function GlobalAIChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historySkip, setHistorySkip] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    messages,
    isStreaming,
    currentStreamText,
    setMessages,
    setSessionId,
    sessionId,
    clearChat,
  } = useChatStore();
  const justCreatedRef = useRef(false);
  // Chỉ true khi user gửi tin nhắn đầu từ trang /new — phân biệt với sessionId cũ còn sót
  const awaitingSessionRef = useRef(false);
  const { sendMessage, error: sseError } = useChatSSE();

  useEffect(() => {
    if (sseError) {
      toast.error(sseError);
    }
  }, [sseError]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      if (id === "new") {
        awaitingSessionRef.current = false;
        clearChat();
        setSessionId(null);
        return;
      }

      // Nếu vừa tạo session mới (navigate từ /new sang UUID thực), không cần fetch lại
      if (justCreatedRef.current) {
        justCreatedRef.current = false;
        setSessionId(id);
        sessionStorage.setItem("mindex_ai_active_session", id);
        return;
      }

      try {
        setSessionId(id);
        sessionStorage.setItem("mindex_ai_active_session", id);
        const msgData: any = await fetchApi(`/chat/ai/sessions/${id}/messages?limit=30&skip=0`);
        if (isMounted && msgData.success && msgData.data?.messages) {
          setMessages(msgData.data.messages);
          setHasMore(msgData.data.has_more ?? false);
          setHistorySkip(msgData.data.messages.length);
        }
      } catch (error) {
        console.error("[GlobalAI] Failed to restore session:", error);
        toast.error("Không thể khôi phục lịch sử chat");
      }
    }

    bootstrapSession();
    return () => {
      isMounted = false;
    };
  }, [id, clearChat, setMessages, setSessionId, router]);

  const getViewport = useCallback(
    () => scrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null,
    []
  );

  const loadMoreHistory = useCallback(async () => {
    if (!sessionId || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const viewport = getViewport();
    const heightBefore = viewport?.scrollHeight ?? 0;
    try {
      const data: any = await fetchApi(`/chat/ai/sessions/${sessionId}/messages?limit=30&skip=${historySkip}`);
      if (data.success && data.data?.messages?.length > 0) {
        const older = data.data.messages as StoreChatMessage[];
        const existingIds = new Set(messages.map((m) => m.id));
        const unique = older.filter((m) => !existingIds.has(m.id));
        setMessages([...unique, ...messages]);
        setHasMore(data.data.has_more ?? false);
        setHistorySkip((s) => s + older.length);
        requestAnimationFrame(() => {
          const v = getViewport();
          if (v) v.scrollTop = v.scrollHeight - heightBefore;
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("[GlobalAI] Load more history failed:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [sessionId, hasMore, isLoadingMore, historySkip, messages, getViewport, setMessages]);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;
    const handle = () => {
      if (viewport.scrollTop < 150 && hasMore && !isLoadingMore) loadMoreHistory();
    };
    viewport.addEventListener("scroll", handle, { passive: true });
    return () => viewport.removeEventListener("scroll", handle);
  }, [hasMore, isLoadingMore, loadMoreHistory, getViewport]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.querySelector(
      '[data-slot="scroll-area-viewport"]'
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, currentStreamText]);

  // Navigate đến URL thực chỉ khi user đã gửi tin nhắn từ /new và SSE trả về session_id mới
  useEffect(() => {
    if (id === "new" && sessionId && awaitingSessionRef.current) {
      awaitingSessionRef.current = false;
      justCreatedRef.current = true;
      router.replace(`/chat/ai/${sessionId}`);
      swrMutate("/chat/ai/sessions");
    }
  }, [id, sessionId, router]);

  const handleSendMessage = (
    question: string,
    model: string = "Mindex-1",
    thinking: boolean = false
  ) => {
    if (id === "new") {
      awaitingSessionRef.current = true;
    }
    sendMessage(id, question, undefined, false, model, thinking, "global_ai");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <SessionSidebar
        currentId={id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSessionDeleted={(deletedId) => {
          if (deletedId === id) router.push("/chat/ai/new");
        }}
      />
      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="z-50 flex h-14 w-full shrink-0 items-center justify-center border-b border-border/40 bg-background/85 px-3 backdrop-blur-xl md:h-16 md:px-6">
          <div className="flex w-full max-w-5xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                aria-label="Mở lịch sử chat"
              >
                <PanelLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/library")}
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Quay lại thư viện"
              >
                <ArrowLeft size={18} />
              </Button>

              <div className="hidden min-w-0 items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1.5 sm:flex">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Sparkles size={13} />
                </div>
                <span className="truncate text-sm font-semibold">
                  Mindex AI
                </span>
                <Badge
                  variant="outline"
                  className="h-5 rounded-full border-border/70 bg-background px-2 text-[10px] font-bold text-muted-foreground"
                >
                  Global
                </Badge>
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:hidden">
                  Mindex AI
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/chat/ai/new")}
                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Tạo phiên chat mới"
              >
                <MessageSquarePlus size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/library")}
                className="hidden h-9 rounded-full border-border/70 bg-background px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
              >
                <FileText size={14} />
                Thư viện
              </Button>
            </div>
          </div>
        </header>

        <div className="relative flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full w-full" ref={scrollRef}>
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-48 pt-8 md:px-6 md:pb-52 md:pt-10">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center md:py-16">
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40 shadow-sm">
                  <Globe2 size={26} className="text-foreground" />
                </div>
                <h2 className="mb-3 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Tôi có thể giúp gì cho bạn hôm nay?
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-sm leading-6 text-muted-foreground">
                  Hỏi trên thư viện cộng đồng, tổng hợp nhiều nguồn và dùng web search khi cần thêm ngữ cảnh mới.
                </p>

                <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground">
                    <Search size={13} />
                    Community + Web
                  </span>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground">
                    <BrainCircuit size={13} />
                    Deep reasoning
                  </span>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground">
                    <Zap size={13} />
                    Mindex models
                  </span>
                </div>

                <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {suggestions.map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => handleSendMessage(hint)}
                      className="min-h-12 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-left text-sm font-medium leading-5 text-foreground transition-colors hover:border-border hover:bg-muted/50"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}
            {!hasMore && messages.length >= 30 && (
              <p className="text-center text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest py-2">
                Đã hiển thị toàn bộ lịch sử
              </p>
            )}

            <div className="space-y-10">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} data-user-message="true">
                    <ChatMessage message={msg} />
                  </div>
                ) : (
                  <ChatMessage key={msg.id} message={msg} />
                )
              )}

              {isStreaming && (
                <ChatMessage
                  message={{
                    id: "streaming",
                    role: "assistant",
                    content: currentStreamText,
                    timestamp: new Date().toISOString(),
                  }}
                  isStreaming={true}
                />
              )}
            </div>
          </div>
        </ScrollArea>
        <ChatScrollDots messages={messages} scrollContainerRef={scrollRef} />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-1/2 z-40 w-full max-w-3xl -translate-x-1/2 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-20 md:px-6 md:pb-6">
          <div className="pointer-events-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isStreaming}
              isLoading={isStreaming}
              placeholder="Nhắn cho Mindex AI..."
            />
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-medium text-muted-foreground/60">
            <Search size={10} />
            <span>AI có thể sai. Kiểm tra nguồn quan trọng trước khi dùng.</span>
            <Zap size={10} />
          </div>
        </div>
      </main>
    </div>
  );
}

function SessionSidebar({
  currentId,
  open,
  onClose,
  onSessionDeleted,
}: {
  currentId: string;
  open: boolean;
  onClose: () => void;
  onSessionDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const { data, mutate } = useSWR<{ success: boolean; data: ChatSession[] }>("/chat/ai/sessions", fetcher as any);
  const sessions: ChatSession[] = data?.data ?? [];

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchApi(`/chat/ai/sessions/${sessionId}`, { method: "DELETE" });
      mutate();
      onSessionDeleted(sessionId);
    } catch {
      toast.error("Không thể xóa phiên chat");
    }
  };

  return (
    <aside
      className={cn(
        "flex w-[260px] shrink-0 flex-col border-r border-border/50 bg-background z-40",
        "fixed inset-y-0 left-0 transition-transform duration-200 md:relative md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4 md:h-16">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-foreground" />
          <span className="text-sm font-semibold">Lịch sử</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <X size={15} />
        </button>
      </div>

      {/* New chat */}
      <div className="shrink-0 px-3 pb-2 pt-3">
        <button
          onClick={() => { router.push("/chat/ai/new"); onClose(); }}
          className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          <Plus size={14} className="shrink-0" />
          Chat mới
        </button>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1 px-2">
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Chưa có lịch sử chat</p>
        ) : (
          <div className="space-y-0.5 py-1">
            {sessions.map((session) => (
              <SessionItemButton
                key={session.session_id}
                session={session}
                isActive={session.session_id === currentId}
                onDelete={(e) => handleDelete(session.session_id, e)}
                onClick={() => { router.push(`/chat/ai/${session.session_id}`); onClose(); }}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function SessionItemButton({
  session,
  isActive,
  onDelete,
  onClick,
}: {
  session: ChatSession;
  isActive: boolean;
  onDelete: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const displayTitle = session.title || session.summary || "Chat không có tiêu đề";
  const displaySummary = session.summary && session.summary !== session.title ? session.summary : "";
  let relativeDate = "";
  try {
    relativeDate = formatDistanceToNow(new Date(session.started_at), { locale: vi, addSuffix: true });
  } catch {}

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
        isActive && "bg-muted/70"
      )}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
          {displayTitle}
        </span>
        <button
          onClick={onDelete}
          className="invisible flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 group-hover:visible"
          aria-label="Xóa"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {displaySummary && (
        <span className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
          {displaySummary}
        </span>
      )}
      <span className="text-[10px] font-medium text-muted-foreground/60">{relativeDate}</span>
    </div>
  );
}
