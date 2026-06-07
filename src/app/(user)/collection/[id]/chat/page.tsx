"use client";

import { use, useCallback, useEffect, useState, useRef, useMemo } from "react";
import { 
  FileText, 
  Star, 
  Trash2, 
  Clock, 
  Zap, 
  Tag, 
  Loader2, 
  ChevronRight,
  Folder,
  AlertTriangle,
  Info,
  Layers,
  Search,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "@/components/user/ChatMessage";
import { ChatInput } from "@/components/user/ChatInput";
import { useChatStore, type ChatMessage as StoreChatMessage } from "@/store/useChatStore";
import { useChatSSE } from "@/hooks/useChatSSE";
import { CreateCollectionModal } from "@/components/user/CreateCollectionModal";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useConfirmStore } from "@/store/useConfirmStore";

export default function CollectionChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historySkip, setHistorySkip] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { mutate } = useSWRConfig();
  
  const { 
    messages, 
    isStreaming, 
    currentStreamText, 
    setMessages, 
    setSessionId, 
    clearChat, 
    sessionId 
  } = useChatStore();
  
  const { sendMessage, error: sseError } = useChatSSE();
  const confirm = useConfirmStore((state) => state.confirm);

  const { data: colData, error: colError, isLoading: colLoading } = useSWR<{ success: boolean; data: any }>(
    id ? `/collections/${id}` : null, 
    fetcher as any
  );
  
  const collection = colData?.data;

  // 1. Phục hồi lịch sử chat
  useEffect(() => {
    let isMounted = true;
    clearChat();
    setSessionId(null);
    setHasMore(false);
    setHistorySkip(0);

    async function restoreSession() {
      if (!id) return;
      try {
        const sid = localStorage.getItem(`mindex_col_session_${id}`);
        if (isMounted && sid) {
          setSessionId(sid);
          const msgData: any = await fetchApi(`/chat/sessions/${sid}/messages?limit=30&skip=0`);
          if (isMounted && msgData.success && msgData.data.messages) {
            setMessages(msgData.data.messages);
            setHasMore(msgData.data.has_more ?? false);
            setHistorySkip(msgData.data.messages.length);
          }
        }
      } catch (err) {
        console.error("Failed to restore collection session:", err);
      }
    }

    restoreSession();
    return () => { isMounted = false; };
  }, [id, setMessages, setSessionId, clearChat]);

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
      const data: any = await fetchApi(`/chat/sessions/${sessionId}/messages?limit=30&skip=${historySkip}`);
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
      console.error("[Collection] Load more history failed:", err);
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

  // 2. Xử lý gửi tin
  const handleSendMessage = (q: string, model: string = "Mindex-1", thinking: boolean = false) => {
    if (!collection || collection.doc_count === 0) {
      toast.error("Bộ tài liệu trống. Vui lòng thêm tài liệu trước khi chat.");
      return;
    }
    sendMessage(id, q, undefined, true, model, thinking);
  };

  // 3. Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
        // Cập nhật selector khớp với data-slot trong component ScrollArea (Base UI)
        const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, currentStreamText]);

  // Group sources by document title for the right panel
  const lastMessageSources = useMemo(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.sources) return null;
    
    const grouped: Record<string, any[]> = {};
    lastMsg.sources.forEach(src => {
        const title = src.type === "web" ? "Web Search" : src.doc_title || "Unknown Document";
        if (!grouped[title]) grouped[title] = [];
        grouped[title].push(src);
    });
    return grouped;
  }, [messages]);

  if (colError) return <div className="flex h-screen items-center justify-center bg-background text-red-500 font-black">COLLECTION_SYNC_ERROR</div>;
  if (!collection) return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin mb-4" />
        <span className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase">Syncing Knowledge Cluster</span>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-row p-6 gap-6">

      {/* PANEL 1: COLLECTION INFO (LEFT) */}
      <aside className="w-[280px] h-full flex flex-col bg-card/80 backdrop-blur-3xl rounded-[32px] border border-border shadow-xl overflow-hidden flex-shrink-0 z-50 animate-in slide-in-from-left duration-700">
        <div className="p-6 flex flex-col h-full min-h-0">
            <button
                onClick={() => router.push('/library')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm font-bold uppercase tracking-wider"
            >
                <ChevronLeft size={16} /> Thư viện
            </button>

            <div className="mb-8">
                <div className="text-4xl mb-4">{collection.emoji}</div>
                <h2 className="text-xl font-black tracking-tight text-foreground leading-tight mb-2">
                    {collection.name}
                </h2>
                <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                    {collection.description || "Học tập và nghiên cứu tổng hợp."}
                </p>
            </div>

            <Separator className="bg-border/50 mb-6" />

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="text-[10px] font-black text-primary tracking-[0.2em] uppercase flex items-center gap-2">
                        <Layers size={12} />
                        {collection.doc_count} Tài liệu
                    </h4>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-2 min-h-0">
                    <div className="space-y-2">
                        {collection.documents?.map((doc: any) => (
                            <div
                                key={doc.id}
                                className="p-3 bg-muted/20 border border-border/50 rounded-2xl flex items-center gap-3 group hover:bg-accent/40 transition-all cursor-pointer"
                                onClick={() => router.push(`/doc/${doc.id}/chat`)}
                            >
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:border-primary/30 transition-all text-primary">
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-muted-foreground truncate group-hover:text-foreground">{doc.title}</p>
                                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 font-black tracking-tighter">
                                        {doc.status.toUpperCase()} • P{doc.chunk_count}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    className="mt-6 w-full border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent rounded-2xl h-10 text-xs font-bold"
                >
                    Quản lý tài liệu
                </Button>
            </div>
        </div>
      </aside>

      <CreateCollectionModal 
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
        }}
        collection={collection}
        onSuccess={() => {
          mutate(`/collections/${id}`);
        }}
      />

      {/* PANEL 2: CHAT AREA (MIDDLE) */}
      <main className="flex-1 h-full bg-background rounded-[40px] border border-border flex flex-col relative overflow-hidden items-center shadow-sm">
          <div className="w-full h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-center px-8 z-50">
              <div className="w-full max-w-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Zap size={14} className="text-primary" />
                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                        Neural Hub / Multi-Source Chat
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase">Active Cluster</Badge>
                </div>
              </div>
          </div>

          <ScrollArea className="flex-1 w-full min-h-0" ref={scrollRef}>
              <div className="w-full max-w-2xl px-6 pt-12 pb-44 mx-auto">

                  {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-16 h-16 bg-primary-gradient rounded-[28px] flex items-center justify-center mb-8 shadow-xl rotate-3">
                              <Layers size={32} className="text-primary-foreground" />
                          </div>
                          <h3 className="text-2xl font-black text-foreground mb-3">Sẵn sàng để tổng hợp!</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-10">
                              Mindex AI sẽ kết nối tri thức từ toàn bộ {collection.doc_count} tài liệu trong bộ này để đưa ra câu trả lời toàn diện nhất.
                          </p>

                          <div className="flex flex-wrap justify-center gap-3">
                              {["Điểm chung là gì?", "So sánh các nguồn", "Tổng hợp kiến thức", "Check mâu thuẫn"].map(hint => (
                                  <Button
                                    key={hint}
                                    variant="outline"
                                    onClick={() => handleSendMessage(hint)}
                                    className="h-10 px-6 rounded-full border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/20 text-xs font-bold tracking-tight uppercase"
                                  >
                                      {hint}
                                  </Button>
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

                  <div className="space-y-12">
                      {messages.map((msg) => (
                          <ChatMessage key={msg.id} message={msg} />
                      ))}

                      {isStreaming && (
                          <ChatMessage
                              message={{
                                  id: "streaming",
                                  role: "assistant",
                                  content: currentStreamText,
                                  timestamp: new Date().toISOString()
                              }}
                              isStreaming={true}
                          />
                      )}
                  </div>
              </div>
          </ScrollArea>

          <div className="w-full max-w-2xl absolute bottom-0 left-1/2 -translate-x-1/2 px-6 py-8 bg-gradient-to-t from-background via-background/95 to-transparent pt-20 z-40 pointer-events-none">
              <div className="bg-card/80 backdrop-blur-xl rounded-[28px] border border-border p-1 shadow-md pointer-events-auto">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isStreaming}
                    isLoading={isStreaming}
                />
              </div>
          </div>
      </main>

      {/* PANEL 3: SOURCES PANEL (RIGHT) */}
      <aside className="w-[320px] h-full flex flex-col bg-card/50 backdrop-blur-2xl rounded-[32px] border border-border shadow-xl overflow-hidden flex-shrink-0 z-50 animate-in slide-in-from-right duration-700">
        <div className="p-6 flex flex-col h-full">
            <h4 className="text-[10px] font-black text-foreground tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                <Search size={14} className="text-primary" />
                Dữ liệu trích dẫn
            </h4>

            <ScrollArea className="flex-1 -mx-2 px-2 min-h-0">
                {!lastMessageSources ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4 opacity-40">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border">
                            <Info size={24} />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chưa có trích dẫn nào được sử dụng trong phiên này</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-10">
                        {Object.entries(lastMessageSources).map(([title, srcs]: [string, any[]]) => (
                            <div key={title} className="space-y-4">
                                <div className="flex items-center gap-2 group cursor-pointer">
                                    <div className="p-1 rounded bg-primary/20 border border-primary/30">
                                        <FileText size={10} className="text-primary" />
                                    </div>
                                    <span className="text-[11px] font-black text-muted-foreground truncate uppercase tracking-tighter group-hover:text-foreground transition-colors">
                                        {title}
                                    </span>
                                </div>
                                <div className="space-y-3 pl-2 border-l border-border/50 ml-2">
                                    {srcs.map((src, idx) => {
                                      const isWebSource = src.type === "web";
                                      const score = src.similarity ?? src.score ?? 0;

                                      return (
                                        <div key={idx} className="p-4 bg-muted/20 border border-border/50 rounded-2xl hover:bg-accent/30 transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 h-5">
                                                  {isWebSource ? "WEB" : `P${src.page ?? src.page_number ?? "-"}`}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                                                  {isWebSource ? src.provider || "web" : `${Math.round(score * 100)}% Match`}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed italic">
                                                "{src.content}"
                                            </p>
                                            {isWebSource && src.url && (
                                              <a
                                                href={src.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/80"
                                              >
                                                Mở nguồn
                                              </a>
                                            )}
                                        </div>
                                      );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                    <Zap size={12} className="text-primary fill-primary" />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-tighter">AI Consensus</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    AI đang tự động đối chiếu thông tin giữa các nguồn để cung cấp kết quả đáng tin cậy nhất.
                </p>
            </div>
        </div>
      </aside>
    </div>
  );
}
