"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE_URL, fetchApi, fetcher, handleRefreshToken } from "@/lib/api";
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
  Bot,
  Library,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Smile,
  Reply as ReplyIcon,
  Flag,
  Plus,
  X,
  MessageSquareShare,
  CornerDownRight,
  CornerDownLeft,
  Trash2,
  Copy
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Cookies from "js-cookie";
import { LibraryPickerDialog } from "@/components/user/LibraryPickerDialog";
import { AIThinkingIndicator } from "@/components/user/AIThinkingIndicator";

interface RoomMessage {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  timestamp: string;
  is_ai: boolean;
  mentions_ai: boolean;
  reactions?: Record<string, string[]>;
  reply_to_id?: string;
}

interface RoomMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  is_online: boolean;
  doc_count: number;
  last_seen?: string;
}

interface Room {
  id: string;
  name: string;
  invite_code: string;
  host_id: string;
  members: RoomMember[];
}

interface RoomDoc {
  id: string;
  title: string;
  owner_name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const { data: roomData, error: roomError, mutate: mutateRoom } = useSWR<ApiResponse<Room>>(`/rooms/${id}`, fetcher as any, { revalidateOnFocus: false });
  const { data: docsData, mutate: mutateDocs } = useSWR<ApiResponse<RoomDoc[]>>(`/rooms/${id}/docs`, fetcher as any, { revalidateOnFocus: false });

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiStreamingText, setAiStreamingText] = useState("");

  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intentionalClose = useRef(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Layout states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<RoomMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'members'>('chat');
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);
  const [droppedDocs, setDroppedDocs] = useState<{id: string, title: string}[]>([]);
  const [isDragOverInput, setIsDragOverInput] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const dragCounterRef = useRef(0);
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingThrottleRef = useRef<number>(0);

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
      mutateDocs();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    intentionalClose.current = false;
    const wsBaseUrl = API_BASE_URL.replace(/^http/, "ws");

    const connectWS = async () => {
      let token = Cookies.get("access_token");

      if (!token) {
        try {
          token = await handleRefreshToken();
        } catch {
          setIsConnected(false);
          return;
        }
      }

      if (!token || intentionalClose.current) return;

      const wsUrl = `${wsBaseUrl}/rooms/${id}/ws?token=${token}`;
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 20000);

        socket.onclose = () => {
          clearInterval(pingInterval);
          setIsConnected(false);
          setIsAiTyping(false);
          setAiStreamingText("");
          if (!intentionalClose.current) {
            reconnectTimeout.current = setTimeout(connectWS, 3000);
          }
        };
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWsEvent(data);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };
    };

    connectWS();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiStreamingText, isAiTyping]);

  const handleWsEvent = (event: any) => {
    switch (event.type) {
      case "history":
        setMessages(event.payload || []);
        break;
      case "chat_message":
        setMessages(prev => {
          if (prev.some(m => m.id === event.payload.id)) return prev;
          return [...prev, event.payload];
        });
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
      case "user_typing": {
        const { user_id, name } = event.payload;
        setTypingUsers(prev => ({ ...prev, [user_id]: name }));
        if (typingTimersRef.current[user_id]) clearTimeout(typingTimersRef.current[user_id]);
        typingTimersRef.current[user_id] = setTimeout(() => {
          setTypingUsers(prev => { const next = { ...prev }; delete next[user_id]; return next; });
        }, 3000);
        break;
      }
      case "message_reaction":
        setMessages(prev => prev.map(m =>
          m.id === event.payload.id ? event.payload : m
        ));
        break;
      case "user_joined":
      case "user_left":
      case "user_online":
      case "user_offline":
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
      case "doc_linked":
        toast.info(`${event.payload.user_name} đã thêm tài liệu từ thư viện: ${event.payload.doc_name}`);
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

    // Gửi typing event (throttle 1 lần / 2 giây)
    if (value.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const now = Date.now();
      if (now - typingThrottleRef.current > 2000) {
        typingThrottleRef.current = now;
        ws.current.send(JSON.stringify({ type: "typing" }));
      }
    }

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
    if ((!inputText.trim() && droppedDocs.length === 0) || !ws.current) return;

    let finalText = inputText.trim();
    if (droppedDocs.length > 0) {
      const docRefs = droppedDocs.map(d => `[[Doc: ${d.title}]]`).join(' ');
      finalText = finalText ? `${docRefs}\n${finalText}` : docRefs;
    }

    ws.current.send(JSON.stringify({
      type: "chat_message",
      text: finalText,
      reply_to_id: replyingTo?.id
    }));
    setInputText("");
    setDroppedDocs([]);
    setReplyingTo(null);
  };

  const sendReaction = (msgId: string, emoji: string) => {
    if (!ws.current) return;
    ws.current.send(JSON.stringify({
      type: "message_reaction",
      message_id: msgId,
      emoji: emoji
    }));
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
    ...(room?.members || []).map((m) => ({ id: m.user_id, name: m.name, is_ai: false }))
  ].filter(opt => opt.name.toLowerCase().includes(mentionSearch.toLowerCase()));
  const docs = docsData?.data || [];
  const isHost = room.host_id === user?.id;

  // Highlight @MindexAI và [[Doc: ...]] trong tin nhắn
  const renderRoomText = (text: string) => {
    const parts = text.split(/(@MindexAI|\[\[Doc: .+?\]\])/g);
    return parts.map((part, i) => {
      if (part === "@MindexAI") {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-xs bg-slate-400/15 text-slate-600 dark:text-slate-300 cursor-pointer underline underline-offset-2 transition-all hover:bg-slate-400/25"
            onClick={() => {
              setInputText(prev => prev.endsWith(' ') || prev === '' ? prev + '@MindexAI ' : prev + ' @MindexAI ');
              setTimeout(() => textareaRef.current?.focus(), 10);
            }}
          >
            <Sparkles size={10} />
            @MindexAI
          </span>
        );
      }
      const docMatch = part.match(/^\[\[Doc: (.+?)\]\]$/);
      if (docMatch) {
        return (
          <span key={i} className="inline-flex items-center gap-1 font-bold underline underline-offset-2 text-primary dark:text-blue-400">
            <FileText size={11} className="shrink-0" />
            {docMatch[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background text-foreground overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/rooms" className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div className="hidden md:flex w-10 h-10 rounded-xl bg-primary/20 items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-foreground">{room.name}</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                {isConnected ? <Wifi size={10} className="text-green-500" /> : <WifiOff size={10} className="text-red-500" />}
                {isConnected ? "Đã kết nối" : "Mất kết nối"}
              </span>
              <span>•</span>
              <span className="font-mono text-primary font-bold">Mã mời: {room.invite_code}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Dropdown Actions */}
          <div className="flex md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreVertical size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 bg-popover border-border p-1 shadow-2xl">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="justify-start text-xs text-muted-foreground hover:text-foreground" onClick={() => {
                    const inviteLink = `${window.location.origin}/rooms/join?code=${room.invite_code}`;
                    navigator.clipboard.writeText(inviteLink);
                    toast.success("Đã copy link mời tham gia");
                  }}>
                    <UserPlus size={14} className="mr-2" /> Mời bạn
                  </Button>
                  {isHost && (
                    <Button variant="ghost" size="sm" className="justify-start text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={async () => {
                      if (confirm("Đóng phòng sẽ mời tất cả mọi người ra ngoài. Bạn chắc chứ?")) {
                        await fetchApi(`/rooms/${id}/close`, { method: 'POST' });
                        router.push("/library");
                      }
                    }}>
                      <X size={14} className="mr-2" /> Đóng phòng
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="justify-start text-xs text-muted-foreground hover:text-red-500" onClick={leaveRoom}>
                    <LogOut size={14} className="mr-2" /> Rời phòng
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => {
              const inviteLink = `${window.location.origin}/rooms/join?code=${room.invite_code}`;
              navigator.clipboard.writeText(inviteLink);
              toast.success("Đã copy link mời tham gia");
            }}>
              <UserPlus size={16} className="mr-2" />
              Mời bạn
            </Button>
            <Separator orientation="vertical" className="h-6 bg-border" />
            {isHost && (
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={async () => {
                if (confirm("Đóng phòng sẽ mời tất cả mọi người ra ngoài. Bạn chắc chứ?")) {
                  await fetchApi(`/rooms/${id}/close`, { method: 'POST' });
                  router.push("/library");
                }
              }}>
                Đóng phòng
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500" onClick={leaveRoom}>
              <LogOut size={16} className="mr-2" />
              Rời phòng
            </Button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* LEFT SIDEBAR: MEMBERS */}
        <aside className={cn(
          "border-r border-border/50 bg-card/50 transition-all duration-300 flex flex-col shrink-0",
          leftSidebarOpen ? "md:w-64" : "md:w-0",
          activeTab === 'members' ? "w-full flex" : "hidden md:flex overflow-hidden"
        )}>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Thành viên ({members.length}/5)</span>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors group cursor-pointer"
                  onClick={() => setInputText(prev => prev + (prev.endsWith(' ') || prev === '' ? `@${m.name.replace(/\s+/g, '')} ` : ` @${m.name.replace(/\s+/g, '')} `))}
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8 border border-border">
                      {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                      <AvatarFallback className="bg-muted text-[10px]">{m.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                      m.is_online ? "bg-green-500" : "bg-muted-foreground/30"
                    )} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate flex items-center gap-1 text-foreground">
                      {m.name}
                      {m.user_id === room.host_id && <Crown size={12} className="text-yellow-500 shrink-0" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 truncate">
                      {m.is_online ? (
                        `${m.doc_count} tài liệu đã chia sẻ`
                      ) : m.last_seen ? (
                        `Hoạt động ${formatDistanceToNow(new Date(m.last_seen), { addSuffix: true, locale: vi })}`
                      ) : (
                        `${m.doc_count} tài liệu đã chia sẻ`
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CHAT AREA */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden min-h-0",
          activeTab === 'chat' ? "flex" : "hidden md:flex"
        )}>
          <div className="absolute top-1/2 -left-3 -translate-y-1/2 z-20">
            <Button
              variant="secondary"
              size="icon"
              className="w-6 h-12 rounded-r-xl rounded-l-none bg-card border border-border text-muted-foreground hover:text-foreground"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            >
              {leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </Button>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
            <div className="max-w-4xl mx-auto w-full space-y-8 p-6">
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold italic text-foreground">Chào mừng tới {room.name}!</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Dùng <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-xs bg-slate-400/15 text-slate-600 dark:text-slate-300 cursor-pointer underline underline-offset-2 hover:bg-slate-400/25"
                      onClick={() => { setInputText(prev => prev + (prev.endsWith(' ') || prev === '' ? '@MindexAI ' : ' @MindexAI ')); setTimeout(() => textareaRef.current?.focus(), 10); }}
                    ><Sparkles size={10} />@MindexAI</span> để hỏi về tài liệu chung của cả nhóm.
                  </p>
                </div>
              </div>

              {messages.map((msg) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={cn(
                    "flex gap-3 group w-full",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}>
                    {/* AVATAR */}
                    {!isMe && (
                      msg.is_ai ? (
                        <div className="w-9 h-9 shrink-0 self-end mb-1 rounded-xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/15 flex-shrink-0">
                          <Bot size={17} className="text-primary" />
                        </div>
                      ) : (
                        <Avatar className="w-9 h-9 shrink-0 shadow-lg self-end mb-1 bg-muted">
                          <AvatarFallback>{msg.user_name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                      )
                    )}

                    <div className={cn(
                      "flex flex-col min-w-0 max-w-[80%]",
                      isMe ? "items-end" : "items-start"
                    )}>
                      {/* NAME & TIME */}
                      <div className={cn(
                        "flex items-center gap-2 mb-1 px-1",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className={cn(
                          "text-[11px] font-bold",
                          isMe ? "text-primary" :
                          msg.is_ai ? "text-violet-600 dark:text-violet-400" :
                          "text-muted-foreground"
                        )}>
                          {isMe ? "Bạn" : msg.user_name}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50">{format(new Date(msg.timestamp), 'HH:mm', { locale: vi })}</span>
                      </div>

                      {/* QUOTED MESSAGE */}
                      {msg.reply_to_id && (
                        <div className={cn(
                          "flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-0.5 px-1",
                          isMe ? "flex-row justify-start" : "flex-row-reverse justify-start"
                        )}>
                          {isMe ? (
                            <CornerDownRight size={10} className="shrink-0" />
                          ) : (
                            <CornerDownLeft size={10} className="shrink-0" />
                          )}
                          <span className="truncate max-w-[150px]">
                            {messages.find(m => m.id === msg.reply_to_id)?.text || "Tin nhắn đã bị xóa"}
                          </span>
                        </div>
                      )}

                      <div className={cn(
                        "flex items-end gap-2",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className="relative w-fit">
                          <div className={cn(
                            "text-sm leading-relaxed whitespace-pre-wrap p-3 px-4 rounded-[20px] shadow-sm",
                            isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none",
                            msg.is_ai ? "bg-primary/10 border border-primary/20 text-foreground p-4" : ""
                          )}>
                            {renderRoomText(msg.text)}
                          </div>

                          {/* DISPLAY REACTIONS */}
                          {msg.reactions && Object.keys(msg.reactions || {}).length > 0 && (
                            <div className={cn(
                              "absolute -bottom-2 flex items-center gap-0.5 bg-popover border border-border rounded-full p-0.5 px-1 shadow-xl z-10 hover:scale-110 transition-transform cursor-pointer",
                              isMe ? "-left-2" : "-right-2"
                            )}
                              onClick={() => sendReaction(msg.id, Object.keys(msg.reactions || {})[0])}
                            >
                              <div className="flex -space-x-1 items-center">
                                {Object.entries(msg.reactions || {}).slice(0, 2).map(([emoji]) => (
                                  <span key={emoji} className="text-[14px] leading-none">{emoji}</span>
                                ))}
                              </div>
                              {Object.values(msg.reactions || {}).reduce((acc, curr) => acc + curr.length, 0) > 1 && (
                                <span className="text-[10px] font-bold text-foreground/80 pr-0.5">
                                  {Object.values(msg.reactions || {}).reduce((acc, curr) => acc + curr.length, 0)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* HOVER ACTIONS */}
                        <div className={cn(
                          "flex items-center gap-0.5 p-1 bg-card border border-border rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-[-5px]",
                          isMe ? "mr-1" : "ml-1"
                        )}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground">
                                <Smile size={14} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" className="w-auto p-1 bg-popover/95 backdrop-blur-xl border-border rounded-full flex items-center gap-1 shadow-2xl z-50">
                              {["👍", "👎", "❤️", "🎉", "🔥", "🤔", "😂", "🤯"].map(emoji => (
                                <button
                                  key={emoji}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-accent rounded-full transition-colors text-lg"
                                  onClick={() => sendReaction(msg.id, emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <div className="w-8 h-8 flex items-center justify-center hover:bg-accent rounded-full transition-colors cursor-pointer text-muted-foreground">
                                <Plus size={14} />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
                            onClick={() => setReplyingTo(msg)}
                          >
                            <ReplyIcon size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
                            onClick={() => { navigator.clipboard.writeText(msg.text); toast.success("Đã sao chép!"); }}
                          >
                            <Copy size={14} />
                          </Button>
                          {!isMe && !msg.is_ai && (
                            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500">
                              <Flag size={14} />
                            </Button>
                          )}
                          {isMe && (
                            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500">
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI đang thinking — shimmer sweep */}
              {isAiTyping && !aiStreamingText && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 shrink-0 self-end mb-1 rounded-xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/15">
                    <Bot size={17} className="text-primary" />
                  </div>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 px-1">MindexAI</span>
                    <div className="px-4 py-3 rounded-[20px] rounded-tl-none bg-muted border border-border/50">
                      <AIThinkingIndicator />
                    </div>
                  </div>
                </div>
              )}

              {/* AI đang stream text */}
              {aiStreamingText && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 shrink-0 self-end mb-1 rounded-xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/15">
                    <Bot size={17} className="text-primary" />
                  </div>
                  <div className="flex flex-col gap-1 items-start min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 px-1">MindexAI</span>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-[20px] rounded-tl-none bg-primary/10 border border-primary/20 text-foreground max-w-[85%]">
                      {aiStreamingText}
                      <span className="inline-block w-0.5 h-4 bg-violet-500 dark:bg-violet-400 ml-0.5 animate-pulse rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              {/* Typing indicator — người khác đang nhập */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {Object.values(typingUsers).slice(0, 2).map((name, i) => (
                      <Avatar key={i} className="w-6 h-6 border-2 border-background">
                        <AvatarFallback className="text-[8px] bg-muted">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <AIThinkingIndicator text={`${Object.values(typingUsers).join(' và ')} đang nhập...`} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* INPUT AREA */}
          <div className="p-4 md:p-6 shrink-0 bg-background border-t border-border/50 relative z-20">
            {/* REPLY PREVIEW */}
            {replyingTo && (
              <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between bg-card border border-border/70 p-2 px-4 rounded-xl text-xs animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1 h-8 bg-primary/40 rounded-full" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[10px] text-primary">Đang trả lời {replyingTo.user_name}</span>
                    <span className="truncate max-w-[300px] italic">"{replyingTo.text}"</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-accent" onClick={() => setReplyingTo(null)}>
                  <X size={14} />
                </Button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div
                className={cn(
                  "relative flex flex-col gap-0 bg-card/80 border focus-within:border-primary/50 rounded-2xl backdrop-blur-xl transition-all shadow-md",
                  isDragOverInput ? "border-violet-500 bg-violet-500/5 shadow-violet-500/20 shadow-lg" : "border-border"
                )}
                onDragEnter={(e) => {
                  e.preventDefault();
                  dragCounterRef.current++;
                  setIsDragOverInput(true);
                }}
                onDragLeave={() => {
                  dragCounterRef.current--;
                  if (dragCounterRef.current === 0) setIsDragOverInput(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  dragCounterRef.current = 0;
                  setIsDragOverInput(false);
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (data.id && data.title && !droppedDocs.find(d => d.id === data.id)) {
                      setDroppedDocs(prev => [...prev, {id: data.id, title: data.title}]);
                    }
                  } catch {}
                }}
              >
                {/* Drop overlay hint */}
                {isDragOverInput && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-30 pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-600 dark:text-violet-400 text-sm font-bold">
                      <FileText size={16} />
                      Thả tài liệu vào đây
                    </div>
                  </div>
                )}

                {/* Dropped doc pills */}
                {droppedDocs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
                    {droppedDocs.map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold underline underline-offset-2 text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-500/15 border border-primary/20 dark:border-blue-500/30 max-w-[200px] cursor-default"
                      >
                        <FileText size={10} className="shrink-0 no-underline" style={{textDecoration: 'none'}} />
                        <span className="truncate">{doc.title}</span>
                        <button
                          className="ml-0.5 shrink-0 hover:text-red-500 transition-colors"
                          style={{textDecoration: 'none'}}
                          onClick={() => setDroppedDocs(prev => prev.filter(d => d.id !== doc.id))}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground/50 hover:text-foreground shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={18} />}
                </Button>
                <textarea
                  ref={textareaRef}
                  placeholder="Nhập tin nhắn... (Dùng @MindexAI để hỏi)"
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-2 resize-none max-h-32 min-h-[44px] custom-scrollbar text-foreground placeholder:text-muted-foreground"
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
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 border-b border-border/50 bg-muted/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Nhắc tên thành viên</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {mentionOptions.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            idx === selectedMentionIndex ? "bg-primary/20 text-foreground" : "hover:bg-accent text-muted-foreground"
                          )}
                          onClick={() => insertMention(opt.name)}
                        >
                          {opt.is_ai ? (
                            <div className="w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                              <Sparkles className="w-3 h-3 text-violet-500" />
                            </div>
                          ) : (
                            <Avatar className="w-6 h-6 border border-border shrink-0">
                              <AvatarFallback className="text-[8px]">{opt.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-sm font-medium truncate">{opt.name}</span>
                          {opt.is_ai && <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold">AI</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 transition-colors"
                  disabled={(!inputText.trim() && droppedDocs.length === 0) || !isConnected}
                  onClick={sendMessage}
                >
                  <Send size={18} />
                </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-20">
            <Button
              variant="secondary"
              size="icon"
              className="w-6 h-12 rounded-l-xl rounded-r-none bg-card border border-border text-muted-foreground hover:text-foreground"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              {rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </Button>
          </div>
        </div>

        {/* RIGHT SIDEBAR: DOCUMENTS */}
        <aside className={cn(
          "border-l border-border/50 bg-card/50 transition-all duration-300 flex min-h-0 flex-col shrink-0",
          rightSidebarOpen ? "md:w-80" : "md:w-0",
          activeTab === 'docs' ? "w-full flex" : "hidden md:flex overflow-hidden"
        )}>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tài liệu chia sẻ ({docs.length})</span>
          </div>
          <ScrollArea className="min-h-0 flex-1 px-4">
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({id: doc.id, title: doc.title}));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-accent/40 transition-all group cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate text-foreground">{doc.title}</h4>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">Tải lên bởi {doc.owner_name}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5 italic">Kéo vào ô chat để đính kèm</p>
                    </div>
                  </div>
                </div>
              ))}
              {docs.length === 0 && (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <FileText size={20} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground italic">Chưa có tài liệu nào.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/50 space-y-2">
            {/* Upload file mới */}
            <Button
              variant="outline"
              className="w-full border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all text-xs h-10 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
              Upload file mới
            </Button>
            {/* Chọn từ thư viện cá nhân */}
            <Button
              variant="outline"
              className="w-full border-border hover:border-emerald-500/50 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-xs h-10 rounded-xl"
              onClick={() => setIsLibraryPickerOpen(true)}
            >
              <Library size={14} className="mr-2" />
              Chọn từ thư viện
            </Button>
          </div>
        </aside>
      </div>

      {/* MOBILE TAB NAVIGATION */}
      <div className="md:hidden h-16 border-t border-border/50 bg-card flex items-center justify-around px-2 shrink-0 z-50">
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'members' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Users size={20} />
          <span className="text-[10px] font-medium">Thành viên</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative",
            activeTab === 'chat' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "p-3 rounded-2xl -mt-8 border-t border-border shadow-2xl transition-all",
            activeTab === 'chat' ? "bg-primary text-primary-foreground scale-110" : "bg-card text-muted-foreground"
          )}>
            <MessageSquare size={24} />
          </div>
          <span className="text-[10px] font-medium">Thảo luận</span>
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'docs' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <FileText size={20} />
          <span className="text-[10px] font-medium">Tài liệu</span>
        </button>
      </div>

      {/* Library Picker Dialog */}
      <LibraryPickerDialog
        open={isLibraryPickerOpen}
        onOpenChange={setIsLibraryPickerOpen}
        roomId={id as string}
        alreadyLinkedIds={docs.map((d) => d.id)}
        onSuccess={(docTitle) => {
          toast.success(`Đã thêm "${docTitle}" vào phòng!`);
          mutateDocs();
        }}
      />
    </div>
  );
}
