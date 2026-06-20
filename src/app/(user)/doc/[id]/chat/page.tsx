"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  FileText,
  Star,
  Share2,
  Trash2,
  Clock,
  History,
  Zap,
  Tag,
  Loader2,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  ChevronRight,
  GitFork,
  ArrowLeft,
  BookOpen,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/user/ChatMessage";
import { ChatInput } from "@/components/user/ChatInput";
import {
  useChatStore,
  type ChatAttachment,
  type ChatMessage as StoreChatMessage,
} from "@/store/useChatStore";
import { useChatSSE } from "@/hooks/useChatSSE";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useConfirmStore } from "@/store/useConfirmStore";
import { ShareDialog } from "@/components/user/ShareDialog";
import { useSearchParams } from "next/navigation";
import { NotificationBell } from "@/components/user/NotificationBell";
import { StudyHubWidget } from "@/components/user/StudyHubWidget";
import { CreateCollectionModal } from "@/components/user/CreateCollectionModal";
import { ChatScrollDots } from "@/components/user/ChatScrollDots";
import DocContentViewer from "@/components/user/DocContentViewer";
import { usePdfStore } from "@/store/usePdfStore";

const NEURAL_CORES = [
  { label: "Neural Slide & Video", path: "/presentation" },
  { label: "Neural Flashcard", path: "/flashcards" },
  { label: "Neural Quiz", path: "/quiz" },
  { label: "Neural Mindmap", path: "/mindmap" },
  { label: "Neural Audio", path: "/audio" },
];

