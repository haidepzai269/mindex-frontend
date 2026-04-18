"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Search, 
  Zap, 
  Library, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  FileText,
  CheckCircle2,
  BookOpen
} from "lucide-react";
import { LayoutLines } from "@/components/ui/layout-lines";
import { Glow } from "@/components/ui/glow";
import { MockupFrame } from "@/components/ui/mockup-frame";
import { ChatMockup } from "@/components/ui/chat-mockup";

const t = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      login: "Log in",
      getStarted: "Get Started"
    },
    hero: {
      badge: "Next-Gen Document Intelligence",
      title1: "Intelligent Documents.",
      title2: "Effortless Learning.",
      description: "Analyze, summarize, and master any course material in seconds. Mindex is the AI-powered companion designed for the modern student.",
      ctaStart: "Start for Free",
      ctaDemo: "See how it works"
    },
    logos: "Trusted by students at leading universities",
    features: {
      badge: "Everything you need to succeed.",
      description: "Powerful tools designed to simplify your academic life and boost your productivity.",
      f1: { title: "Semantic Search", desc: "Find precise answers across thousands of pages instantly. No more manual scrolling." },
      f2: { title: "Smart Synthesis", desc: "Convert complex documents into clear summaries and actionable mindmaps automatically." },
      f3: { title: "Knowledge Hub", desc: "Access a vast repository of shared community resources from top-tier students." },
      f4: { title: "Collaborative Study", desc: "Study with peers, share insights, and solve difficult problems together in real-time." },
      f5: { title: "Private & Secure", desc: "Your data is encrypted and strictly private. Only you control your academic assets." },
      f6: { title: "Multi-Doc Analysis", desc: "Query multiple documents simultaneously to synthesize cross-referenced insights." }
    },
    howItWorks: {
        title: "From Upload to Mastery.",
        s1: { title: "Upload Your Material", desc: "Drop your PDFs, PPTs, or notes. Mindex processes them in seconds." },
        s2: { title: "AI Analysis", desc: "Our engine creates a semantic map and extracts key concepts automatically." },
        s3: { title: "Get Answers", desc: "Ask anything. Get cited answers and smart summaries instantly." }
    },
    pricing: {
        title: "Simple, Transparent Pricing.",
        description: "Choose the plan that fits your academic goals. No hidden fees.",
        p1: { title: "Free", desc: "Perfect for casual learners getting started.", price: "0đ", features: ["Basic AI Document Analysis", "Limited Document Pins", "Community Library Access", "Standard Response Time"], btn: "Get Started" },
        p2: { title: "PRO", desc: "Enhanced productivity for serious students.", price: "5.000đ", features: ["Pin up to 5 key documents", "Share templates for 5 documents", "Exclusive Gold VIP Badge", "Prioritized AI Speed (2x Faster)", "No distractions (Ad-free)"], btn: "Upgrade to PRO" },
        p3: { title: "ULTRA", desc: "The ultimate academic power-up.", price: "10.000đ", features: ["Pin up to 10 key documents", "Share templates for 10 documents", "Elite Neon Red Badge", "Premium AI Models (Cerebras, Groq...)", "Dedicated 1-1 Support", "Export & Analyze All Formats"], btn: "Go ULTRA" }
    },
    cta: {
        title: "Ready to transform your study routine?",
        desc: "Join thousands of students who are learning smarter with Mindex.",
        btnStart: "Get Started for Free",
        btnSign: "Sign in",
        f1: "No credit card required",
        f2: "Cancel anytime",
        f3: "Secure data storage"
    },
    footer: {
        desc: "The intelligent layer for your academic life. Built for students, powered by AI.",
        pTitle: "Product",
        lTitle: "Legal",
        copy: "© 2026 Mindex Inc. All rights reserved."
    }
  },
  vi: {
    nav: {
      features: "Tính năng",
      howItWorks: "Cách hoạt động",
      pricing: "Bảng giá",
      login: "Đăng nhập",
      getStarted: "Bắt đầu ngay"
    },
    hero: {
      badge: "Trí tuệ tài liệu thế hệ mới",
      title1: "Tài liệu thông minh.",
      title2: "Học tập không giới hạn.",
      description: "Phân tích, tóm tắt và làm chủ mọi tài liệu học tập trong nháy mắt. Mindex là người bạn đồng hành AI được thiết kế dành riêng cho sinh viên hiện đại.",
      ctaStart: "Bắt đầu miễn phí",
      ctaDemo: "Xem cách hoạt động"
    },
    logos: "Được tin dùng bởi sinh viên tại các đại học hàng đầu",
    features: {
      badge: "Mọi công cụ bạn cần để thành công.",
      description: "Những tính năng mạnh mẽ được thiết kế để đơn giản hóa việc học và tối ưu hiệu suất của bạn.",
      f1: { title: "Tìm kiếm ngữ nghĩa", desc: "Tìm câu trả lời chính xác trong hàng ngàn trang tài liệu ngay lập tức. Không còn phải cuộn trang thủ công." },
      f2: { title: "Tổng hợp thông minh", desc: "Tự động chuyển đổi tài liệu phức tạp thành các bản tóm tắt và sơ đồ tư duy rõ ràng." },
      f3: { title: "Thư viện kiến thức", desc: "Truy cập kho lưu trữ tài liệu cộng đồng khổng lồ từ các sinh viên ưu tú." },
      f4: { title: "Học tập cộng tác", desc: "Học cùng bạn bè, chia sẻ góc nhìn và cùng giải quyết các bài tập khó trong thời gian thực." },
      f5: { title: "Riêng tư & Bảo mật", desc: "Dữ liệu của bạn được mã hóa và bảo mật tuyệt đối. Bạn hoàn toàn kiểm soát tài sản trí tuệ của mình." },
      f6: { title: "Phân tích đa tài liệu", desc: "Truy vấn cùng lúc nhiều tài liệu để tổng hợp thông tin đối chiếu một cách logic." }
    },
    howItWorks: {
        title: "Từ tải lên đến làm chủ.",
        s1: { title: "Tải lên tài liệu", desc: "Tải PDF, Slide hoặc ghi chú của bạn lên. Mindex sẽ xử lý trong vài giây." },
        s2: { title: "Phân tích AI", desc: "Hệ thống tự động lập sơ đồ ngữ nghĩa và trích xuất các khái niệm trọng tâm." },
        s3: { title: "Nhận câu trả lời", desc: "Hỏi bất cứ điều gì. Nhận câu trả lời có trích dẫn và bản tóm tắt thông minh ngay lập tức." }
    },
    pricing: {
        title: "Bảng giá đơn giản, minh bạch.",
        description: "Chọn gói dịch vụ phù hợp với mục tiêu học tập của bạn. Không phát sinh chi phí ẩn.",
        p1: { title: "Miễn phí", desc: "Hoàn hảo cho người mới bắt đầu khám phá.", price: "0đ", features: ["Phân tích tài liệu cơ bản", "Giới hạn số lượt ghim", "Truy cập thư viện cộng đồng", "Tốc độ xử lý tiêu chuẩn"], btn: "Bắt đầu ngay" },
        p2: { title: "PRO", desc: "Nâng tầm năng suất cho sinh viên chuyên nghiệp.", price: "5.000đ", features: ["Ghim tối đa 5 tài liệu quan trọng", "Chia sẻ template 5 tài liệu", "Biểu tượng Vàng Gold VIP", "Prioritized Response AI (Tốc độ x2)", "Không quảng cáo"], btn: "Nâng cấp lên PRO" },
        p3: { title: "ULTRA", desc: "Sức mạnh học tập tối thượng.", price: "10.000đ", features: ["Ghim tối đa 10 tài liệu quan trọng", "Chia sẻ template 10 tài liệu", "Biểu tượng Neon Đỏ Đẳng Cấp", "Premium AI Model (Cerebras, Groq...)", "Hỗ trợ 1-1 ưu tiên", "Xuất và phân tích mọi định dạng"], btn: "Lên đời ULTRA" }
    },
    cta: {
        title: "Sẵn sàng thay đổi cách học tập của bạn?",
        desc: "Gia nhập cùng hàng ngàn sinh viên đang học tập thông minh hơn với Mindex.",
        btnStart: "Bắt đầu miễn phí",
        btnSign: "Đăng nhập",
        f1: "Không cần thẻ tín dụng",
        f2: "Hủy bất cứ lúc nào",
        f3: "Bảo mật dữ liệu tuyệt đối"
    },
    footer: {
        desc: "Nền tảng tri thức thông minh cho hành trình học tập. Được xây dựng cho sinh viên, vận hành bởi AI.",
        pTitle: "Sản phẩm",
        lTitle: "Pháp lý",
        copy: "© 2026 Mindex Inc. Bảo lưu mọi quyền."
    }
  }
};

