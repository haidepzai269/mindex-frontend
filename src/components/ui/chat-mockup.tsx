"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Loader2,
  Plus,
  Search,
  Send,
  Star,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Language = "en" | "vi";

const MOCKUP_COPY = {
  en: {
    scenario: [
      {
        question: "How do I start the server and open the website?",
        answer: "Run `node server.js` first. Then open `http://localhost:3000` in your browser. You can start exploring immediately.",
      },
      {
        question: "How can Mindex help with my studies?",
        answer: "Mindex summarizes documents, extracts key points and creates practice questions from PDFs or slides, which can cut research time dramatically.",
      },
    ],
    inbox: "Inbox",
    searchPlaceholder: "Search documents...",
    nav: [
      { title: "Website Launch Guide.pdf", status: "READY", pinned: true },
      { title: "CCNA Roadmap.pdf", status: "READY", pinned: true },
      { title: "How to Read Source Code...", time: "12h left" },
      { title: "Detailed Report...", time: "643h left" },
    ],
    navReady: "Ready for chat.",
    documentTitle: "Website Launch Guide.pdf",
    overlayTitle: "Run `node server.js`",
    overlayBody: "to start the server. Then open `http://localhost:3000` in your browser to access the website.",
    thinking: "Mindex Intelligence is thinking...",
    inputPlaceholder: "Ask anything about this document...",
    footerTags: ["Logic", "Fast", "Precise"],
  },
  vi: {
    scenario: [
      {
        question: "Làm thế nào để khởi động server và mở website?",
        answer: "Hãy chạy `node server.js` trước. Sau đó mở `http://localhost:3000` trên trình duyệt là bạn có thể bắt đầu ngay.",
      },
      {
        question: "Mindex có thể hỗ trợ việc học của tôi như thế nào?",
        answer: "Mindex giúp tóm tắt tài liệu, trích xuất ý chính và tạo câu hỏi luyện tập từ PDF hoặc slide, nhờ đó giảm đáng kể thời gian nghiên cứu.",
      },
    ],
    inbox: "Hộp thư",
    searchPlaceholder: "Tìm tài liệu...",
    nav: [
      { title: "Hướng Dẫn Khởi Tạo Website.pdf", status: "SẴN SÀNG", pinned: true },
      { title: "Lộ Trình CCNA.pdf", status: "SẴN SÀNG", pinned: true },
      { title: "Cách Đọc Source Code...", time: "Còn 12 giờ" },
      { title: "Báo Cáo Chi Tiết...", time: "Còn 643 giờ" },
    ],
    navReady: "Sẵn sàng để chat.",
    documentTitle: "Hướng Dẫn Khởi Tạo Website.pdf",
    overlayTitle: "Chạy lệnh `node server.js`",
    overlayBody: "để khởi động server. Sau đó mở `http://localhost:3000` trên trình duyệt để truy cập website.",
    thinking: "Mindex Intelligence đang suy luận...",
    inputPlaceholder: "Hỏi bất cứ điều gì về tài liệu này...",
    footerTags: ["Logic", "Nhanh", "Chính xác"],
  },
};

