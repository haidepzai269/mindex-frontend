"use client";

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
  MousePointer2,
  Sparkles,
  CheckCircle2,
  BookOpen
} from "lucide-react";
import { LayoutLines } from "@/components/ui/layout-lines";
import { Glow } from "@/components/ui/glow";
import { MockupFrame } from "@/components/ui/mockup-frame";
import { ChatMockup } from "@/components/ui/chat-mockup";

export default function Home() {
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
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-semibold shadow-sm">Get Started</Button>
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
              <span>Next-Gen Document Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.05] max-w-4xl mx-auto animate-appear [animation-delay:100ms]">
              Intelligent Documents.<br />
              <span className="text-muted-foreground">Effortless Learning.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-appear [animation-delay:200ms]">
              Analyze, summarize, and master any course material in seconds. Mindex is the AI-powered companion designed for the modern student.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-appear [animation-delay:300ms]">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base shadow-xl group">
                  Start for Free <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  See how it works
                </Button>
              </Link>
            </div>

            {/* Mockup Preview */}
            <div className="mt-20 relative max-w-5xl mx-auto animate-appear [animation-delay:400ms]">
               <MockupFrame>
                  <div className="aspect-[16/10] overflow-hidden">
                    <ChatMockup />
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
            <p className="text-center text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">Trusted by students at leading universities</p>
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
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need to succeed.</h2>
              <p className="text-muted-foreground text-lg">Powerful tools designed to simplify your academic life and boost your productivity.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Search className="w-6 h-6" />}
                title="Semantic Search"
                description="Find precise answers across thousands of pages instantly. No more manual scrolling."
              />
              <FeatureCard 
                icon={<Zap className="w-6 h-6" />}
                title="Smart Synthesis"
                description="Convert complex documents into clear summaries and actionable mindmaps automatically."
              />
              <FeatureCard 
                icon={<Library className="w-6 h-6" />}
                title="Knowledge Hub"
                description="Access a vast repository of shared community resources from top-tier students."
              />
              <FeatureCard 
                icon={<Users className="w-6 h-6" />}
                title="Collaborative Study"
                description="Study with peers, share insights, and solve difficult problems together in real-time."
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6" />}
                title="Private & Secure"
                description="Your data is encrypted and strictly private. Only you control your academic assets."
              />
              <FeatureCard 
                icon={<FileText className="w-6 h-6" />}
                title="Multi-Doc Analysis"
                description="Query multiple documents simultaneously to synthesize cross-referenced insights."
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
                <h2 className="text-4xl font-bold mb-12 tracking-tight">From Upload to Mastery.</h2>
                <div className="space-y-10">
                  <StepItem 
                    number="01"
                    title="Upload Your Material"
                    description="Drop your PDFs, PPTs, or notes. Mindex processes them in seconds."
                  />
                  <StepItem 
                    number="02"
                    title="AI Analysis"
                    description="Our engine creates a semantic map and extracts key concepts automatically."
                  />
                  <StepItem 
                    number="03"
                    title="Get Answers"
                    description="Ask anything. Get cited answers and smart summaries instantly."
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
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Simple, Transparent Pricing.</h2>
              <p className="text-muted-foreground text-lg">Choose the plan that fits your academic goals. No hidden fees.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* FREE PLAN */}
              <PricingCard 
                title="Free"
                price="0đ"
                description="Perfect for casual learners getting started."
                features={[
                  "Basic AI Document Analysis",
                  "Limited Document Pins",
                  "Community Library Access",
                  "Standard Response Time"
                ]}
                buttonText="Get Started"
                link="/register"
              />

              {/* PRO PLAN */}
              <PricingCard 
                title="PRO"
                price="5.000đ"
                description="Enhanced productivity for serious students."
                features={[
                  "Ghim tối đa 5 tài liệu quan trọng",
                  "Chia sẻ template 5 tài liệu",
                  "Biểu tượng Vàng Gold VIP",
                  "Prioritized Response AI (Tốc độ x2)",
                  "No distractions (Ad-free)"
                ]}
                buttonText="Upgrade to PRO"
                link="/register"
                highlighted
              />

              {/* ULTRA PLAN */}
              <PricingCard 
                title="ULTRA"
                price="10.000đ"
                description="The ultimate academic power-up."
                features={[
                  "Ghim tối đa 10 tài liệu quan trọng",
                  "Chia sẻ template 10 tài liệu",
                  "Biểu tượng Neon Đỏ Đẳng Cấp",
                  "Premium AI Model (Cerebras, Groq...)",
                  "Dedicated 1-1 Support",
                  "Export & Analyze All Formats"
                ]}
                buttonText="Go ULTRA"
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
               <h2 className="text-4xl md:text-6xl font-bold mb-8 max-w-3xl mx-auto tracking-tight">Ready to transform your study routine?</h2>
               <p className="text-primary-foreground/70 text-lg md:text-xl mb-12 max-w-xl mx-auto">Join thousands of students who are learning smarter with Mindex.</p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link href="/register">
                   <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                     Get Started for Free
                   </Button>
                 </Link>
                 <Link href="/login">
                   <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
                     Sign in
                   </Button>
                 </Link>
               </div>
               <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/50">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> No credit card required</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Cancel anytime</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Secure data storage</div>
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
                The intelligent layer for your academic life. Built for students, powered by AI.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Product</h5>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-foreground uppercase tracking-widest text-xs">Legal</h5>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:row items-center justify-between gap-6 text-muted-foreground/60 text-[12px]">
            <span>© 2026 Mindex Inc. All rights reserved.</span>
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
            "variant-outline"
          )}
          variant={highlighted || variant === "ultra" ? "default" : "outline"}
        >
          {buttonText}
        </Button>
      </Link>
    </motion.div>
  );
}
