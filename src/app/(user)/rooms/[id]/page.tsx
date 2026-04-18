"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchApi, fetcher, handleRefreshToken } from "@/lib/api";
import useSWR from "swr";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Send, 
  MoreVertical, 
  LogOut, 
  UserPlus, 
  Upload,
  Crown,
  Wifi,
  WifiOff,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Cookies from "js-cookie";

interface RoomMessage {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  timestamp: string;
  is_ai: boolean;
  mentions_ai: boolean;
}

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const { data: roomData, error: roomError, mutate: mutateRoom } = useSWR(`/rooms/${id}`, fetcher, { refreshInterval: 5000 });
  const { data: docsData, mutate: mutateDocs } = useSWR(`/rooms/${id}/docs`, fetcher, { refreshInterval: 10000 });

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiStreamingText, setAiStreamingText] = useState("");

  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Layout states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("room_id", id as string);

    try {
      await fetchApi("/processing/upload", {
        method: 'POST',
        body: formData
      });
      toast.success("Đã gửi yêu cầu xử lý tài liệu...");
    } catch (err: any) {
      toast.error(err.message || "Lỗi upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host.includes("localhost") ? "localhost:8080" : window.location.host;

    const connectWS = async () => {
      let token = Cookies.get("access_token");
      
      if (!token) {
        console.log("[RoomWS] No token found, attempting to refresh...");
        try {
          token = await handleRefreshToken();
        } catch (err) {
          console.error("[RoomWS] Token refresh failed, cannot connect WS");
          setIsConnected(false);
          return;
        }
      }

      if (!token) {
        setIsConnected(false);
        return;
      }

      const wsUrl = `${protocol}//${host}/api/v1/rooms/${id}/ws?token=${token}`;
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log("Connected to room WS");
        // Heartbeat ping
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 20000);
        
        socket.onclose = () => {
          clearInterval(pingInterval);
          setIsConnected(false);
        };
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWsEvent(data);
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("Disconnected from room WS");
      };
    };

    connectWS();

    return () => {
      ws.current?.close();
    };
  }, [id, user]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, aiStreamingText, isAiTyping]);

  const handleWsEvent = (event: any) => {
    switch (event.type) {
      case "history":
        setMessages(event.payload || []);
        break;
      case "chat_message":
        setMessages(prev => [...prev, event.payload]);
        break;
      case "ai_typing":
        setIsAiTyping(true);
        break;
      case "ai_chunk":
        setIsAiTyping(false);
        setAiStreamingText(prev => prev + event.payload.chunk);
        break;
      case "ai_done":
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          user_id: "ai",
          user_name: "MindexAI",
          text: event.payload.full_text,
          timestamp: new Date().toISOString(),
          is_ai: true,
          mentions_ai: false
        }]);
        setAiStreamingText("");
        break;
      case "user_joined":
      case "user_left":
      case "host_changed":
        mutateRoom();
        if (event.type === "host_changed") {
          toast.info(`${event.payload.new_host_name} đã trở thành chủ phòng mới`);
        }
        break;
      case "doc_uploaded":
        toast.info(`${event.payload.user_name} đã upload tài liệu: ${event.payload.doc_name}`);
        mutateDocs();
        break;
      case "room_closed":
        toast.error("Phòng đã bị đóng bởi chủ phòng");
        router.push("/library");
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setInputText(value);

    // Xử lý @mention logic
    const lastAtPos = value.lastIndexOf("@", cursorPosition - 1);
    if (lastAtPos !== -1) {
      const textAfterAt = value.substring(lastAtPos + 1, cursorPosition);
      // Chỉ hiện gợi ý nếu không có dấu cách giữa @ và cursor
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt);
        setMentionStartIndex(lastAtPos);
        setShowMentionSuggestions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }
    setShowMentionSuggestions(false);
  };

  const insertMention = (name: string) => {
    const beforeAt = inputText.substring(0, mentionStartIndex);
    const afterAt = inputText.substring(mentionStartIndex + mentionSearch.length + 1);
    const newText = beforeAt + "@" + name.replace(/\s+/g, '') + " " + afterAt;
    setInputText(newText);
    setShowMentionSuggestions(false);
    
    // Focus lại textarea sau khi chọn
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);
  };


  const sendMessage = () => {
    if (!inputText.trim() || !ws.current) return;
    
    ws.current.send(JSON.stringify({
      type: "chat_message",
      text: inputText
    }));
    setInputText("");
  };

  const leaveRoom = async () => {
    if (!confirm("Bạn có chắc muốn rời khỏi phòng?")) return;
    try {
      await fetchApi(`/rooms/${id}/leave`, { method: 'POST' });
      toast.success("Đã rời khỏi phòng");
      router.push("/library");
    } catch (err: any) {
      toast.error(err.message || "Không thể rời phòng");
    }
  };

  if (roomError) return <div className="p-10 text-center">Không tìm thấy phòng hoặc bạn không có quyền truy cập.</div>;
  if (!roomData) return <div className="p-10 text-center flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Đang tải phòng...</div>;

  const room = roomData.data;
  const members = room.members || [];

  const mentionOptions = [
    { id: "ai", name: "MindexAI", is_ai: true },
    ...(room?.members || []).map((m: any) => ({ id: m.user_id, name: m.name, is_ai: false }))
  ].filter(opt => opt.name.toLowerCase().includes(mentionSearch.toLowerCase()));
  const docs = docsData?.data || [];
  const isHost = room.host_id === user?.id;

  return (
    <div className="flex flex-col h-full max-h-full bg-[#020205] text-white overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-white/5 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{room.name}</h1>
            <div className="flex items-center gap-2 text-[10px] text-white/40">
              <span className="flex items-center gap-1">
                {isConnected ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-red-500" />}
                {isConnected ? "Đã kết nối" : "Mất kết nối"}
              </span>
              <span>•</span>
              <span className="font-mono text-primary font-bold">Mã mời: {room.invite_code}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white" onClick={() => {
            navigator.clipboard.writeText(room.invite_code);
            toast.success("Đã copy mã mời");
          }}>
            <UserPlus size={16} className="mr-2" />
            Mời bạn
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          {isHost && (
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={async () => {
              if (confirm("Đóng phòng sẽ mời tất cả mọi người ra ngoài. Bạn chắc chứ?")) {
                await fetchApi(`/rooms/${id}/close`, { method: 'POST' });
                router.push("/library");
              }
            }}>
               Đóng phòng
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-red-300" onClick={leaveRoom}>
            <LogOut size={16} className="mr-2" />
            Rời phòng
          </Button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* LEFT SIDEBAR: MEMBERS */}
        <aside className={cn(
          "border-r border-white/5 bg-[#0A0B10]/50 transition-all duration-300 flex flex-col",
          leftSidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Thành viên ({members.length}/5)</span>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {members.map((m: any) => (
                <div 
                  key={m.user_id} 
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => setInputText(prev => prev + (prev.endsWith(' ') || prev === '' ? `@${m.name.replace(/\s+/g, '')} ` : ` @${m.name.replace(/\s+/g, '')} `))}
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8 border border-white/10">
                      <AvatarFallback className="bg-white/10 text-[10px]">{m.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0B10]",
                      m.is_online ? "bg-green-500" : "bg-white/20"
                    )} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate flex items-center gap-1">
                      {m.name}
                      {m.user_id === room.host_id && <Crown size={12} className="text-yellow-500 shrink-0" />}
                    </span>
                    <span className="text-[10px] text-white/30 truncate">
                      {m.doc_count} tài liệu đã chia sẻ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0A0B0F] relative overflow-hidden min-h-0">
          <div className="absolute top-1/2 -left-3 -translate-y-1/2 z-20">
             <Button 
               variant="secondary" 
               size="icon" 
               className="w-6 h-12 rounded-r-xl rounded-l-none bg-[#1A1B23] border border-white/10 text-white/40 hover:text-white"
               onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
             >
               {leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
             </Button>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
            <div className="max-w-4xl mx-auto w-full space-y-8 p-6 pb-32">
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                   <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold italic">Chào mừng tới {room.name}!</h2>
                  <p className="text-sm text-white/30 max-w-sm mt-2">
                    Dùng <span 
                      className="text-primary font-bold cursor-pointer hover:underline"
                      onClick={() => setInputText(prev => prev + (prev.endsWith(' ') || prev === '' ? '@MindexAI ' : ' @MindexAI '))}
                    >@MindexAI</span> để hỏi về tài liệu chung của cả nhóm.
                  </p>
                </div>
              </div>

              {messages.map((msg, idx) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={cn(
                    "flex gap-4 group",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}>
                    <Avatar className={cn(
                      "w-9 h-9 shrink-0", 
                      msg.is_ai ? "bg-primary/20 p-1" : isMe ? "bg-secondary/20" : "bg-white/10"
                    )}>
                      {msg.is_ai ? <Sparkles className="text-primary" /> : <AvatarFallback>{msg.user_name.substring(0,2)}</AvatarFallback>}
                    </Avatar>
                    <div className={cn(
                      "flex flex-col gap-1 min-w-0 flex-1",
                      isMe ? "items-end text-right" : "items-start text-left"
                    )}>
                      <div className="flex items-center gap-2">
                        {!isMe && <span className={cn("text-sm font-bold", msg.is_ai ? "text-primary" : "text-white/80")}>{msg.user_name}</span>}
                        <span className="text-[10px] text-white/20">{format(new Date(msg.timestamp), 'HH:mm', { locale: vi })}</span>
                        {isMe && <span className="text-sm font-bold text-secondary">Bạn</span>}
                      </div>
                      <div className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap p-3 px-4 rounded-[20px] max-w-[85%]",
                        isMe ? "bg-zinc-800 text-white rounded-tr-none" : "bg-white/10 text-white/90 rounded-tl-none",
                        msg.is_ai ? "bg-primary/10 border border-primary/20 text-white p-4" : ""
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(isAiTyping || aiStreamingText) && (
                <div className="flex gap-4">
                  <Avatar className="w-9 h-9 shrink-0 bg-primary/20 p-1">
                    <Sparkles className="text-primary" />
                  </Avatar>
                  <div className="flex flex-col gap-1 min-w-0 flex-1 items-start text-left">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">MindexAI</span>
                        <span className="text-[10px] text-white/20">Đang trả lời...</span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-[20px] rounded-tl-none bg-primary/10 border border-primary/20 text-white max-w-[85%]">
                        {aiStreamingText || "MindexAI đang suy nghĩ..."}
                        <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
                      </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* INPUT AREA */}
          <div className="p-6 shrink-0 bg-[#0A0B0F] border-t border-white/5 relative z-20">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-end gap-2 bg-[#1A1B23]/80 border border-white/10 focus-within:border-primary/50 p-2 rounded-2xl backdrop-blur-xl transition-all shadow-2xl">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-white/20 hover:text-white shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                   {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={18} />}
                </Button>
                <textarea 
                  ref={textareaRef}
                  placeholder="Nhập tin nhắn... (Dùng @MindexAI để hỏi)"
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-2 resize-none max-h-32 min-h-[44px] custom-scrollbar"
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (showMentionSuggestions && mentionOptions.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedMentionIndex((prev) => (prev + 1) % mentionOptions.length);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedMentionIndex((prev) => (prev - 1 + mentionOptions.length) % mentionOptions.length);
                      } else if (e.key === "Enter" || e.key === "Tab") {
                        e.preventDefault();
                        insertMention(mentionOptions[selectedMentionIndex].name);
                      } else if (e.key === "Escape") {
                        setShowMentionSuggestions(false);
                      }
                    } else if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                {/* MENTION SUGGESTIONS */}
                {showMentionSuggestions && mentionOptions.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1A1B23] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 border-b border-white/5 bg-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Nhắc tên thành viên</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {mentionOptions.map((opt, idx) => (
                        <div 
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            idx === selectedMentionIndex ? "bg-primary/20 text-white" : "hover:bg-white/5 text-white/60"
                          )}
                          onClick={() => insertMention(opt.name)}
                        >
                          <Avatar className="w-6 h-6 border border-white/10 shrink-0">
                             {opt.is_ai ? <Sparkles className="w-3 h-3 text-primary" /> : <AvatarFallback className="text-[8px]">{opt.name.substring(0,2)}</AvatarFallback>}
                          </Avatar>
                          <span className="text-sm font-medium truncate">{opt.name}</span>
                          {opt.is_ai && <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">AI</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button 
                  size="icon" 
                  className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white/70 hover:text-white shrink-0 transition-colors"
                  disabled={!inputText.trim() || !isConnected}
                  onClick={sendMessage}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-20">
             <Button 
               variant="secondary" 
               size="icon" 
               className="w-6 h-12 rounded-l-xl rounded-r-none bg-[#1A1B23] border border-white/10 text-white/40 hover:text-white"
               onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
             >
               {rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
             </Button>
          </div>
        </div>

        {/* RIGHT SIDEBAR: DOCUMENTS */}
        <aside className={cn(
          "border-l border-white/5 bg-[#0A0B10]/50 transition-all duration-300 flex flex-col",
          rightSidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Tài liệu chia sẻ ({docs.length})</span>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3">
               {docs.map((doc: any) => (
                 <div key={doc.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate text-white/90">{doc.title}</h4>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">Tải lên bởi {doc.owner_name}</p>
                      </div>
                    </div>
                 </div>
               ))}
               {docs.length === 0 && (
                 <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                      <FileText size={20} className="text-white/20" />
                    </div>
                    <p className="text-xs text-white/20 italic">Chưa có tài liệu nào.</p>
                 </div>
               )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/5">
             <Button 
               variant="outline" 
               className="w-full border-dashed border-white/10 hover:border-primary/50 text-white/40 hover:text-primary transition-all text-xs h-10 rounded-xl"
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
             >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                Upload tài liệu mới
             </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
