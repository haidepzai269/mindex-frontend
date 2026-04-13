"use client";

import { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Search, 
  Clock, 
  User, 
  MoreVertical, 
  RefreshCcw,
  Star,
  CornerUpLeft,
  CornerUpRight,
  ArrowRight,
  Mail,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface FeedbackSession {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string;
  status: string;
  created_at: string;
  user_name: string;
  avatar_url: string;
  last_message: string;
  last_message_at: string;
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

export default function AdminFeedbacksPage() {
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = Cookies.get("access_token");

  // WebSocket Setup
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    WS_BASE_URL,
    {
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (lastJsonMessage && (lastJsonMessage as any).type === "chat") {
      const msg = (lastJsonMessage as any).payload;
      const sessionId = (lastJsonMessage as any).session_id;

      if (sessionId === selectedId) {
        setMessages((prev) => [...prev, {
          id: Math.random().toString(),
          sender_id: msg.sender_id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          sender_name: msg.role === "admin" ? "Hệ thống" : "Người dùng"
        }]);
      }

      setSessions((prev) => prev.map(s => 
        s.id === sessionId 
          ? { ...s, last_message: msg.content, last_message_at: msg.created_at }
          : s
      ));
    } else if (lastJsonMessage && (lastJsonMessage as any).type === "new_session") {
        fetchSessions();
    }
  }, [lastJsonMessage, selectedId]);

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
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId]);

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedId) return;

    sendJsonMessage({
      type: "chat",
      session_id: selectedId,
      content: replyText
    });

    setReplyText("");
  };

  const filteredSessions = sessions.filter(s => 
    s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSession = sessions.find(s => s.id === selectedId);

  return (
    <div className="h-[calc(100vh-140px)] border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-2xl flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1" {...({} as any)}>
        {/* Sidebar Mini */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={20} className="border-r border-white/10 bg-[#080808]">
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 px-2 py-4 mb-4">
               <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-lg italic">M</div>
               <span className="font-bold text-sm tracking-widest uppercase">Admin Feed</span>
            </div>
            <div className="space-y-1">
              {[
                { icon: <Inbox size={18} />, label: "Inbox", count: sessions.filter(s => s.status === 'open').length, active: true },
                { icon: <Send size={18} />, label: "Sent", count: 0 },
                { icon: <Archive size={18} />, label: "Archived", count: sessions.filter(s => s.status === 'closed').length },
                { icon: <Trash2 size={18} />, label: "Trash", count: 0 },
              ].map((item, i) => (
                <button 
                  key={i}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all",
                    item.active ? "bg-white/5 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{item.count}</span>}
                </button>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/10" />

        {/* Inbox List */}
        <ResizablePanel defaultSize={30} minSize={25} className="border-r border-white/10 bg-[#0a0a0a]">
           <div className="h-full flex flex-col">
              <div className="p-4 border-b border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Feedback</h2>
                    <div className="flex gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={fetchSessions}><RefreshCcw size={14} /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Filter size={14} /></Button>
                    </div>
                 </div>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <Input 
                      placeholder="Tìm kiếm đóng góp..." 
                      className="bg-white/5 border-white/5 pl-9 h-9 text-xs focus:border-primary/40 rounded-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>
              <ScrollArea className="flex-1">
                 <div className="divide-y divide-white/5">
                    {filteredSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedId(session.id)}
                        className={cn(
                          "w-full p-5 text-left transition-all hover:bg-white/[0.02] group",
                          selectedId === session.id ? "bg-white/[0.04]" : ""
                        )}
                      >
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm group-hover:text-primary transition-colors">{session.user_name}</span>
                            <span className="text-[10px] text-zinc-600">{session.last_message_at ? format(new Date(session.last_message_at), "HH:mm") : "N/A"}</span>
                         </div>
                         <div className="font-medium text-xs text-white/80 line-clamp-1 mb-1">{session.subject}</div>
                         <div className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed h-8">
                            {session.last_message || "Chưa có nội dung"}
                         </div>
                         <div className="mt-3 flex gap-2">
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] px-1.5 h-4">feedback</Badge>
                            {session.status === "open" && <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] px-1.5 h-4">mới</Badge>}
                         </div>
                      </button>
                    ))}
                 </div>
              </ScrollArea>
           </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/10" />

        {/* Message View */}
        <ResizablePanel defaultSize={55} className="bg-[#0a0a0a]">
           {activeSession ? (
             <div className="h-full flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 h-16 bg-[#0c0c0c]">
                   <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/10">
                         <AvatarImage src={activeSession.avatar_url} />
                         <AvatarFallback>{activeSession.user_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                         <div className="text-sm font-bold flex items-center gap-2">
                           {activeSession.user_name}
                           <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px] h-4">Student</Badge>
                         </div>
                         <div className="text-[10px] text-zinc-500 mt-0.5">{activeSession.id}</div>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white"><CornerUpLeft size={18} /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white"><Archive size={18} /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white"><Trash2 size={18} /></Button>
                      <Separator orientation="vertical" className="h-6 mx-1 bg-white/10" />
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white"><MoreVertical size={18} /></Button>
                   </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                   <ScrollArea className="h-full p-8" ref={scrollRef}>
                      <div className="max-w-2xl mx-auto space-y-10 pb-10">
                         {/* Session Header Info */}
                         <div className="text-center space-y-2 mb-12 border-b border-white/5 pb-8">
                            <h1 className="text-2xl font-bold text-white">{activeSession.subject}</h1>
                            <p className="text-sm text-zinc-500">Phiên hội thoại bắt đầu lúc {format(new Date(activeSession.created_at), "HH:mm, dd/MM/yyyy")}</p>
                         </div>

                         {messages.map((m, i) => {
                           const isAdmin = m.role === 'admin';
                           return (
                             <div key={m.id || i} className={cn(
                               "flex gap-3 group w-full",
                               isAdmin ? "flex-row-reverse" : "flex-row"
                             )}>
                                <Avatar className="h-8 w-8 shrink-0 border border-white/5 mt-1">
                                  <AvatarFallback className={isAdmin ? "bg-primary/20 text-primary" : "bg-zinc-800"}>
                                    {isAdmin ? 'A' : m.sender_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                  "max-w-[80%] flex flex-col",
                                  isAdmin ? "items-end" : "items-start"
                                )}>
                                   <div className="flex items-center gap-2 mb-1 px-1">
                                      <span className="text-[11px] font-bold text-zinc-400">
                                        {isAdmin ? 'Bạn (Hệ thống)' : m.sender_name}
                                      </span>
                                      <span className="text-[10px] text-zinc-600">
                                        {format(new Date(m.created_at), "HH:mm")}
                                      </span>
                                   </div>
                                   <div className={cn(
                                      "text-[13px] leading-relaxed p-3 rounded-2xl whitespace-pre-wrap shadow-sm",
                                      isAdmin 
                                        ? "bg-primary text-white rounded-tr-none" 
                                        : "bg-white/5 border border-white/10 text-zinc-300 rounded-tl-none"
                                   )}>
                                      {m.content}
                                   </div>
                                </div>
                             </div>
                           );
                         })}
                      </div>
                   </ScrollArea>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#080808] shrink-0">
                    <div className="max-w-2xl mx-auto relative group">
                        <textarea
                          placeholder={`Gửi phản hồi cho ${activeSession.user_name}...`}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm min-h-[120px] focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleSendReply();
                            }
                          }}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-3">
                           <span className="text-[10px] text-zinc-500 hidden group-focus-within:block">Ctrl + Enter to send</span>
                           <Button 
                              onClick={handleSendReply}
                              className="bg-primary hover:bg-primary/80 h-9 px-4 rounded-xl shadow-lg shadow-primary/20"
                           >
                              <Send size={16} className="mr-2" />
                              Trả lời
                           </Button>
                        </div>
                    </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-12 text-zinc-600">
                <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                   <Mail size={40} className="text-zinc-700" />
                </div>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">No conversation selected</h3>
                <p className="max-w-xs text-sm">Select a piece of feedback from the inbox to view details and reply.</p>
             </div>
           )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
