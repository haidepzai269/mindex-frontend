"use client";

import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Cloud,
  Database,
  FileText,
  GitBranch,
  Headphones,
  Menu,
  MessageSquare,
  Network,
  Radio,
  Search,
  Server,
  Trophy,
  UploadCloud,
  Users,
  Workflow,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Language = "vi" | "en";

const LANG_KEY = "mindex-home-language";

const SPLINE_URL =
  "https://prod.spline.design/qPES22RpqZYjLUM7/scene.splinecode";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BrainCircuit className="h-8 w-8 text-primary/40" />
        </div>
      </div>
    </div>
  ),
});

function SplineWithFallback({ className }: { className?: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <div className="absolute -inset-12 rounded-full bg-primary/[0.03] blur-[60px]" />
          <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-border/50 bg-card/50">
            <BrainCircuit className="h-16 w-16 text-primary/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Spline scene={SPLINE_URL} onError={() => setError(true)} />
    </div>
  );
}

const CONTENT = {
  vi: {
    nav: {
      features: "Tính năng",
      product: "Sản phẩm",
      stack: "Kiến trúc",
      login: "Đăng nhập",
      start: "Bắt đầu",
    },
    hero: {
      title: "Biến tài liệu thành",
      titleAccent: "tri thức",
      subtitle:
        "Lớp trí tuệ cho việc học: chat AI có trích dẫn, tóm tắt, quiz, flashcard, mindmap và phòng học nhóm.",
      cta: "Bắt đầu miễn phí",
      ctaSecondary: "Xem sản phẩm",
    },
    features: {
      eyebrow: "Tính năng",
      title: "Bốn trụ cột",
      items: [
        {
          title: "Tải lên, Mindex xử lý",
          description:
            "Sinh viên tải PDF hoặc DOCX. Mindex xử lý upload, phân tích, semantic chunking, embedding và phản hồi tiến trình qua SSE.",
          icon: UploadCloud,
        },
        {
          title: "Hỏi tài liệu, nhận trích dẫn",
          description:
            "Chat RAG phát luồng câu trả lời kèm trích dẫn theo trang, markdown, source card và chuyển đổi model Mindex.",
          icon: MessageSquare,
        },
        {
          title: "Từ đọc sang ghi nhớ",
          description:
            "Study Hub biến tài liệu thành flashcard, quiz có chấm điểm, mindmap tương tác và audio overview dạng podcast.",
          icon: BrainCircuit,
        },
        {
          title: "Học cùng cộng đồng",
          description:
            "Thư viện công khai, phòng học nhóm thời gian thực qua WebSocket và chia sẻ tài liệu bằng liên kết mời.",
          icon: Users,
        },
      ],
    },
    product: {
      eyebrow: "Sản phẩm",
      title: "Một lớp tri thức, nhiều cách học",
      description:
        "Mindex dùng cùng một lớp tri thức để tạo nhiều công cụ học tập cho mỗi tài liệu.",
      tools: [
        { label: "Tóm tắt nhanh, học thuật, chuyên sâu", icon: FileText },
        {
          label: "Trích xuất từ khóa, công thức, mốc thời gian",
          icon: Search,
        },
        { label: "Mindmap tương tác", icon: Network },
        { label: "Audio Overview dạng podcast", icon: Headphones },
        { label: "Flashcard có lịch ôn tập", icon: BookOpen },
        { label: "Quiz và chấm điểm tự động", icon: Trophy },
      ],
    },
    stack: {
      title: "Kiến trúc kỹ thuật",
      description: "Frontend, backend, AI và infrastructure phân lớp rõ ràng.",
      items: [
        { label: "Next.js 15 + React 19", icon: Workflow },
        { label: "Go Gin API", icon: Server },
        { label: "PostgreSQL + pgvector", icon: Database },
        { label: "Redis cache và queue", icon: Radio },
        { label: "Cloudinary", icon: Cloud },
        { label: "AI Orchestrator đa nhà cung cấp", icon: GitBranch },
      ],
    },
    cta: {
      title: "Bắt đầu xây dựng tri thức",
      subtitle:
        "Tạo tài khoản miễn phí và khám phá toàn bộ hệ sinh thái Mindex.",
      button: "Tạo tài khoản",
    },
    footer: {
      tagline: "Lớp trí tuệ cho việc học.",
    },
    langSwitch: "English",
  },
  en: {
    nav: {
      features: "Features",
      product: "Product",
      stack: "Architecture",
      login: "Log in",
      start: "Get started",
    },
    hero: {
      title: "Turn documents into",
      titleAccent: "knowledge",
      subtitle:
        "The intelligence layer for learning: cited AI chat, summaries, quizzes, flashcards, mindmaps and group study rooms.",
      cta: "Start free",
      ctaSecondary: "See product",
    },
    features: {
      eyebrow: "Capabilities",
      title: "Four pillars",
      items: [
        {
          title: "Upload once, Mindex handles the rest",
          description:
            "Students upload PDF or DOCX. Mindex handles upload, parsing, semantic chunking, embedding and live SSE progress.",
          icon: UploadCloud,
        },
        {
          title: "Ask documents, get cited answers",
          description:
            "Streaming RAG chat returns answers with page-level citations, markdown, source cards and Mindex model switching.",
          icon: MessageSquare,
        },
        {
          title: "From reading to retention",
          description:
            "Study Hub turns documents into flashcards, scored quizzes, interactive mindmaps and podcast-style audio overviews.",
          icon: BrainCircuit,
        },
        {
          title: "Learn with the community",
          description:
            "Public libraries, realtime WebSocket study rooms and document sharing via invite links.",
          icon: Users,
        },
      ],
    },
    product: {
      eyebrow: "Product",
      title: "One knowledge layer, many ways to learn",
      description:
        "Mindex uses one shared knowledge layer to power different learning tools for every document.",
      tools: [
        { label: "Quick, academic and deep summary", icon: FileText },
        { label: "Keyword, formula and timeline extraction", icon: Search },
        { label: "Interactive mindmap", icon: Network },
        { label: "Audio Overview podcast mode", icon: Headphones },
        { label: "Flashcards with review schedule", icon: BookOpen },
        { label: "Quiz generation and auto-scoring", icon: Trophy },
      ],
    },
    stack: {
      title: "Technical architecture",
      description:
        "Frontend, backend, AI and infrastructure in clearly separated layers.",
      items: [
        { label: "Next.js 15 + React 19", icon: Workflow },
        { label: "Go Gin API", icon: Server },
        { label: "PostgreSQL + pgvector", icon: Database },
        { label: "Redis cache and queues", icon: Radio },
        { label: "Cloudinary", icon: Cloud },
        { label: "Multi-provider AI orchestrator", icon: GitBranch },
      ],
    },
    cta: {
      title: "Start building knowledge",
      subtitle: "Create a free account and explore the full Mindex ecosystem.",
      button: "Create account",
    },
    footer: {
      tagline: "The intelligence layer for learning.",
    },
    langSwitch: "Tiếng Việt",
  },
};

