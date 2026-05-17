"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  GitBranch,
  Headphones,
  LineChart,
  LockKeyhole,
  MessageSquare,
  Network,
  Radio,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UploadCloud,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatMockup } from "@/components/ui/chat-mockup";
import { Glow } from "@/components/ui/glow";
import { LayoutLines } from "@/components/ui/layout-lines";
import { MockupFrame } from "@/components/ui/mockup-frame";
import { cn } from "@/lib/utils";

type Language = "vi" | "en";

const LANGUAGE_STORAGE_KEY = "mindex-home-language";

const HOME_CONTENT = {
  vi: {
    nav: {
      features: "Tính năng",
      product: "Sản phẩm",
      architecture: "Kiến trúc",
      plans: "Kế hoạch",
      login: "Đăng nhập",
      start: "Bắt đầu",
    },
    language: {
      switcher: "Ngôn ngữ",
      vi: "Tiếng Việt",
      en: "English",
      action: "Đổi ngôn ngữ",
    },
    hero: {
      badge: "Tầng trí tuệ tài liệu thế hệ mới",
      titlePrefix: "Bộ não đứng sau một",
      titleHighlight: "AI Study OS",
      description:
        "Mindex biến tài liệu học tập thành hệ sinh thái tri thức: chat RAG có trích dẫn, tóm tắt, quiz, flashcard, mindmap, audio overview, thư viện cộng đồng, phòng học thời gian thực và analytics tiến độ.",
      primaryCta: "Trải nghiệm Mindex",
      secondaryCta: "Xem product tour",
      stats: [
        { value: "10+", label: "Luồng AI" },
        { value: "2", label: "Chế độ Mindex" },
        { value: "RAG", label: "Truy xuất hybrid" },
        { value: "Realtime", label: "Học thời gian thực" },
      ],
      panelTitle: "Lõi thần kinh",
      panelItems: ["Tóm tắt đang phát", "Nguồn đã gắn", "Quiz đã sẵn sàng"],
    },
    featuresSection: {
      kicker: "Quan sát từ source",
      title: "Những tính năng đang chạy trong codebase",
      description: "Portfolio này không chỉ là landing page. Nội dung được lấy từ source hiện tại của Mindex frontend và Go backend.",
      pillars: [
        {
          eyebrow: "Ingest",
          title: "Tải lên một lần. Mindex dựng nên lớp nền tri thức học tập.",
          description:
            "Sinh viên tải PDF hoặc DOCX, sau đó Mindex xử lý Cloudinary upload, phân tích tài liệu, moderation, semantic chunking, enrichment, embedding và tiến trình trực tiếp.",
          icon: UploadCloud,
          accent: "text-sky-500",
          bg: "bg-sky-500/10",
          points: ["Tiến trình xử lý qua SSE", "Chunk có ngữ cảnh theo trang", "Luồng nạp tài liệu dựa trên Cloudinary"],
        },
        {
          eyebrow: "Understand",
          title: "Hỏi tài liệu như đang làm việc với một trợ lý nghiên cứu tập trung.",
          description:
            "Chat RAG phát luồng dùng trích dẫn, markdown, source card, voice input và lựa chọn model Mindex để biến tài liệu dày thành câu trả lời đáng tin.",
          icon: MessageSquare,
          accent: "text-violet-500",
          bg: "bg-violet-500/10",
          points: ["Luồng trả lời SSE", "Source card có trang và chunk match", "Chuyển Mindex-1 / Mindex-2"],
        },
        {
          eyebrow: "Practice",
          title: "Đi từ đọc sang ghi nhớ thật sự.",
          description:
            "Study Hub biến mỗi tài liệu thành flashcard, quiz, điểm mastery, mindmap và audio overview để việc học trở nên chủ động thay vì thụ động.",
          icon: BrainCircuit,
          accent: "text-emerald-500",
          bg: "bg-emerald-500/10",
          points: ["Flashcard có trạng thái ôn tập", "Quiz có số lần làm cấu hình được", "Mindmap + PDF split view"],
        },
        {
          eyebrow: "Collaborate",
          title: "Một lớp cộng đồng cho việc học chung.",
          description:
            "Mindex kết hợp thư viện công khai, đóng góp hồ sơ cá nhân và phòng học nhóm thời gian thực nơi sinh viên có thể chia sẻ tài liệu, mention MindexAI và học cùng nhau.",
          icon: Users,
          accent: "text-amber-500",
          bg: "bg-amber-500/10",
          points: ["Tìm kiếm hybrid trong cộng đồng", "Chat phòng học qua WebSocket", "Tài liệu chia sẻ và liên kết mời"],
        },
      ],
    },
    productSection: {
      kicker: "Hệ sản phẩm",
      title: "Một hành trình học tập liền mạch",
      description: "Từ upload đến mastery, Mindex dùng cùng một lớp tri thức để tạo ra nhiều trải nghiệm học tập.",
      timeline: [
        {
          step: "01",
          title: "Thu thập",
          body: "Tải lên, presign, xử lý và phân loại tài liệu học tập với phản hồi trực tiếp.",
        },
        {
          step: "02",
          title: "Lập chỉ mục",
          body: "Trích xuất chunk có cấu trúc, làm giàu ngữ cảnh và embed vào lớp truy xuất.",
        },
        {
          step: "03",
          title: "Suy luận",
          body: "Định tuyến yêu cầu qua các nhà cung cấp AI của Mindex, phát luồng câu trả lời và đính kèm trích dẫn.",
        },
        {
          step: "04",
          title: "Thành thạo",
          body: "Chuyển cùng một nền tri thức thành bài luyện tập, audio, analytics và kế hoạch học.",
        },
      ],
      chat: {
        title: "Trò chuyện với tài liệu",
        eyebrow: "Giao diện RAG",
        streamLabel: "Mindex AI phát luồng",
        prompt: '"Giải thích chương này và chỉ ra 3 khái niệm trọng tâm."',
        response: "Đang tổng hợp từ 8 chunk liên quan... kết quả gồm tóm tắt, ví dụ và nguồn theo trang.",
        sources: ["Trang 12 - khớp 94%", "Trang 18 - khớp 88%", "Trang 23 - khớp 81%"],
      },
      studyHub: {
        title: "Study Hub",
        eyebrow: "Bộ công cụ luyện tập",
        tools: [
          { label: "Tóm tắt nhanh / học thuật / chuyên sâu", icon: FileText, tone: "text-sky-500" },
          { label: "Trích xuất từ khóa, công thức, mốc thời gian", icon: Search, tone: "text-amber-500" },
          { label: "Mindmap tương tác bằng React Flow", icon: Network, tone: "text-emerald-500" },
          { label: "Audio Overview dạng podcast", icon: Headphones, tone: "text-blue-500" },
          { label: "Flashcard có lịch ôn", icon: BookOpen, tone: "text-violet-500" },
          { label: "Sinh quiz và chấm điểm", icon: Trophy, tone: "text-rose-500" },
        ],
      },
      analytics: {
        title: "Learning Analytics",
        eyebrow: "Vòng lặp mastery",
        masteryLabel: "Mastery",
        stats: ["Chuỗi ngày", "Huy hiệu", "Kế hoạch"],
      },
    },
    architectureSection: {
      kicker: "Portfolio kỹ thuật",
      title: "Kiến trúc đủ để scale một AI learning platform",
      description: "Frontend, backend, realtime, retrieval, queue, billing và admin observability được tách thành các lớp rõ ràng.",
      stack: [
        { label: "Next.js 15 + React 19", icon: Workflow },
        { label: "Go Gin API", icon: Server },
        { label: "PostgreSQL + pgvector", icon: Database },
        { label: "Redis cache và queue", icon: Radio },
        { label: "Lớp file Cloudinary", icon: Cloud },
        { label: "Bộ điều phối AI đa nhà cung cấp", icon: GitBranch },
      ],
      orchestrator: {
        kicker: "AI Orchestrator",
        title: "Fallback theo từng dịch vụ",
        services: ["CHAT", "SUMMARY", "CLASSIFY", "SEARCH", "AUDIO"],
        description: "Fallback giữa NineRouter, Gemini, Groq, Cerebras, Mistral và OpenRouter theo đúng dịch vụ.",
      },
      operationsKicker: "Lớp vận hành",
      operations: [
        { label: "Admin System Health", icon: BarChart3 },
        { label: "AI Quality Monitor", icon: ShieldCheck },
        { label: "Billing với PayOS", icon: Star },
        { label: "Notifications và worker hết hạn", icon: LockKeyhole },
      ],
    },
    visualSection: {
      kicker: "Ngôn ngữ thị giác",
      title: "Thương hiệu Mindex: sạch, phát sáng, chính xác",
      description: "Portfolio dùng tím Mindex làm trục chính, thêm emerald cho tri thức, amber cho mastery và rose cho Ultra hoặc tín hiệu cảnh báo.",
      palette: [
        { name: "Primary", color: "bg-primary", purpose: "Hành động AI cốt lõi" },
        { name: "Emerald", color: "bg-emerald-500", purpose: "Tri thức đã sẵn sàng" },
        { name: "Amber", color: "bg-amber-500", purpose: "Mastery và phần thưởng" },
        { name: "Rose", color: "bg-rose-500", purpose: "Ultra và cảnh báo" },
      ],
    },
    plansSection: {
      kicker: "Sẵn sàng cho portfolio",
      title: "Từ source code thành câu chuyện sản phẩm rõ ràng.",
      description: "Landing page này biến các module thật của Mindex thành một portfolio có thể dùng để demo, pitch sản phẩm hoặc làm trang giới thiệu public.",
      checklist: [
        "AI document intelligence",
        "Bộ công cụ học chủ động",
        "Cộng tác thời gian thực",
        "Quan sát hệ thống cấp độ admin",
      ],
      primaryCta: "Bắt đầu miễn phí",
      secondaryCta: "Đăng nhập",
    },
    footer: {
      tagline: "Lớp trí tuệ dành cho đời sống học thuật.",
      features: "Tính năng",
      architecture: "Kiến trúc",
      start: "Bắt đầu",
    },
  },
  en: {
    nav: {
      features: "Features",
      product: "Product",
      architecture: "Architecture",
      plans: "Plans",
      login: "Log in",
      start: "Start free",
    },
    language: {
      switcher: "Language",
      vi: "Vietnamese",
      en: "English",
      action: "Switch language",
    },
    hero: {
      badge: "Next-gen document intelligence",
      titlePrefix: "Portfolio for an",
      titleHighlight: "AI Study OS",
      description:
        "Mindex turns learning documents into a knowledge ecosystem: cited RAG chat, summaries, quizzes, flashcards, mindmaps, audio overview, community libraries, realtime study rooms and progress analytics.",
      primaryCta: "Try Mindex",
      secondaryCta: "View product tour",
      stats: [
        { value: "10+", label: "AI workflows" },
        { value: "2", label: "Mindex modes" },
        { value: "RAG", label: "Hybrid retrieval" },
        { value: "Realtime", label: "Live learning" },
      ],
      panelTitle: "Neural core",
      panelItems: ["Summary streamed", "Sources attached", "Quiz ready"],
    },
    featuresSection: {
      kicker: "Observed from source",
      title: "The features already running in the codebase",
      description: "This portfolio is not just a landing page. Its content is grounded in the current Mindex frontend and Go backend source.",
      pillars: [
        {
          eyebrow: "Ingest",
          title: "Upload once. Mindex builds the learning substrate.",
          description:
            "Students upload PDF or DOCX, then Mindex handles Cloudinary upload, document parsing, moderation, semantic chunking, enrichment, embedding and live progress.",
          icon: UploadCloud,
          accent: "text-sky-500",
          bg: "bg-sky-500/10",
          points: ["SSE processing progress", "Structured chunks with page context", "Cloudinary-backed document intake"],
        },
        {
          eyebrow: "Understand",
          title: "Ask documents like a focused research assistant.",
          description:
            "Streaming RAG chat uses citations, markdown, source cards, voice input and selectable Mindex models to turn dense documents into answers students can trust.",
          icon: MessageSquare,
          accent: "text-violet-500",
          bg: "bg-violet-500/10",
          points: ["Streaming SSE answer flow", "Source cards with page and chunk match", "Mindex-1 / Mindex-2 switch"],
        },
        {
          eyebrow: "Practice",
          title: "Move from reading to retention.",
          description:
            "Study Hub turns every document into flashcards, quizzes, mastery scores, mindmaps and audio overviews so learning becomes active instead of passive.",
          icon: BrainCircuit,
          accent: "text-emerald-500",
          bg: "bg-emerald-500/10",
          points: ["Flashcards with review state", "Configurable quiz attempts", "Mindmap + PDF split view"],
        },
        {
          eyebrow: "Collaborate",
          title: "A community layer for shared learning.",
          description:
            "Mindex combines public libraries, profile contributions and realtime group rooms where students can share documents, mention MindexAI and study together.",
          icon: Users,
          accent: "text-amber-500",
          bg: "bg-amber-500/10",
          points: ["Community hybrid search", "Room WebSocket chat", "Shared docs and invite links"],
        },
      ],
    },
    productSection: {
      kicker: "Product system",
      title: "One continuous learning journey",
      description: "From upload to mastery, Mindex uses one shared knowledge layer to create multiple learning experiences.",
      timeline: [
        {
          step: "01",
          title: "Capture",
          body: "Upload, presign, process and classify learning material with live feedback.",
        },
        {
          step: "02",
          title: "Index",
          body: "Extract structured chunks, enrich context and embed them into the retrieval layer.",
        },
        {
          step: "03",
          title: "Reason",
          body: "Route requests through Mindex AI providers, stream answers and attach citations.",
        },
        {
          step: "04",
          title: "Master",
          body: "Turn the same knowledge base into practice, audio, analytics and study plans.",
        },
      ],
      chat: {
        title: "Document Chat",
        eyebrow: "RAG interface",
        streamLabel: "Mindex AI streaming",
        prompt: '"Explain this chapter and surface 3 core concepts."',
        response: "Synthesizing 8 relevant chunks... the result combines a summary, examples and page-level sources.",
        sources: ["Page 12 - 94% match", "Page 18 - 88% match", "Page 23 - 81% match"],
      },
      studyHub: {
        title: "Study Hub",
        eyebrow: "Practice tools",
        tools: [
          { label: "Quick / Academic / Deep summary", icon: FileText, tone: "text-sky-500" },
          { label: "Keyword, formula and timeline extract", icon: Search, tone: "text-amber-500" },
          { label: "Interactive React Flow mindmap", icon: Network, tone: "text-emerald-500" },
          { label: "Audio Overview podcast mode", icon: Headphones, tone: "text-blue-500" },
          { label: "Flashcards with review schedule", icon: BookOpen, tone: "text-violet-500" },
          { label: "Quiz generation and scoring", icon: Trophy, tone: "text-rose-500" },
        ],
      },
      analytics: {
        title: "Learning Analytics",
        eyebrow: "Mastery loop",
        masteryLabel: "Mastery",
        stats: ["Streak", "Badges", "Plans"],
      },
    },
    architectureSection: {
      kicker: "Technical portfolio",
      title: "An architecture built to scale an AI learning platform",
      description: "Frontend, backend, realtime, retrieval, queues, billing and admin observability are separated into clear layers.",
      stack: [
        { label: "Next.js 15 + React 19", icon: Workflow },
        { label: "Go Gin API", icon: Server },
        { label: "PostgreSQL + pgvector", icon: Database },
        { label: "Redis cache and queues", icon: Radio },
        { label: "Cloudinary file layer", icon: Cloud },
        { label: "Multi-provider AI orchestrator", icon: GitBranch },
      ],
      orchestrator: {
        kicker: "AI Orchestrator",
        title: "Provider fallback by service",
        services: ["CHAT", "SUMMARY", "CLASSIFY", "SEARCH", "AUDIO"],
        description: "Fallback between NineRouter, Gemini, Groq, Cerebras, Mistral and OpenRouter based on service type.",
      },
      operationsKicker: "Operational layer",
      operations: [
        { label: "Admin System Health", icon: BarChart3 },
        { label: "AI Quality Monitor", icon: ShieldCheck },
        { label: "Billing with PayOS", icon: Star },
        { label: "Notifications and expiry workers", icon: LockKeyhole },
      ],
    },
    visualSection: {
      kicker: "Visual language",
      title: "Mindex brand: clean, luminous, precise",
      description: "The portfolio uses Mindex purple as the main axis, with emerald for knowledge, amber for mastery and rose for Ultra or alert signals.",
      palette: [
        { name: "Primary", color: "bg-primary", purpose: "Core AI actions" },
        { name: "Emerald", color: "bg-emerald-500", purpose: "Knowledge ready" },
        { name: "Amber", color: "bg-amber-500", purpose: "Mastery and reward" },
        { name: "Rose", color: "bg-rose-500", purpose: "Ultra and alerts" },
      ],
    },
    plansSection: {
      kicker: "Portfolio ready",
      title: "Turn source code into a clear product story.",
      description: "This landing page turns Mindex's real modules into a portfolio that can be used for demos, product pitches or a public-facing introduction.",
      checklist: ["AI document intelligence", "Active learning toolkit", "Realtime collaboration", "Admin-grade observability"],
      primaryCta: "Start free",
      secondaryCta: "Log in",
    },
    footer: {
      tagline: "The intelligent layer for academic life.",
      features: "Features",
      architecture: "Architecture",
      start: "Get started",
    },
  },
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>("vi");
  const [orbRotation, setOrbRotation] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const storedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang === "vi" || storedLang === "en") {
      setLang(storedLang);
      setOrbRotation(storedLang === "vi" ? 0 : 180);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollHeight <= 0 ? 0 : Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      setScrollProgress(nextProgress);
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, [lang, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  const copy = HOME_CONTENT[lang];

  const toggleLanguage = () => {
    setLang((current) => (current === "vi" ? "en" : "vi"));
    setOrbRotation((current) => current + 540);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressRadius = 24;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference - (scrollProgress / 100) * progressCircumference;

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(16,185,129,0.14),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background))_62%,hsl(var(--muted)))]" />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-5">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_30px_hsl(var(--primary)/0.18)]">
              <BookOpen className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-background" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">Mindex</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">AI Study OS</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">{copy.nav.features}</Link>
            <Link href="#product" className="transition-colors hover:text-foreground">{copy.nav.product}</Link>
            <Link href="#architecture" className="transition-colors hover:text-foreground">{copy.nav.architecture}</Link>
            <Link href="#plans" className="transition-colors hover:text-foreground">{copy.nav.plans}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">{copy.nav.login}</Button>
            </Link>
            <LanguageOrb
              lang={lang}
              rotation={orbRotation}
              labels={copy.language}
              onToggle={toggleLanguage}
            />
            <Link href="/register">
              <Button size="sm" className="font-bold shadow-lg shadow-primary/20">{copy.nav.start}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-20 pt-28 md:pb-28 md:pt-36">
          <LayoutLines className="opacity-50" />
          <Glow className="left-1/2 top-20 h-[420px] w-[720px] -translate-x-1/2 opacity-40" />
          <div className="container relative z-10 mx-auto">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="max-w-3xl"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-[12px] font-black uppercase tracking-[0.18em] text-muted-foreground shadow-sm backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {copy.hero.badge}
                </div>
                <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.06em] md:text-7xl lg:text-8xl">
                  {copy.hero.titlePrefix}{" "}
                  <span className="bg-gradient-to-r from-primary via-emerald-500 to-sky-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
                    {copy.hero.titleHighlight}
                  </span>
                </h1>
                <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-muted-foreground md:text-lg">
                  {copy.hero.description}
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="h-13 rounded-2xl px-7 font-black shadow-xl shadow-primary/20">
                      {copy.hero.primaryCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#product">
                    <Button size="lg" variant="outline" className="h-13 rounded-2xl px-7 font-black">
                      {copy.hero.secondaryCta}
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
                  {copy.hero.stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
                      <div className="text-2xl font-black tracking-tight text-foreground">{stat.value}</div>
                      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="relative"
              >
                <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-primary/20 via-emerald-500/10 to-sky-500/10 blur-3xl" />
                <MockupFrame className="relative overflow-hidden rounded-[2rem]">
                  <div className="aspect-[16/11] overflow-hidden">
                    <ChatMockup lang={lang} />
                  </div>
                </MockupFrame>
                <div className="absolute -bottom-6 -left-4 hidden w-56 rounded-3xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur md:block">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.hero.panelTitle}
                  </div>
                  <div className="space-y-2">
                    {copy.hero.panelItems.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-border/60 bg-card/45 px-5 py-16 backdrop-blur">
          <ScrollFade>
            <div className="container mx-auto">
            <SectionHeader
              kicker={copy.featuresSection.kicker}
              title={copy.featuresSection.title}
              description={copy.featuresSection.description}
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {copy.featuresSection.pillars.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.65, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start gap-5">
                    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border", feature.bg, feature.accent)}>
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">{feature.eyebrow}</div>
                      <h3 className="mt-2 text-2xl font-black tracking-tight">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    {feature.points.map((point) => (
                      <div key={point} className="rounded-2xl border border-border/60 bg-muted/35 px-3 py-2 text-xs font-bold text-muted-foreground">
                        {point}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            </div>
          </ScrollFade>
        </section>

        <section id="product" className="px-5 py-24">
          <ScrollFade>
            <div className="container mx-auto">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1fr] lg:items-start">
              <div className="lg:sticky lg:top-24">
                <SectionHeader
                  align="left"
                  kicker={copy.productSection.kicker}
                  title={copy.productSection.title}
                  description={copy.productSection.description}
                />
                <div className="mt-8 space-y-4">
                  {copy.productSection.timeline.map((item) => (
                    <div key={item.step} className="group flex gap-4 rounded-3xl border border-border/60 bg-card/65 p-4 backdrop-blur transition-all hover:border-primary/30">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-black tracking-tight">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <ExperienceCard
                  title={copy.productSection.chat.title}
                  eyebrow={copy.productSection.chat.eyebrow}
                  icon={<Bot className="h-5 w-5" />}
                  className="bg-[#050505] text-white"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-violet-300">
                        <Zap className="h-3.5 w-3.5 fill-violet-300" />
                        {copy.productSection.chat.streamLabel}
                      </div>
                      <p className="text-sm leading-7 text-white/70">
                        {copy.productSection.chat.prompt}
                      </p>
                      <div className="rounded-2xl bg-primary/15 p-4 text-sm leading-7 text-white/85">
                        {copy.productSection.chat.response}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {copy.productSection.chat.sources.map((source) => (
                        <div key={source} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-bold text-white/60">
                          <FileText className="mb-2 h-4 w-4 text-emerald-300" />
                          {source}
                        </div>
                      ))}
                    </div>
                  </div>
                </ExperienceCard>

                <div className="grid gap-5 md:grid-cols-2">
                  <ExperienceCard
                    title={copy.productSection.studyHub.title}
                    eyebrow={copy.productSection.studyHub.eyebrow}
                    icon={<BrainCircuit className="h-5 w-5" />}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {copy.productSection.studyHub.tools.map((tool) => (
                        <div key={tool.label} className="rounded-2xl border border-border/60 bg-muted/35 p-3">
                          <tool.icon className={cn("mb-3 h-5 w-5", tool.tone)} />
                          <div className="text-xs font-black leading-5">{tool.label}</div>
                        </div>
                      ))}
                    </div>
                  </ExperienceCard>

                  <ExperienceCard
                    title={copy.productSection.analytics.title}
                    eyebrow={copy.productSection.analytics.eyebrow}
                    icon={<LineChart className="h-5 w-5" />}
                  >
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 to-emerald-500/10 p-5">
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{copy.productSection.analytics.masteryLabel}</div>
                            <div className="mt-1 text-4xl font-black">84%</div>
                          </div>
                          <Trophy className="h-9 w-9 text-amber-500" />
                        </div>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-background/70">
                          <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-primary to-emerald-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {copy.productSection.analytics.stats.map((item) => (
                          <div key={item} className="rounded-2xl border border-border/60 bg-card p-3 text-xs font-black text-muted-foreground">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </ExperienceCard>
                </div>
              </div>
            </div>
            </div>
          </ScrollFade>
        </section>

        <section id="architecture" className="relative overflow-hidden border-y border-border/60 bg-[#06060a] px-5 py-24 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.24),transparent_28%),radial-gradient(circle_at_90%_30%,rgba(16,185,129,0.16),transparent_26%)]" />
          <LayoutLines className="opacity-20" />
          <ScrollFade className="relative z-10">
            <div className="container relative z-10 mx-auto">
            <SectionHeader
              kicker={copy.architectureSection.kicker}
              title={copy.architectureSection.title}
              description={copy.architectureSection.description}
              dark
            />

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {copy.architectureSection.stack.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.58, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.07]"
                >
                  <item.icon className="mb-5 h-7 w-7 text-violet-300" />
                  <div className="text-lg font-black tracking-tight">{item.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-violet-200">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">{copy.architectureSection.orchestrator.kicker}</div>
                    <h3 className="text-xl font-black">{copy.architectureSection.orchestrator.title}</h3>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {copy.architectureSection.orchestrator.services.map((service) => (
                    <div key={service} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs font-black text-violet-300">{service}</div>
                      <div className="mt-2 text-sm text-white/60">{copy.architectureSection.orchestrator.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur">
                <div className="mb-6 text-[11px] font-black uppercase tracking-[0.22em] text-white/40">{copy.architectureSection.operationsKicker}</div>
                <div className="space-y-4">
                  {copy.architectureSection.operations.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <item.icon className="h-5 w-5 text-emerald-300" />
                      <span className="text-sm font-bold text-white/75">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </ScrollFade>
        </section>

        <section className="px-5 py-24">
          <ScrollFade>
            <div className="container mx-auto">
            <SectionHeader
              kicker={copy.visualSection.kicker}
              title={copy.visualSection.title}
              description={copy.visualSection.description}
            />
            <div className="mt-10 grid gap-5 md:grid-cols-4">
              {copy.visualSection.palette.map((item) => (
                <div key={item.name} className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
                  <div className={cn("mb-5 h-24 rounded-3xl", item.color)} />
                  <div className="font-black">{item.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.purpose}</div>
                </div>
              ))}
            </div>
            </div>
          </ScrollFade>
        </section>

        <section id="plans" className="px-5 pb-24">
          <ScrollFade>
            <div className="container mx-auto">
            <div className="relative overflow-hidden rounded-[3rem] bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20 md:p-14">
              <LayoutLines className="opacity-20" />
              <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.plansSection.kicker}
                  </div>
                  <h2 className="text-4xl font-black leading-tight tracking-[-0.04em] md:text-6xl">
                    {copy.plansSection.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-primary-foreground/70">
                    {copy.plansSection.description}
                  </p>
                </div>
                <div className="rounded-[2rem] border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur">
                  {copy.plansSection.checklist.map((item) => (
                    <div key={item} className="flex items-center gap-3 border-b border-primary-foreground/10 py-4 last:border-b-0">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-bold">{item}</span>
                    </div>
                  ))}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href="/register" className="flex-1">
                      <Button variant="secondary" className="w-full rounded-2xl font-black">{copy.plansSection.primaryCta}</Button>
                    </Link>
                    <Link href="/login" className="flex-1">
                      <Button variant="outline" className="w-full rounded-2xl border-primary-foreground/25 bg-transparent font-black text-primary-foreground hover:bg-primary-foreground/10">
                        {copy.plansSection.secondaryCta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </ScrollFade>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background px-5 py-10">
        <ScrollFade>
          <div className="container mx-auto flex flex-col justify-between gap-5 text-sm text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-card text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="font-black text-foreground">Mindex</div>
              <div className="text-xs">{copy.footer.tagline}</div>
            </div>
          </div>
          <div className="flex gap-5">
            <Link href="#features" className="hover:text-foreground">{copy.footer.features}</Link>
            <Link href="#architecture" className="hover:text-foreground">{copy.footer.architecture}</Link>
            <Link href="/register" className="hover:text-foreground">{copy.footer.start}</Link>
          </div>
          </div>
        </ScrollFade>
      </footer>

      <motion.button
        type="button"
        onClick={handleScrollToTop}
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: scrollProgress > 3 ? 1 : 0.72, scale: scrollProgress > 3 ? 1 : 0.94, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-5 right-5 z-[60] flex h-16 w-16 items-center justify-center rounded-full border border-white/12 bg-black/85 text-white shadow-[0_12px_30px_rgba(0,0,0,0.42),0_0_24px_rgba(168,85,247,0.16)] backdrop-blur-xl transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6"
        aria-label="Scroll to top"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r={progressRadius} className="fill-none stroke-white/10" strokeWidth="4" />
          <motion.circle
            cx="32"
            cy="32"
            r={progressRadius}
            className="fill-none stroke-emerald-400"
            strokeWidth="4"
            strokeLinecap="round"
            initial={false}
            animate={{ strokeDashoffset: progressOffset }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            strokeDasharray={progressCircumference}
          />
        </svg>
        <span className="relative flex flex-col items-center justify-center">
          <ArrowUp className="mb-0.5 h-3.5 w-3.5" />
          <span className="text-[11px] font-black tracking-tight">{Math.round(scrollProgress)}%</span>
        </span>
      </motion.button>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  description,
  align = "center",
  dark = false,
}: {
  kicker: string;
  title: string;
  description: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl", align === "center" ? "text-center" : "text-left lg:mx-0")}>
      <div className={cn("mb-3 text-[11px] font-black uppercase tracking-[0.24em]", dark ? "text-violet-300" : "text-primary")}>
        {kicker}
      </div>
      <h2 className={cn("text-3xl font-black tracking-[-0.04em] md:text-5xl", dark ? "text-white" : "text-foreground")}>{title}</h2>
      <p className={cn("mt-5 text-base leading-8", dark ? "text-white/55" : "text-muted-foreground")}>{description}</p>
    </div>
  );
}

function ExperienceCard({
  title,
  eyebrow,
  icon,
  children,
  className,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.24, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur", className)}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{eyebrow}</div>
          <h3 className="mt-1 text-xl font-black tracking-tight">{title}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-current/10 bg-current/10 text-primary">
          {icon}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function LanguageOrb({
  lang,
  rotation,
  labels,
  onToggle,
}: {
  lang: Language;
  rotation: number;
  labels: {
    switcher: string;
    vi: string;
    en: string;
    action: string;
  };
  onToggle: () => void;
}) {
  return (
    <div className="shrink-0">
      <div className="relative [perspective:1400px]">
        <motion.button
          type="button"
          onClick={onToggle}
          aria-label={labels.action}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="relative h-11 w-11 rounded-full border border-white/18 bg-[radial-gradient(circle_at_30%_26%,rgba(48,48,56,0.96),rgba(12,12,14,0.98)_62%,rgba(3,3,4,1)_100%)] shadow-[0_10px_22px_rgba(0,0,0,0.45),0_0_24px_rgba(168,85,247,0.12)] sm:h-12 sm:w-12"
        >
          <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_220deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01),rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
          <span className="absolute inset-[2px] rounded-full border border-white/12 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0.03)_42%,rgba(5,5,7,0.98)_100%)]" />
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
            className="absolute inset-[4px] rounded-full border border-dashed border-white/10"
          />
          <motion.span
            animate={{ rotateY: rotation, rotateX: 16 }}
            transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className="absolute inset-[6px] block rounded-full"
          >
            <OrbFace short="VI" />
            <OrbFace
              short="EN"
              className="[transform:rotateY(180deg)_translateZ(18px)]"
            />
          </motion.span>
          <span className="absolute inset-x-2.5 top-1.5 h-2.5 rounded-full bg-white/18 blur-sm" />
          <span className="absolute bottom-1 left-1/2 h-2.5 w-6 -translate-x-1/2 rounded-full bg-black/40 blur-md" />
        </motion.button>
      </div>
    </div>
  );
}

function OrbFace({
  short,
  className,
}: {
  short: string;
  className?: string;
}) {
  return (
    <span
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
      className={cn(
        "absolute inset-0 flex rounded-full border border-white/12 bg-[radial-gradient(circle_at_38%_28%,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_38%,rgba(6,6,8,0.98)_100%)] p-1.5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.12),inset_0_-12px_22px_rgba(0,0,0,0.5)] [transform:translateZ(18px)]",
        className,
      )}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-center shadow-[inset_0_6px_16px_rgba(255,255,255,0.06)]">
        <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white sm:text-xs">
          {short}
        </span>
      </span>
    </span>
  );
}

function ScrollFade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
