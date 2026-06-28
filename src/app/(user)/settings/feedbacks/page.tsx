"use client";

import { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { MessageSquare, Plus, Send, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import NewFeedbackDialog from "@/components/settings/NewFeedbackDialog";
import EmailComposer from "@/components/settings/EmailComposer";
import { API_BASE_URL, WS_FEEDBACK_URL } from "@/lib/api";

interface FeedbackSession {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message: string;
  last_message_at: string;
  admin_id: string | null;
}

interface FeedbackMessage {
  id: string;
  sender_id: string;
  role: string;
  content: string;
  created_at: string;
  sender_name: string;
}

export default function FeedbacksPage() {
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_FEEDBACK_URL, {
    shouldReconnect: () => true,
    onOpen: () => console.log("WS Connected"),
  });

  useEffect(() => {
    if (lastJsonMessage && (lastJsonMessage as any).type === "chat") {
      const msg = (lastJsonMessage as any).payload;
      const sessionId = (lastJsonMessage as any).session_id;

      if (sessionId === selectedSessionId) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender_id: msg.sender_id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
            sender_name: msg.role === "admin" ? "Hỗ trợ viên" : "Bạn",
          },
        ]);
      }

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, last_message: msg.content, last_message_at: msg.created_at } : s))
      );
    } else if (lastJsonMessage && (lastJsonMessage as any).type === "new_session") {
      fetchSessions();
    }
  }, [lastJsonMessage, selectedSessionId]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/sessions`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setSessions(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/sessions/${sid}/messages`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setMessages(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) fetchMessages(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedSessionId) return;

    sendJsonMessage({
      type: "chat",
      session_id: selectedSessionId,
      content: inputMessage,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        sender_id: "me",
        role: "user",
        content: inputMessage,
        created_at: new Date().toISOString(),
        sender_name: "Bạn",
      },
    ]);

    setInputMessage("");
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex h-full max-h-[calc(100vh-200px)] flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <MessageSquare className="text-primary" />
            Ý kiến đóng góp
            <Tooltip>
              <TooltipTrigger
                  onClick={() => setIsEmailMode(true)}
                  className={cn(
                    "ml-1 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                    isEmailMode
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-primary"
                  )}
                >
                  <RefreshCw size={18} className={isEmailMode ? "animate-spin" : ""} />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Gửi email ngay !
              </TooltipContent>
            </Tooltip>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Gửi phản hồi cho chúng tôi để cải thiện sản phẩm.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 rounded-xl">
          <Plus size={18} />
          Góp ý mới
        </Button>
      </div>

      <div className="grid min-h-[500px] flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-12">
        <div className="flex h-full flex-col md:col-span-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-card/80 py-10 text-center text-muted-foreground">
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có góp ý nào</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setIsEmailMode(false);
                    }}
                    className={cn(
                      "group relative w-full rounded-2xl border p-4 text-left transition-all",
                      selectedSessionId === session.id
                        ? "border-primary/20 bg-primary/10 shadow-sm"
                        : "border-border/70 bg-card/80 hover:bg-accent/40 hover:border-primary/20"
                    )}
                  >
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className="line-clamp-1 text-sm font-bold text-foreground">{session.subject}</span>
                      <Badge
                        className={cn(
                          "h-4 border-none px-1.5 py-0 text-[10px]",
                          session.status === "open" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {session.status === "open" ? "Đang mở" : "Đã đóng"}
                      </Badge>
                    </div>
                    <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{session.last_message || "Chưa có tin nhắn"}</p>
                    <div className="flex items-center text-[10px] text-muted-foreground">
                      <Clock size={10} className="mr-1" />
                      {session.last_message_at ? format(new Date(session.last_message_at), "HH:mm dd/MM", { locale: vi }) : "N/A"}
                    </div>
                    {selectedSessionId === session.id && <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <AnimatePresence mode="wait">
          {isEmailMode ? (
            <EmailComposer key="email" onBack={() => setIsEmailMode(false)} />
          ) : (
            <div key="chat" className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/90 backdrop-blur md:col-span-8">
              {selectedSessionId ? (
                <>
                  <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 p-4">
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-foreground">{selectedSession?.subject}</h3>
                      <p className="text-[11px] text-muted-foreground">ID: {selectedSessionId.split("-")[0]}...</p>
                    </div>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Hỗ trợ viên: {selectedSession?.admin_id ? "Đã nhận" : "Đang chờ..."}
                    </Badge>
                  </div>

                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6">
                      {messages.map((msg, i) => {
                        const isMe = msg.role === "user";
                        return (
                          <div key={msg.id || i} className={cn("flex max-w-[80%] flex-col", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className="mb-1 flex items-center gap-2 px-1">
                              <span className="text-[10px] font-medium text-muted-foreground">{isMe ? "Bạn" : "Hỗ trợ viên"}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
                            </div>
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                isMe
                                  ? "rounded-tr-none bg-primary text-primary-foreground shadow-sm"
                                  : "rounded-tl-none border border-border/70 bg-background text-foreground"
                              )}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="border-t border-border/70 bg-muted/30 p-4">
                    <div className="relative flex gap-2">
                      <Input
                        placeholder="Nhập phản hồi..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="h-12 rounded-xl border-border bg-background pr-12"
                      />
                      <Button onClick={handleSendMessage} size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-lg">
                        <Send size={18} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare size={40} className="text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">Trung tâm phản hồi</h3>
                  <p className="max-w-sm text-muted-foreground">
                    Chọn một cuộc hội thoại bên trái hoặc tạo mới để bắt đầu trao đổi với ban quản trị.
                  </p>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      <NewFeedbackDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchSessions} />
    </div>
  );
}
