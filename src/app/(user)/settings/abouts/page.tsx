"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

const faqItems = [
  {
    value: "what-is-mindex",
    trigger: "Mindex là gì?",
    content:
      "Mindex là một nền tảng quản lý tri thức cá nhân sử dụng AI. Bạn có thể tải lên tài liệu, trích xuất thông tin, tạo sơ đồ tư duy và trò chuyện với chính dữ liệu của mình.",
  },
  {
    value: "formats",
    trigger: "Mindex hỗ trợ những định dạng tài liệu nào?",
    content:
      "Hiện tại Mindex hỗ trợ các định dạng phổ biến như PDF, DOCX, TXT và các tệp văn bản thuần túy. Hệ thống cũng được tối ưu cho tài liệu có bảng biểu và mã nguồn.",
  },
  {
    value: "security",
    trigger: "Dữ liệu của tôi có được bảo mật không?",
    content:
      "Bảo mật là ưu tiên hàng đầu. Tài liệu được lưu trữ riêng tư và không bị dùng để huấn luyện mô hình công cộng nếu không có sự cho phép của bạn.",
  },
  {
    value: "limits",
    trigger: "Làm thế nào để tăng hạn mức lưu trữ và câu hỏi?",
    content:
      "Bạn có thể nâng cấp lên các gói PRO hoặc ULTRA trong mục Gói dịch vụ & Hạn mức để nhận thêm dung lượng, tốc độ xử lý nhanh hơn và truy cập các mô hình AI mạnh hơn.",
  },
  {
    value: "support",
    trigger: "Tôi có thể yêu cầu tính năng mới ở đâu?",
    content:
      "Bạn có thể gửi yêu cầu tính năng hoặc báo lỗi trong mục Góp ý hệ thống ngay trong phần cài đặt.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="relative overflow-hidden border-border/70 bg-card/95 shadow-sm backdrop-blur">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <Sparkles size={120} className="text-primary" />
          </div>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Info size={20} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">Về chúng tôi</span>
            </div>
            <CardTitle className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold text-transparent">
              Mindex Neural Ecosystem
            </CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Mindex không chỉ là một công cụ lưu trữ, mà là một bộ não số đồng hành cùng bạn trong hành trình chinh phục tri thức. Chúng tôi kết hợp sức mạnh của RAG để giúp bạn hiểu sâu hơn về mọi tài liệu của mình.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
            <FeatureCard icon={<Zap className="text-yellow-500" size={20} />} title="Tốc độ & Hiệu quả" text="Trích xuất thông tin chỉ trong vài giây ngay cả với các tài liệu hàng trăm trang." />
            <FeatureCard icon={<ShieldCheck className="text-green-500" size={20} />} title="Bảo mật tuyệt đối" text="Hệ thống nhiều lớp giúp tri thức của bạn luôn thuộc về duy nhất bạn." />
            <FeatureCard icon={<Sparkles className="text-primary" size={20} />} title="Trải nghiệm Premium" text="Giao diện tinh tế và hiệu ứng mượt mà mang lại cảm hứng làm việc mỗi ngày." />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Câu hỏi thường gặp</CardTitle>
            <CardDescription>Giải đáp những thắc mắc phổ biến về tài khoản, tính năng và bảo mật tại Mindex.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.value} value={item.value} className="border-border/70">
                  <AccordionTrigger className="py-4 text-foreground hover:text-primary hover:no-underline transition-colors">
                    {item.trigger}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">{item.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      <div className="pt-8 text-center opacity-40">
        <p className="text-xs font-medium uppercase tracking-[0.2em]">Mindex Neural OS v1.0.4</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/40 p-4">
      {icon}
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
