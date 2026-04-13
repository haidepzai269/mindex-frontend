"use client";

import { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { MessageSquare, Plus, Send, Clock, User, CheckCircle2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import NewFeedbackDialog from "@/components/settings/NewFeedbackDialog";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/v1/ws/feedback";

export default function FeedbacksPage() {
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = Cookies.get("access_token");

  // WebSocket Setup
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    WS_BASE_URL,
    {
      shouldReconnect: () => true,
      onOpen: () => console.log("WS Connected"),
    }
  );

  // Xử lý tin nhắn realtime tới
  useEffect(() => {
    if (lastJsonMessage && (lastJsonMessage as any).type === "chat") {
      const msg = (lastJsonMessage as any).payload;
      const sessionId = (lastJsonMessage as any).session_id;

      if (sessionId === selectedSessionId) {
        setMessages((prev) => [...prev, {
          id: Math.random().toString(), // Tạm thời
          sender_id: msg.sender_id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          sender_name: msg.role === "admin" ? "Hỗ trợ viên" : "Bạn"
        }]);
      }

      // Cập nhật lại last_message trong danh sách session
      setSessions((prev) => prev.map(s => 
        s.id === sessionId 
          ? { ...s, last_message: msg.content, last_message_at: msg.created_at }
          : s
      ));
    } else if (lastJsonMessage && (lastJsonMessage as any).type === "new_session") {
        fetchSessions();
    }
  }, [lastJsonMessage, selectedSessionId]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/sessions`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setSessions(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/sessions/${sid}/messages`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) setMessages(data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchMessages(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedSessionId) return;

    sendJsonMessage({
      type: "chat",
      session_id: selectedSessionId,
      content: inputMessage
    });

    // Optimistic UI update
    setMessages((prev) => [...prev, {
      id: "temp-" + Date.now(),
      sender_id: "me",
      role: "user",
      content: inputMessage,
      created_at: new Date().toISOString(),
      sender_name: "Bạn"
    }]);

    setInputMessage("");
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-primary" />
            Ý kiến đóng góp
          </h2>
          <p className="text-white/50 text-sm mt-1">Gửi phản hồi cho chúng tôi để cải thiện sản phẩm.</p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:bg-primary/80 text-white rounded-xl gap-2 shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Góp ý mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-[500px]">
        {/* Session List */}
        <div className="md:col-span-4 flex flex-col h-full">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-10 text-white/20 border border-white/5 rounded-2xl bg-white/[0.02]">
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Chưa có góp ý nào</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all relative group",
                      selectedSessionId === session.id
                        ? "bg-white/10 border-white/20 shadow-xl"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-sm line-clamp-1">{session.subject}</span>
                      <Badge className={cn(
                        "text-[10px] px-1.5 py-0 h-4 border-none",
                        session.status === "open" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
                      )}>
                        {session.status === "open" ? "Đang mở" : "Đã đóng"}
                      </Badge>
                    </div>
                    <p className="text-white/40 text-xs line-clamp-1 mb-2">
                       {session.last_message || "Chưa có tin nhắn"}
                    </p>
                    <div className="flex items-center text-[10px] text-white/20">
                      <Clock size={10} className="mr-1" />
                      {session.last_message_at ? format(new Date(session.last_message_at), "HH:mm dd/MM", { locale: vi }) : "N/A"}
                    </div>
                    {selectedSessionId === session.id && (
                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-8 flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
          {selectedSessionId ? (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                 <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                       {selectedSession?.subject}
                    </h3>
                    <p className="text-[11px] text-white/40">ID: {selectedSessionId.split("-")[0]}...</p>
                 </div>
                 <Badge variant="outline" className="border-white/10 text-white/60">
                    Hỗ trợ viên: {selectedSession?.admin_id ? "Đã nhận" : "Đang chờ..."}
                 </Badge>
              </div>

              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="space-y-6">
                  {messages.map((msg, i) => {
                    const isMe = msg.role === "user";
                    return (
                      <div key={msg.id || i} className={cn(
                        "flex flex-col max-w-[80%]",
                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                           <span className="text-[10px] font-medium text-white/40">{isMe ? "Bạn" : "Hỗ trợ viên"}</span>
                           <span className="text-[10px] text-white/20">{format(new Date(msg.created_at), "HH:mm")}</span>
                        </div>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isMe 
                            ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10" 
                            : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/5 bg-white/[0.03] backdrop-blur-xl">
                 <div className="flex gap-2 relative">
                    <Input 
                      placeholder="Nhập phản hồi..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="bg-black/20 border-white/10 pr-12 focus:border-primary/50 transition-all rounded-xl h-12"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      size="icon"
                      className="absolute right-1 top-1 h-10 w-10 bg-primary hover:bg-primary/80 rounded-lg"
                    >
                      <Send size={18} />
                    </Button>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <MessageSquare size={40} className="text-primary" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Trung tâm phản hồi</h3>
               <p className="text-white/40 max-w-sm">Chọn một cuộc hội thoại bên trái hoặc tạo mới để bắt đầu trao đổi với ban quản trị.</p>
            </div>
          )}
        </div>
      </div>

      <NewFeedbackDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={fetchSessions}
      />
    </div>
  );
}
