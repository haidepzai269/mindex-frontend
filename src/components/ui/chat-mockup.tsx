"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  Star, 
  ChevronRight, 
  Zap, 
  Send,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ChatMockup() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const DEMO_SCENARIO = [
    { 
      question: "Cách khởi động server và truy cập website?", 
      answer: "Để khởi động, bạn chạy lệnh `node server.js`. Sau đó truy cập `http://localhost:3000` trên trình duyệt. Chúc bạn thành công!" 
    },
    { 
      question: "Mindex có thể giúp gì cho việc học của tôi?", 
      answer: "Mindex giúp bạn tóm tắt tài liệu, trích xuất ý chính và tạo câu hỏi ôn tập tự động từ PDF/Slide, giúp tiết kiệm 70% thời gian nghiên cứu." 
    }
  ];

  useEffect(() => {
    let scenarioIdx = 0;
    let isMounted = true;

    async function runLoop() {
      while (isMounted) {
        setMessages([]);
        const current = DEMO_SCENARIO[scenarioIdx];
        
        // 1. Gõ câu hỏi
        let text = "";
        for (const char of current.question) {
          if (!isMounted) return;
          text += char;
          setInput(text);
          await new Promise(r => setTimeout(r, 50));
        }

        await new Promise(r => setTimeout(r, 500));
        if (!isMounted) return;

        // 2. Gửi câu hỏi
        setMessages([{ role: "user", content: current.question }]);
        setInput("");
        
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) return;

        // 3. AI trả lời
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) return;

        setMessages(prev => [...prev, { role: "assistant", content: current.answer }]);
        setIsTyping(false);

        // 4. Chờ xem kết quả rồi lặp lại
        await new Promise(r => setTimeout(r, 5000));
        
        scenarioIdx = (scenarioIdx + 1) % DEMO_SCENARIO.length;
      }
    }

    runLoop();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="w-full h-full bg-[#050505] text-zinc-50 flex overflow-hidden rounded-xl border border-white/5 shadow-2xl relative">
      {/* Sidebar Mockup */}
      <aside className="hidden md:flex w-64 h-full flex-col bg-zinc-900/30 border-r border-white/5 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            Inbox
            <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(184,41,255,1)]" />
          </h2>
          <Plus size={14} className="text-zinc-500" />
        </div>

        <div className="relative mb-4">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <div className="h-8 bg-white/5 border border-white/5 rounded-lg w-full flex items-center pl-8 text-[10px] text-zinc-600">
            Tìm tài liệu...
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          <MockNavItem active title="Hướng Dẫn Xây Dựng Website..." status="READY" pinned />
          <MockNavItem title="Lộ trình CCNA.pdf" status="READY" pinned />
          <MockNavItem title="Cách đọc Source Code..." time="Còn 12h" />
          <MockNavItem title="Báo cáo chi tiết..." time="Còn 643h" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-white/[0.03] bg-black/40 flex items-center justify-between px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-primary opacity-60" />
              <h3 className="text-[12px] font-bold text-white tracking-tight">Hướng Dẫn Xây Dựng Website Bán Hàng Nhỏ.pdf</h3>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] font-bold text-zinc-600 tracking-wider uppercase">BY MINDEX INTELLIGENCE ENGINE</span>
              <div className="px-1 py-0 text-[6px] font-black bg-white/5 border border-white/10 rounded text-emerald-400">READY</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-zinc-500">
            <Star size={14} fill="#f59e0b" className="text-amber-500" />
            <Loader2 size={14} className="animate-spin opacity-20" />
          </div>
        </header>

        {/* Chat / Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-10 pb-32 space-y-6 custom-scrollbar" ref={scrollRef}>
          {/* Mock Document Content Overlay - To make it look like the user screenshot */}
          <div className="max-w-2xl mx-auto space-y-4 opacity-10 select-none pointer-events-none mb-4">
            <h1 className="text-xl font-bold">Chạy lệnh `node server.js`</h1>
            <p className="text-sm">để khởi động server. Mở trình duyệt và nhập địa chỉ `http://localhost:3000` để truy cập vào website bán hàng.</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4",
                    msg.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    msg.role === "assistant" ? "bg-primary/10 border-primary/20" : "bg-white/5 border-white/10"
                  )}>
                    {msg.role === "assistant" ? <Zap size={14} className="text-primary fill-primary" /> : <div className="text-[10px] font-bold">U</div>}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed",
                    msg.role === "assistant" ? "bg-zinc-900/50 text-zinc-200 shadow-xl" : "bg-primary text-primary-foreground font-medium"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Loader2 size={14} className="animate-spin text-primary" />
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-900/50 text-zinc-500 italic text-xs">
                    Mindex Intelligence is thinking...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Chat Input Floating */}
        <div className="absolute bottom-6 inset-x-0 px-6">
          <div className="max-w-2xl mx-auto bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-2 flex flex-col gap-2 shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-2 flex-1 px-2">
              <div className="flex-1 text-sm h-10 flex items-center text-zinc-400">
                {input || <span className="text-zinc-600 italic">Hỏi bất cứ điều gì về tài liệu này...</span>}
                <motion.div 
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-[2px] h-4 bg-primary ml-1"
                />
              </div>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-600">
                <Send size={16} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em] border-t border-white/5 pt-2">
              <span>• LOGIC</span>
              <span>• NHANH CHÓNG</span>
              <span>• CHUẨN XÁC</span>
              <Sparkles size={8} className="animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MockNavItem({ title, status, pinned, time, active }: { title: string, status?: string, pinned?: boolean, time?: string, active?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-xl transition-all border",
      active ? "bg-primary/10 border-primary/20" : "bg-white/[0.02] border-white/5"
    )}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1.5 truncate flex-1">
          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", status ? "bg-emerald-400" : "bg-zinc-600")} />
          <span className="text-[10px] font-bold truncate text-zinc-300">{title}</span>
        </div>
        {pinned && <div className="text-[6px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/10 px-1 rounded">PINNED</div>}
        {time && <span className="text-[8px] text-zinc-600 font-bold">{time}</span>}
      </div>
      <p className="text-[8px] text-zinc-500 truncate">Sẵn sàng để chat.</p>
    </div>
  );
}

function Sparkles({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