export function ChatMockup({ lang = "en" }: { lang?: Language }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copy = MOCKUP_COPY[lang];

  useEffect(() => {
    let scenarioIndex = 0;
    let active = true;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    async function runLoop() {
      while (active) {
        setMessages([]);
        setInput("");
        setIsTyping(false);
        const current = copy.scenario[scenarioIndex];

        let typed = "";
        for (const char of current.question) {
          if (!active) {
            return;
          }
          typed += char;
          setInput(typed);
          await wait(42);
        }

        await wait(450);
        if (!active) {
          return;
        }

        setMessages([{ role: "user", content: current.question }]);
        setInput("");

        await wait(700);
        if (!active) {
          return;
        }

        setIsTyping(true);
        await wait(1300);
        if (!active) {
          return;
        }

        setMessages((previous) => [...previous, { role: "assistant", content: current.answer }]);
        setIsTyping(false);

        await wait(4600);
        scenarioIndex = (scenarioIndex + 1) % copy.scenario.length;
      }
    }

    runLoop();

    return () => {
      active = false;
    };
  }, [copy]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-xl border border-white/5 bg-[#050505] text-zinc-50 shadow-2xl">
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-white/5 bg-zinc-900/30 p-4 md:flex">
        <div className="mb-6 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
            {copy.inbox}
            <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_5px_rgba(184,41,255,1)]" />
          </h2>
          <Plus size={14} className="text-zinc-500" />
        </div>

        <div className="relative mb-4">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <div className="flex h-8 w-full items-center rounded-lg border border-white/5 bg-white/5 pl-8 text-[10px] text-zinc-600">
            {copy.searchPlaceholder}
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {copy.nav.map((item, index) => (
            <MockNavItem
              key={`${item.title}-${index}`}
              active={index === 0}
              title={item.title}
              status={item.status}
              pinned={item.pinned}
              time={item.time}
              readyText={copy.navReady}
            />
          ))}
        </div>
      </aside>

      <main className="relative flex h-full flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-white/[0.03] bg-black/40 px-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-primary opacity-60" />
              <h3 className="text-[12px] font-bold tracking-tight text-white">{copy.documentTitle}</h3>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-600">BY MINDEX INTELLIGENCE ENGINE</span>
              <div className="rounded border border-white/10 bg-white/5 px-1 py-0 text-[6px] font-black text-emerald-400">READY</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-zinc-500">
            <Star size={14} fill="#f59e0b" className="text-amber-500" />
            <Loader2 size={14} className="animate-spin opacity-20" />
          </div>
        </header>

        <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-6 pb-32 pt-10">
          <div className="pointer-events-none mb-4 max-w-2xl select-none space-y-4 opacity-10">
            <h1 className="text-xl font-bold">{copy.overlayTitle}</h1>
            <p className="text-sm">{copy.overlayBody}</p>
          </div>

          <div className="mx-auto max-w-2xl space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-4", message.role === "user" ? "flex-row-reverse" : "")}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      message.role === "assistant" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-white/5",
                    )}
                  >
                    {message.role === "assistant" ? <Zap size={14} className="fill-primary text-primary" /> : <div className="text-[10px] font-bold">U</div>}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed",
                      message.role === "assistant" ? "bg-zinc-900/50 text-zinc-200 shadow-xl" : "bg-primary font-medium text-primary-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Loader2 size={14} className="animate-spin text-primary" />
                  </div>
                  <div className="rounded-2xl bg-zinc-900/50 p-4 text-xs italic text-zinc-500">
                    {copy.thinking}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 p-2 shadow-2xl backdrop-blur-xl transition-all duration-500">
            <div className="flex flex-1 items-center gap-2 px-2">
              <div className="flex h-10 flex-1 items-center text-sm text-zinc-400">
                {input || <span className="italic text-zinc-600">{copy.inputPlaceholder}</span>}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="ml-1 h-4 w-[2px] bg-primary"
                />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-600">
                <Send size={16} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              {copy.footerTags.map((tag) => (
                <span key={tag}>* {tag}</span>
              ))}
              <SparkleGlyph size={8} className="animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MockNavItem({
  title,
  status,
  pinned,
  time,
  active,
  readyText,
}: {
  title: string;
  status?: string;
  pinned?: boolean;
  time?: string;
  active?: boolean;
  readyText: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3 transition-all", active ? "border-primary/20 bg-primary/10" : "border-white/5 bg-white/[0.02]")}>
      <div className="mb-1 flex items-start justify-between">
        <div className="flex flex-1 items-center gap-1.5 truncate">
          <div className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", status ? "bg-emerald-400" : "bg-zinc-600")} />
          <span className="truncate text-[10px] font-bold text-zinc-300">{title}</span>
        </div>
        {pinned && <div className="rounded border border-amber-500/10 bg-amber-500/10 px-1 text-[6px] font-black text-amber-500">PINNED</div>}
        {time && <span className="text-[8px] font-bold text-zinc-600">{time}</span>}
      </div>
      <p className="truncate text-[8px] text-zinc-500">{readyText}</p>
    </div>
  );
}

function SparkleGlyph({ size, className }: { size: number; className?: string }) {
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