function CursorGlow() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const smoothX = useSpring(x, { stiffness: 150, damping: 20, mass: 0.5 });
  const smoothY = useSpring(y, { stiffness: 150, damping: 20, mass: 0.5 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    },
    [x, y]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
      style={{
        background: "transparent",
      }}
    >
      <motion.div
        className="absolute h-[300px] w-[300px] rounded-full"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

export default function HomePageClient() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>("vi");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0] === "Missing property") return;
      orig.apply(console, args);
    };
    return () => {
      console.error = orig;
    };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === "vi" || stored === "en") setLang(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) window.localStorage.setItem(LANG_KEY, lang);
  }, [lang, mounted]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (!mounted) return <div className="min-h-[100dvh] bg-background" />;

  const t = CONTENT[lang];
  const toggleLang = () => setLang((l) => (l === "vi" ? "en" : "vi"));

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <CursorGlow />
        {/* ── Nav ── */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
          <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-primary/20 bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight">Mindex</span>
            </Link>

            <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a
                href="#features"
                className="transition-colors hover:text-foreground"
              >
                {t.nav.features}
              </a>
              <a
                href="#product"
                className="transition-colors hover:text-foreground"
              >
                {t.nav.product}
              </a>
              <a
                href="#stack"
                className="transition-colors hover:text-foreground"
              >
                {t.nav.stack}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="hidden rounded border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                type="button"
              >
                {t.langSwitch}
              </button>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded text-sm">
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded text-sm font-semibold">
                  {t.nav.start}
                </Button>
              </Link>
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded border border-border md:hidden"
                type="button"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </header>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[60] bg-background"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <span className="text-base font-bold">Mindex</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded border border-border"
                  type="button"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-5 pt-4">
                {[
                  { href: "#features", label: t.nav.features },
                  { href: "#product", label: t.nav.product },
                  { href: "#stack", label: t.nav.stack },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded px-3 py-3 text-lg font-semibold transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="my-3 border-t border-border" />
                <button
                  onClick={() => {
                    toggleLang();
                    setMenuOpen(false);
                  }}
                  className="rounded px-3 py-3 text-left text-lg font-semibold text-muted-foreground transition-colors hover:bg-muted"
                  type="button"
                >
                  {t.langSwitch}
                </button>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded px-3 py-3 text-lg font-semibold text-muted-foreground transition-colors hover:bg-muted"
                >
                  {t.nav.login}
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  <Button className="mt-2 w-full rounded font-semibold">
                    {t.nav.start}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main>
          {/* ── Hero with 3D ── */}
          <section className="relative overflow-hidden px-5 pb-12 pt-28 lg:pb-0 lg:pt-24">
            <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/[0.04] blur-[120px]" />

            <div className="relative mx-auto max-w-[1200px]">
              <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-4 lg:pt-0"
                >
                  <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl lg:text-[3.5rem]">
                    {t.hero.title}
                    <br />
                    <em className="italic">{t.hero.titleAccent}</em>
                  </h1>
                  <p className="mt-6 max-w-[480px] text-base leading-relaxed text-muted-foreground lg:text-lg lg:leading-relaxed">
                    {t.hero.subtitle}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href="/register">
                      <Button className="h-10 rounded px-6 text-sm font-semibold">
                        {t.hero.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <a href="#product">
                      <Button
                        variant="outline"
                        className="h-10 rounded px-6 text-sm font-semibold"
                      >
                        {t.hero.ctaSecondary}
                      </Button>
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.15,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative h-[320px] md:h-[420px] lg:h-[520px]"
                >
                  <SplineWithFallback className="h-full w-full" />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Features (bento) ── */}
          <section id="features" className="px-5 py-24 md:py-32">
            <div className="mx-auto max-w-[1200px]">
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {t.features.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl lg:text-5xl">
                  {t.features.title}
                </h2>
              </Reveal>

              <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
                {t.features.items.map((item, i) => {
                  const isWide = i === 0 || i === 3;
                  return (
                    <Reveal
                      key={item.title}
                      delay={i * 0.08}
                      className={cn(isWide ? "lg:col-span-7" : "lg:col-span-5")}
                    >
                      <div
                        className={cn(
                          "group h-full rounded border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
                          isWide && "lg:p-8"
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Product ── */}
          <section
            id="product"
            className="border-t border-border/40 px-5 py-24 md:py-32"
          >
            <div className="mx-auto max-w-[1200px]">
              <Reveal>
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {t.product.eyebrow}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl lg:text-5xl">
                    {t.product.title}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t.product.description}
                  </p>
                </div>
              </Reveal>

              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {t.product.tools.map((tool, i) => (
                  <Reveal key={tool.label} delay={i * 0.06}>
                    <div className="group flex h-full items-start gap-4 rounded border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <tool.icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="pt-1.5 text-sm font-medium leading-snug">
                        {tool.label}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── Stack (grid cells) ── */}
          <section
            id="stack"
            className="border-t border-border/40 px-5 py-24 md:py-32"
          >
            <div className="mx-auto max-w-[1200px]">
              <Reveal>
                <h2 className="font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl lg:text-5xl">
                  {t.stack.title}
                </h2>
                <p className="mt-3 max-w-lg text-base text-muted-foreground">
                  {t.stack.description}
                </p>
              </Reveal>

              <div className="mt-14 grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {t.stack.items.map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.05}>
                    <div className="flex items-center gap-4 bg-card p-5 transition-colors hover:bg-muted/50 lg:p-6">
                      <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="px-5 py-24 md:py-32">
            <div className="mx-auto max-w-[1200px]">
              <Reveal>
                <div className="mx-auto max-w-xl text-center">
                  <h2 className="font-display text-3xl font-bold tracking-[-0.03em] md:text-4xl lg:text-5xl">
                    {t.cta.title}
                  </h2>
                  <p className="mt-5 text-base text-muted-foreground">
                    {t.cta.subtitle}
                  </p>
                  <div className="mt-8">
                    <Link href="/register">
                      <Button className="h-10 rounded px-8 text-sm font-semibold">
                        {t.cta.button}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-border/40 px-5 py-8">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 text-sm text-muted-foreground md:flex-row md:items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-primary">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-foreground">Mindex</span>
              <span className="text-xs">{t.footer.tagline}</span>
            </div>
            <div className="flex gap-5 text-xs">
              <a
                href="#features"
                className="transition-colors hover:text-foreground"
              >
                {t.nav.features}
              </a>
              <a
                href="#stack"
                className="transition-colors hover:text-foreground"
              >
                {t.nav.stack}
              </a>
              <Link
                href="/register"
                className="transition-colors hover:text-foreground"
              >
                {t.nav.start}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