export default function Home() {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("mindex_lang") as 'en' | 'vi';
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'vi' : 'en';
    setLang(newLang);
    localStorage.setItem("mindex_lang", newLang);
  };

  const cur = t[lang];

  if (!mounted) {
    return <div className="min-h-screen bg-background" />; // Prevent hydration mismatch
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">Mindex</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{cur.nav.features}</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{cur.nav.howItWorks}</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{cur.nav.pricing}</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Switcher */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleLang}
                className="font-black text-[11px] tracking-widest hover:bg-white/5 border border-white/5 transition-all w-12"
            >
                {lang.toUpperCase()}
            </Button>

            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium hidden sm:flex">{cur.nav.login}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-semibold shadow-sm">{cur.nav.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <LayoutLines />
          <Glow className="top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-[13px] font-medium text-foreground mb-8 animate-appear">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>{cur.hero.badge}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.05] max-w-4xl mx-auto animate-appear [animation-delay:100ms]">
              {cur.hero.title1}<br />
              <span className="text-muted-foreground">{cur.hero.title2}</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-appear [animation-delay:200ms]">
              {cur.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-appear [animation-delay:300ms]">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base shadow-xl group">
                  {cur.hero.ctaStart} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  {cur.hero.ctaDemo}
                </Button>
              </Link>
            </div>

            {/* Mockup Preview */}
            <div className="mt-20 relative max-w-5xl mx-auto animate-appear [animation-delay:400ms]">
               <MockupFrame>
                  <div className="aspect-[16/10] overflow-hidden">
                    <ChatMockup lang={lang} />
                  </div>
               </MockupFrame>
               
               {/* Decor Elements */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />
            </div>
          </div>
        </section>

        {/* LOGOS / SOCIAL PROOF */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="py-12 border-y border-border/50 bg-secondary/30"
        >
          <div className="container mx-auto px-6">
            <p className="text-center text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">{cur.logos}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
               <div className="font-bold text-xl">HARVARD</div>
               <div className="font-bold text-xl">MIT</div>
               <div className="font-bold text-xl">STANFORD</div>
               <div className="font-bold text-xl">OXFORD</div>
               <div className="font-bold text-xl">NUS</div>
            </div>
          </div>
        </motion.section>

        {/* FEATURES SECTION */}
        <motion.section 
          id="features"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-24 relative overflow-hidden"
        >
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{cur.features.badge}</h2>
              <p className="text-muted-foreground text-lg">{cur.features.description}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Search className="w-6 h-6" />}
                title={cur.features.f1.title}
                description={cur.features.f1.desc}
              />
              <FeatureCard 
                icon={<Zap className="w-6 h-6" />}
                title={cur.features.f2.title}
                description={cur.features.f2.desc}
              />
              <FeatureCard 
                icon={<Library className="w-6 h-6" />}
                title={cur.features.f3.title}
                description={cur.features.f3.desc}
              />
              <FeatureCard 
                icon={<Users className="w-6 h-6" />}
                title={cur.features.f4.title}
                description={cur.features.f4.desc}
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6" />}
                title={cur.features.f5.title}
                description={cur.features.f5.desc}
              />
              <FeatureCard 
                icon={<FileText className="w-6 h-6" />}
                title={cur.features.f6.title}
                description={cur.features.f6.desc}
              />
            </div>
          </div>
        </motion.section>

        {/* HOW IT WORKS / STEPS */}
        <motion.section 
          id="how-it-works"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-24 bg-secondary/20"
        >
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-12 tracking-tight">{cur.howItWorks.title}</h2>
                <div className="space-y-10">
                  <StepItem 
                    number="01"
                    title={cur.howItWorks.s1.title}
                    description={cur.howItWorks.s1.desc}
                  />
                  <StepItem 
                    number="02"
                    title={cur.howItWorks.s2.title}
                    description={cur.howItWorks.s2.desc}
                  />
                  <StepItem 
                    number="03"
                    title={cur.howItWorks.s3.title}
                    description={cur.howItWorks.s3.desc}
                  />
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full opacity-50" />
                <MockupFrame className="relative z-10">
                   <img 
                    src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2000" 
                    alt="Process Preview" 
                    className="w-full h-auto"
                   />
                </MockupFrame>
              </div>
            </div>
          </div>
        </motion.section>

        {/* PRICING SECTION */}
        <motion.section 
          id="pricing"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-24 relative overflow-hidden"
        >
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 animate-appear">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{cur.pricing.title}</h2>
              <p className="text-muted-foreground text-lg">{cur.pricing.description}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* FREE PLAN */}
              <PricingCard 
                title={cur.pricing.p1.title}
                price={cur.pricing.p1.price}
                description={cur.pricing.p1.desc}
                features={cur.pricing.p1.features}
                buttonText={cur.pricing.p1.btn}
                link="/register"
              />

              {/* PRO PLAN */}
              <PricingCard 
                title={cur.pricing.p2.title}
                price={cur.pricing.p2.price}
                description={cur.pricing.p2.desc}
                features={cur.pricing.p2.features}
                buttonText={cur.pricing.p2.btn}
                link="/register"
                highlighted
              />

              {/* ULTRA PLAN */}
              <PricingCard 
                title={cur.pricing.p3.title}
                price={cur.pricing.p3.price}
                description={cur.pricing.p3.desc}
                features={cur.pricing.p3.features}
                buttonText={cur.pricing.p3.btn}
                link="/register"
                variant="ultra"
              />
            </div>
          </div>
        </motion.section>

        {/* CTA SECTION */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-32 container mx-auto px-6"
        >
          <div className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground p-12 md:p-24 text-center">
             <LayoutLines className="opacity-20" />
             <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-bold mb-8 max-w-3xl mx-auto tracking-tight">{cur.cta.title}</h2>
               <p className="text-primary-foreground/70 text-lg md:text-xl mb-12 max-w-xl mx-auto">{cur.cta.desc}</p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link href="/register">
                   <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                     {cur.cta.btnStart}
                   </Button>
                 </Link>
                 <Link href="/login">
                   <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
                     {cur.cta.btnSign}
                   </Button>
                 </Link>
               </div>
               <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/50">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {cur.cta.f1}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {cur.cta.f2}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {cur.cta.f3}</div>
               </div>
             </div>
          </div>
        </motion.section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border py-20 bg-background text-sm">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                 </div>
                 <span className="font-bold text-lg tracking-tight">Mindex</span>
              </div>
              <p className="text-muted-foreground max-w-xs leading-relaxed">
                {cur.footer.desc}
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">{cur.footer.pTitle}</h5>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary transition-colors">{cur.nav.features}</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">{cur.nav.pricing}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">{cur.footer.lTitle}</h5>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:row items-center justify-between gap-6 text-muted-foreground/60 text-[12px]">
            <span>{cur.footer.copy}</span>
            <div className="flex gap-8">
               <Link href="#" className="hover:text-foreground transition-colors">Twitter (X)</Link>
               <Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link>
               <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-8 rounded-2xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-all group duration-500"
    >
      <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepItem({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex gap-6"
    >
      <div className="text-sm font-bold text-muted-foreground/40 mt-1">{number}</div>
      <div>
        <h4 className="text-xl font-bold mb-2 tracking-tight">{title}</h4>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function PricingCard({ 
  title, 
  price, 
  description, 
  features, 
  buttonText, 
  link, 
  highlighted = false,
  variant = "default"
}: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  buttonText: string, 
  link: string, 
  highlighted?: boolean,
  variant?: "default" | "ultra"
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative p-8 rounded-3xl border flex flex-col transition-all duration-500",
        highlighted 
          ? "bg-secondary/60 border-primary ring-1 ring-primary shadow-xl scale-105 z-10" 
          : variant === "ultra"
            ? "bg-gradient-to-b from-background to-secondary/40 border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.1)] hover:border-rose-500/50"
            : "bg-background border-border hover:border-muted-foreground/30"
      )}
    >
      {variant === "ultra" && (
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
      )}
      
      <div className="mb-8">
        <h3 className={cn(
          "text-xl font-bold mb-2 tracking-tight",
          variant === "ultra" ? "text-rose-500" : ""
        )}>{title}</h3>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-black">{price}</span>
          <span className="text-muted-foreground text-sm">/ month</span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>

      <ul className="space-y-4 mb-10 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex gap-3 text-sm text-foreground/80">
            <CheckCircle2 className={cn(
              "w-5 h-5 shrink-0",
              variant === "ultra" ? "text-rose-500" : "text-primary"
            )} />
            {feature}
          </li>
        ))}
      </ul>

      <Link href={link}>
        <Button 
          className={cn(
            "w-full h-12 font-bold",
            highlighted ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
            variant === "ultra" ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20" :
            ""
          )}
          variant={highlighted || variant === "ultra" ? "default" : "outline"}
        >
          {buttonText}
        </Button>
      </Link>
    </motion.div>
  );
}