export default function ChatPage() {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id ?? "";
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentCoreIndex, setCurrentCoreIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCoreIndex((prev) => (prev + 1) % NEURAL_CORES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const {
    messages,
    isStreaming,
    currentStreamText,
    setMessages,
    setSessionId,
    clearChat,
    sessionId,
  } = useChatStore();
  const { sendMessage, error: sseError } = useChatSSE();
  const searchParams = useSearchParams();
  const forkId = searchParams.get("fork") || undefined;
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historySkip, setHistorySkip] = useState(0);
  const [messageActionId, setMessageActionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [studyHubOpen, setStudyHubOpen] = useState(false);
  const sidebarMode = usePdfStore((s) => s.sidebarMode);
  const setSidebarMode = usePdfStore((s) => s.setSidebarMode);
  const clearChunk = usePdfStore((s) => s.clearChunk);
  const confirm = useConfirmStore((state) => state.confirm);
  const { mutate } = useSWRConfig();

  // 2. Fetch data tài liệu
  const fetchUrl = id
    ? forkId
      ? `/documents/${id}?fork=${forkId}`
      : `/documents/${id}`
    : null;
  const { data: docData, error: docError } = useSWR<{
    success: boolean;
    data: any;
  }>(fetchUrl, fetcher as any);
  const doc = docData?.data;

  // 1b. Theo dõi lỗi từ SSE
  useEffect(() => {
    if (sseError) {
      toast.error(sseError);
    }
  }, [sseError]);

  const isExpired = useMemo(() => {
    if (!doc?.expired_at) return false;
    return new Date(doc.expired_at).getTime() < Date.now();
  }, [doc?.expired_at]);

  const handleAttachmentSessionReady = useCallback(
    (nextSessionId: string) => {
      setSessionId(nextSessionId);
      sessionStorage.setItem(`mindex_session_${id}`, nextSessionId);
    },
    [id, setSessionId],
  );

  const handleSendMessage = (
    q: string,
    model: string = "Mindex-1",
    thinking: boolean = false,
    attachments: ChatAttachment[] = [],
  ) => {
    if (doc?.status !== "ready") {
      toast.warning("Tài liệu chưa sẵn sàng", {
        description: "Vui lòng đợi quá trình xử lý tài liệu hoàn tất.",
      });
      return;
    }

    if (isExpired) {
      toast.error("Tài liệu đã hết hạn", {
        description:
          "Tài liệu này không còn khả dụng để trò chuyện. Vui lòng ghim (Pin) tài liệu nếu bạn muốn lưu trữ vĩnh viễn.",
      });
      return;
    }

    // Truyền forkId chỉ lần đầu (khi chưa có session) để inject Shared Context
    const currentFork = !sessionId ? forkId : undefined;
    sendMessage(id, q, currentFork, false, model, thinking, undefined, attachments);
  };

  // 1. Phục hồi lịch sử chat khi vào tài liệu
  useEffect(() => {
    let isMounted = true;

    // Reset chat state ngay khi chuyển document để tránh hiển thị nhầm dữ liệu cũ
    console.log(`[Chat] Document changed to: ${id}. Resetting chat state...`);
    clearChat();
    clearChunk();
    setSessionId(null);
    setHasMore(false);
    setHistorySkip(0);
    setSidebarMode("inbox");

    async function restoreSession() {
      if (!id) return;

      try {
        console.log(`[Chat] Restoring session for doc: ${id}`);

        // Bước 1: Ưu tiên lấy từ LocalStorage
        let sid = sessionStorage.getItem(`mindex_session_${id}`);
        if (sid) console.log(`[Chat] Found session in LocalStorage: ${sid}`);

        // Bước 2: Nếu LocalStorage trống, hỏi Backend session active cuối cùng
        if (!sid) {
          console.log(
            `[Chat] LocalStorage empty, asking backend for active session...`,
          );
          const activeData: any = await fetchApi(`/chat/sessions/active/${id}`);

          if (activeData.success && activeData.data?.session_id) {
            sid = activeData.data.session_id;
            console.log(`[Chat] Backend returned active session: ${sid}`);
            sessionStorage.setItem(`mindex_session_${id}`, sid!);
          } else {
            console.log(`[Chat] No active session found on backend.`);
          }
        }

        if (isMounted && sid) {
          setSessionId(sid);
          console.log(`[Chat] Fetching messages for session: ${sid}...`);

          const msgData: any = await fetchApi(
            `/chat/sessions/${sid}/messages?limit=30&skip=0`,
          );

          if (isMounted && msgData.success && msgData.data.messages) {
            setMessages(msgData.data.messages);
            setHasMore(msgData.data.has_more ?? false);
            setHistorySkip(msgData.data.messages.length);
            console.log(
              `✅ [Chat] Đã khôi phục ${msgData.data.messages.length} tin nhắn (has_more=${msgData.data.has_more}).`,
            );
          } else if (isMounted) {
            console.log(
              `⚠️ [Chat] Phiên chat tồn tại nhưng không có tin nhắn hoặc lỗi format.`,
            );
          }
        } else if (isMounted) {
          console.log(`ℹ️ [Chat] Không có phiên chat cũ cho tài liệu này.`);
        }
      } catch (err) {
        console.error("❌ Failed to restore session:", err);
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [id, setMessages, setSessionId, clearChat]);

  const getViewport = useCallback(
    () =>
      scrollRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement | null,
    [],
  );

  const loadMoreHistory = useCallback(async () => {
    if (!sessionId || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const viewport = getViewport();
    const heightBefore = viewport?.scrollHeight ?? 0;
    try {
      const data: any = await fetchApi(
        `/chat/sessions/${sessionId}/messages?limit=30&skip=${historySkip}`,
      );
      if (data.success && data.data.messages?.length > 0) {
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
      console.error("[Chat] Load more history failed:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    sessionId,
    hasMore,
    isLoadingMore,
    historySkip,
    messages,
    getViewport,
    setMessages,
  ]);

  const replaceMessageInStore = useCallback(
    (nextMessage: StoreChatMessage) => {
      const currentMessages = useChatStore.getState().messages;
      setMessages(
        currentMessages.map((msg) =>
          msg.id === nextMessage.id ? nextMessage : msg,
        ),
      );
    },
    [setMessages],
  );

  const mutateSessionMessage = useCallback(
    async (messageId: string, action: "delete" | "restore") => {
      if (!sessionId || messageActionId) return;

      setMessageActionId(messageId);
      try {
        const endpoint =
          action === "delete"
            ? `/chat/sessions/${sessionId}/messages/${messageId}`
            : `/chat/sessions/${sessionId}/messages/${messageId}/restore`;

        const data: any = await fetchApi(endpoint, {
          method: action === "delete" ? "DELETE" : "POST",
        });

        if (!data?.success || !data?.data?.message) {
          throw new Error("MESSAGE_MUTATION_FAILED");
        }

        replaceMessageInStore(data.data.message as StoreChatMessage);
        toast.success(
          action === "delete"
            ? "Đã ẩn tin nhắn khỏi lịch sử chat"
            : "Đã khôi phục tin nhắn",
        );
      } catch (err) {
        console.error("[Chat] Message mutation failed:", err);
        toast.error(
          action === "delete"
            ? "Không thể xóa tin nhắn"
            : "Không thể khôi phục tin nhắn",
        );
      } finally {
        setMessageActionId(null);
      }
    },
    [messageActionId, replaceMessageInStore, sessionId],
  );

  // Scroll-up listener để trigger load more
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;
    const handle = () => {
      if (viewport.scrollTop < 150 && hasMore && !isLoadingMore) {
        loadMoreHistory();
      }
    };
    viewport.addEventListener("scroll", handle, { passive: true });
    return () => viewport.removeEventListener("scroll", handle);
  }, [hasMore, isLoadingMore, loadMoreHistory, getViewport]);

  const handleTogglePin = async () => {
    if (isPinning || !doc) return;

    setIsPinning(true);
    try {
      await fetchApi(`/documents/${id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !doc.pinned }),
      });
      mutate(`/documents/${id}`);
      mutate("/documents"); // Cập nhật cả sidebar
      mutate("/auth/me"); // Refresh global quota
      toast.success(
        doc.pinned ? "Đã bỏ ghim tài liệu" : "Đã ghim tài liệu thành công",
      );
    } catch (error: any) {
      if (error.data?.error === "PIN_QUOTA_EXCEEDED") {
        toast.error("Vượt quá giới hạn!", {
          description:
            "Bạn chỉ được ghim tối đa 3 tài liệu. Hãy bỏ ghim tài liệu cũ.",
        });
      } else {
        toast.error("Không thể thực hiện ghim tài liệu");
      }
    } finally {
      setIsPinning(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !doc) return;

    confirm({
      title: "Xóa tài liệu",
      message:
        "Bạn có chắc chắn muốn xóa tài liệu này và toàn bộ lịch sử chat liên quan? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa ngay",
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await fetchApi(`/documents/${id}`, {
            method: "DELETE",
          });
          toast.success("Đã xóa tài liệu thành công");
          mutate("/documents");
          mutate("/auth/me"); // Refresh global quota
          router.push("/library");
        } catch (error: any) {
          toast.error("Không thể xóa tài liệu");
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const { data: docsList } = useSWR("/documents", fetcher, {
    refreshInterval: 15000, // Tăng interval một chút
  });
  const allDocs = (docsList as any)?.data || [];

  const filteredDocs = useMemo(() => {
    return allDocs.filter((d: any) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [allDocs, searchTerm]);

  // 3. Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, currentStreamText]);

  if (docError)
    return (
      <div className="flex h-screen items-center justify-center bg-background text-red-500 font-black">
        SYNC_ERROR
      </div>
    );
  if (!doc)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin mb-4" />
        <span className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase">
          Initializing Neural Link
        </span>
      </div>
    );

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-row p-0 md:p-6 gap-0 md:gap-6">
      {/* 1. SIDEBAR TRÁI — Dual Mode (Inbox ↔ Document) */}
      <aside className="hidden md:flex w-[340px] h-full flex-col bg-card/80 backdrop-blur-3xl rounded-[32px] border border-border shadow-xl overflow-hidden flex-shrink-0 z-50 animate-in slide-in-from-left duration-700">

        {/* ── Top tab bar ─────────────────────────────── */}
        <div className="px-5 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-2xl border border-border/40">
            <button
              onClick={() => setSidebarMode("inbox")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200",
                sidebarMode === "inbox"
                  ? "bg-background text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground/60 hover:text-muted-foreground",
              )}
            >
              <Inbox size={12} />
              Inbox
            </button>
            <button
              onClick={() => setSidebarMode("document")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200",
                sidebarMode === "document"
                  ? "bg-background text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground/60 hover:text-muted-foreground",
              )}
            >
              <BookOpen size={12} />
              Tài liệu
            </button>
          </div>
        </div>

        {/* ── INBOX MODE ──────────────────────────────── */}
        {sidebarMode === "inbox" && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col flex-1 min-h-0 px-5 pt-5 pb-4"
          >
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-black tracking-tight text-foreground flex items-center gap-2">
                Inbox
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/upload")}
              >
                <Plus size={16} />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Tìm tài liệu..."
                className="h-9 bg-muted/30 border-border/50 pl-8 text-[12px] rounded-xl focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Study Hub */}
            <StudyHubWidget docId={id} open={studyHubOpen} onOpenChange={setStudyHubOpen} />

            {/* Document list */}
            {!studyHubOpen && (
              <>
                {/* Section label */}
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/40 mb-2 px-1">
                  Tài liệu của bạn
                </p>
                <ScrollArea className="flex-1 -mx-1 px-1 min-h-0">
                  <div className="space-y-1.5 pb-2">
                    {filteredDocs.length === 0 ? (
                      <div className="py-10 text-center">
                        <FileText size={22} className="mx-auto text-muted-foreground/20 mb-2" />
                        <p className="text-[10px] font-bold text-muted-foreground/35 uppercase">Trống</p>
                      </div>
                    ) : (
                      [...filteredDocs]
                        .sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                        .map((item: any) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 3 }}
                            onClick={() => router.push(`/doc/${item.id}/chat`)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-all border relative group",
                              item.id === id
                                ? "bg-primary/10 border-primary/20"
                                : "bg-transparent border-transparent hover:bg-muted/40 hover:border-border/40",
                            )}
                          >
                            {/* Status dot */}
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full flex-shrink-0",
                              item.status === "ready" ? "bg-emerald-500" : "bg-muted-foreground/30 animate-pulse",
                            )} />

                            {/* Title */}
                            <h4 className={cn(
                              "flex-1 text-[12.5px] font-semibold truncate leading-none",
                              item.id === id ? "text-primary" : "text-foreground/75 group-hover:text-foreground",
                            )}>
                              {item.title}
                            </h4>

                            {/* Right meta */}
                            <div className="flex-shrink-0 flex items-center gap-1.5">
                              {item.pinned ? (
                                <span className="text-amber-500">
                                  <Star size={10} fill="currentColor" />
                                </span>
                              ) : item.expired_at ? (
                                <span className="text-[9px] font-bold text-muted-foreground/40 tabular-nums">
                                  {(() => {
                                    const diff = new Date(item.expired_at).getTime() - Date.now();
                                    if (diff <= 0) return "Hết hạn";
                                    const h = Math.floor(diff / (1000 * 60 * 60));
                                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                    return `${h}h${m}m`;
                                  })()}
                                </span>
                              ) : null}
                              {item.id === id && (
                                <motion.div layoutId="active-indicator">
                                  <ChevronRight size={12} className="text-primary" />
                                </motion.div>
                              )}
                            </div>

                            {item.pinned && (
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-amber-400 rounded-full" />
                            )}
                          </motion.div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}

            {/* Add to collection */}
            <Button
              variant="outline"
              onClick={() => setIsCollectionModalOpen(true)}
              className="mt-3 w-full border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-2xl h-9 text-[11px] font-bold gap-1.5"
            >
              <Plus size={13} /> Thêm vào bộ tài liệu
            </Button>

            {/* Neural Core widget — compact footer */}
            <div
              onClick={() => router.push(`/doc/${id}${NEURAL_CORES[currentCoreIndex].path}`)}
              className="mt-3 flex items-center gap-3 px-3.5 py-3 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 hover:border-primary/25 cursor-pointer transition-all duration-200 group/neural"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles size={12} className="text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-primary/70 mb-0.5">
                  Neural Core
                </p>
                <div className="flex items-center gap-1 h-3.5 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentCoreIndex}
                      initial={{ y: -12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 12, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="text-[10px] font-black text-primary uppercase tracking-wider group-hover/neural:translate-x-0.5 transition-transform inline-block"
                    >
                      {NEURAL_CORES[currentCoreIndex].label}
                    </motion.span>
                  </AnimatePresence>
                  <ArrowRight size={9} className="text-primary flex-shrink-0" />
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <div className="w-1 h-1 rounded-full bg-primary/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DOCUMENT MODE ───────────────────────────── */}
        {sidebarMode === "document" && (
          <motion.div
            key="document"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 min-h-0 px-5 pt-5 pb-4"
          >
            <DocContentViewer docId={id} />
          </motion.div>
        )}
      </aside>

      {/* 2. VÙNG TRUNG TÂM — Full Chat (không còn split PDF) */}
      <main className="flex-1 h-full bg-background md:rounded-[40px] md:border border-border flex flex-col relative overflow-hidden items-center shadow-sm min-w-0">
        {/* Header */}
        <div className="w-full h-16 md:h-20 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-center px-4 md:px-8 z-50">
          <div className="w-full max-w-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/library")}
                className="md:hidden text-muted-foreground hover:text-foreground p-1"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <FileText
                    size={16}
                    className="text-muted-foreground hidden md:block"
                  />
                  <h3 className="text-[14px] font-extrabold text-foreground tracking-tight truncate max-w-[200px] md:max-w-[400px]">
                    {doc.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground/50 tracking-wider">
                    BY MINDEX INTELLIGENCE ENGINE
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-1.5 py-0 text-[7px] font-black bg-muted/40 border-border uppercase",
                      isExpired
                        ? "text-red-500 border-red-500/20"
                        : "text-muted-foreground",
                    )}
                  >
                    {isExpired ? "EXPIRED" : doc.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden md:block">
                <NotificationBell />
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-muted-foreground">
                <button
                  onClick={handleTogglePin}
                  disabled={isPinning}
                  className={`p-1.5 rounded-md transition-all relative z-30 ${
                    doc.pinned
                      ? "text-amber-500 bg-amber-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {isPinning ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Star
                      size={16}
                      fill={doc.pinned ? "currentColor" : "none"}
                    />
                  )}
                </button>
                <button
                  onClick={() => setIsShareDialogOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vùng Chat chính */}
        <div className="flex-1 w-full relative overflow-hidden" ref={scrollRef}>
          <ScrollArea className="h-full w-full">
            <div className="w-full max-w-3xl px-6 pt-12 pb-44 mx-auto">
              {/* Fork Banner */}
              {forkId && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <GitFork size={14} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-purple-600 dark:text-purple-300 uppercase tracking-wider mb-0.5">
                      Phiên Fork
                    </p>
                    <p className="text-[12px] text-muted-foreground font-medium">
                      Bạn đang kế thừa ngữ cảnh từ một hội thoại được chia sẻ.
                      AI đã được cung cấp tóm tắt để hỗ trợ bạn tốt hơn.
                    </p>
                  </div>
                </motion.div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-1000">
                  <div className="w-20 h-20 bg-muted border border-border rounded-[32px] flex items-center justify-center mb-10 shadow-sm">
                    <Zap size={32} className="text-primary fill-primary" />
                  </div>
                  <h3 className="text-[24px] font-black text-foreground mb-2 tracking-tighter uppercase">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.3em] mb-12 opacity-60">
                    Ready for deep analysis &amp; contextual chat
                  </p>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                    {[
                      "Tóm tắt nhanh",
                      "Trích xuất ý",
                      "Câu hỏi ôn tập",
                      "Dịch sang Tiếng Anh",
                    ].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => handleSendMessage(hint)}
                        className="flex items-center justify-between px-5 py-4 bg-muted/30 border border-border hover:border-primary/40 hover:bg-primary/5 rounded-2xl transition-all group"
                      >
                        <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                          {hint}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-muted-foreground/40 group-hover:text-primary transition-all group-hover:translate-x-1"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Load more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-3">
                  <Loader2
                    size={16}
                    className="animate-spin text-muted-foreground"
                  />
                </div>
              )}
              {!hasMore && messages.length >= 30 && (
                <p className="text-center text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest py-2">
                  Đã hiển thị toàn bộ lịch sử
                </p>
              )}

              <div className="space-y-12">
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} data-user-message="true">
                      <ChatMessage
                        message={msg}
                        onDelete={
                          sessionId
                            ? () => mutateSessionMessage(msg.id, "delete")
                            : undefined
                        }
                        onRestore={
                          sessionId && msg.is_deleted
                            ? () => mutateSessionMessage(msg.id, "restore")
                            : undefined
                        }
                        actionPending={messageActionId === msg.id}
                        deleteIconOnly={true}
                      />
                    </div>
                  ) : (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onDelete={
                        sessionId
                          ? () => mutateSessionMessage(msg.id, "delete")
                          : undefined
                      }
                      onRestore={
                        sessionId && msg.is_deleted
                          ? () => mutateSessionMessage(msg.id, "restore")
                          : undefined
                      }
                      actionPending={messageActionId === msg.id}
                      deleteIconOnly={true}
                    />
                  ),
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

          {/* Input area */}
          <div className="w-full max-w-3xl absolute bottom-0 left-1/2 -translate-x-1/2 px-4 md:px-6 py-2 md:py-3 pb-[env(safe-area-inset-bottom,4px)] md:pb-3 bg-gradient-to-t from-background via-background/95 to-transparent pt-20 z-40 pointer-events-none">
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl md:rounded-[28px] border border-border p-1 shadow-md pointer-events-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isStreaming || isExpired}
                isLoading={isStreaming}
                allowImageAttachments
                targetId={id}
                sessionId={sessionId}
                onSessionReady={handleAttachmentSessionReady}
                placeholder={isExpired ? "Tài liệu này đã hết hạn" : undefined}
              />
            </div>
          </div>
        </div>
      </main>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        documentId={id}
        documentTitle={doc.title}
        initialIsPublic={doc.is_public || false}
        onStatusUpdate={(newStatus) => {
          mutate(`/documents/${id}`);
          mutate("/documents");
        }}
        sessionId={sessionId}
        documentExpiredAt={doc.expired_at || null}
      />
      <CreateCollectionModal
        open={isCollectionModalOpen}
        onOpenChange={setIsCollectionModalOpen}
        defaultDocId={id}
        onSuccess={() => {
          mutate("/collections");
          toast.success("Đã cập nhật bộ tài liệu");
        }}
        // Truyền initial document nếu muốn tự động tích chọn doc này
        // (Cần cập nhật CreateCollectionModal nếu muốn docId truyền vào tự được tích)
      />
    </div>
  );
}
