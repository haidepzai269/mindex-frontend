import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Search, 
  Zap, 
  Library, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  FileText,
  MousePointer2
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020205] text-white">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020205]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(184,41,255,0.2)]">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-2xl tracking-tighter">Mindex</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Tính năng</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Cách hoạt động</Link>
            <Link href="#community" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Cộng đồng</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5 font-medium">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 shadow-[0_0_20px_rgba(184,41,255,0.3)]">Bắt đầu ngay</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* HERO SECTION */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 animate-fade-in">
              <Sparkles size={14} />
              <span>AI Document Assistant dành riêng cho sinh viên</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto">
              Nâng tầm kiến thức của bạn với <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient-x">Sức mạnh AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Mindex giúp bạn quản lý, tra cứu và tổng hợp hàng ngàn trang tài liệu chỉ trong vài giây. Học tập thông minh hơn, không phải vất vả hơn.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(184,41,255,0.4)] group">
                  Trải nghiệm miễn phí <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/10 hover:bg-white/5 font-medium">
                  Tìm hiểu thêm
                </Button>
              </Link>
            </div>

            {/* Dashboard Preview Mockup */}
            <div className="mt-20 relative max-w-5xl mx-auto">
               <div className="relative rounded-2xl border border-white/10 bg-[#0A0B10] p-4 shadow-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020205] to-transparent opacity-40" />
                  <img 
                    src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2070&auto=format&fit=crop" 
                    alt="Mindex Interface" 
                    className="rounded-xl w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                    <MousePointer2 className="text-white w-8 h-8" />
                  </div>
               </div>
               
               {/* Decor Elements */}
               <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/20 blur-2xl rounded-full" />
               <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 blur-2xl rounded-full" />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Tại sao chọn Mindex?</h2>
              <p className="text-white/60 text-lg">Chúng tôi xây dựng một hệ sinh thái học tập hiện đại, giúp bạn bứt phá trong học tập.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Search className="text-primary" />}
                title="AI Hybrid Search"
                description="Tìm chính xác từng câu trả lời trong hàng nghìn trang tài liệu giáo trình và bài giảng của bạn với thuật toán lai thông minh."
              />
              <FeatureCard 
                icon={<Zap className="text-secondary" />}
                title="Smart Summary"
                description="Tóm tắt ý chính, tạo mindmap và thẻ ghi nhớ (flashcards) tự động từ mọi định dạng file: PDF, Word, PPT."
              />
              <FeatureCard 
                icon={<Library className="text-green-400" />}
                title="Thư viện cộng đồng"
                description="Tiếp cận kho tài liệu học tập khổng lồ được chia sẻ từ hàng ngàn sinh viên các trường đại học danh tiếng."
              />
              <FeatureCard 
                icon={<Users className="text-blue-400" />}
                title="Học tập xã hội"
                description="Kết nối với bạn bè, cùng thảo luận và giải đáp thắc mắc về các chủ đề học tập khó nhằn."
              />
              <FeatureCard 
                icon={<ShieldCheck className="text-orange-400" />}
                title="Bảo mật tuyệt đối"
                description="Tài liệu cá nhân của bạn được mã hóa và bảo mật nghiêm ngặt. Chỉ bạn mới có quyền tiếp cận dữ liệu của mình."
              />
              <FeatureCard 
                icon={<FileText className="text-pink-400" />}
                title="Multi-Document"
                description="Truy vấn cùng lúc trên nhiều tài liệu để tạo ra sự so sánh và tổng hợp kiến thức đa chiều nhất."
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-4xl font-bold mb-8 italic">Bắt đầu học tập thông minh chỉ sau 3 bước đơn giản.</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary">1</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Tải lên tài liệu</h4>
                      <p className="text-white/60">Kéo thả giáo trình, slide bài giảng hoặc tài liệu nghiên cứu của bạn vào hệ thống.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">AI Xử lý & Phân tích</h4>
                      <p className="text-white/60">Mindex sẽ tự động phân tích, trích xuất text và tạo chỉ mục tìm kiếm thông minh.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Hỏi đáp & Tra cứu</h4>
                      <p className="text-white/60">Chỉ cần đặt câu hỏi, AI sẽ trả kết quả kèm theo trích dẫn chính xác vị trí trong tài liệu.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-primary/30 blur-[100px] rounded-full opacity-30 animate-pulse" />
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                  alt="Student using Mindex" 
                  className="rounded-2xl shadow-2xl relative z-10 border border-white/10" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 container mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-white/10 p-12 md:p-20 text-center">
             <div className="absolute top-0 right-0 p-8">
               <Sparkles className="text-primary w-20 h-20 opacity-20" />
             </div>
             <h2 className="text-3xl md:text-5xl font-bold mb-8 max-w-2xl mx-auto">Sẵn sàng để trở thành phiên bản tốt nhất của bạn?</h2>
             <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto italic">Gia nhập cùng 10,000+ sinh viên đang tối ưu hóa việc học hàng ngày với Mindex.</p>
             <Link href="/register">
               <Button size="lg" className="h-16 px-12 text-xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-full font-bold">
                 Bắt đầu ngay miễn phí
               </Button>
             </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#020205] border-t border-white/5 pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-primary" />
                <span className="font-bold text-2xl tracking-tighter">Mindex</span>
              </div>
              <p className="text-white/40 max-w-sm leading-relaxed italic">
                Mindex không chỉ là một công cụ, nó là người bạn đồng hành trong hành trình chinh phục tri thức của mọi sinh viên.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6 italic underline underline-offset-8 decoration-primary/40">Sản phẩm</h5>
              <ul className="space-y-4 text-white/40 text-sm">
                <li><Link href="#features" className="hover:text-primary transition-colors">Tính năng</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Bảng giá</Link></li>
                <li><Link href="/community" className="hover:text-primary transition-colors">Thư viện chung</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 italic underline underline-offset-8 decoration-primary/40">Pháp lý</h5>
              <ul className="space-y-4 text-white/40 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-10 flex flex-col md:row items-center justify-between gap-6 text-[11px] text-white/20 font-medium uppercase tracking-[0.2em]">
            <span>© 2026 Mindex Team. All rights reserved.</span>
            <div className="flex gap-6">
               <Link href="#" className="hover:text-white transition-colors">Facebook</Link>
               <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
               <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all group duration-500">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
