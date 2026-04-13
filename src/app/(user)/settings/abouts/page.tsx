"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

const faqItems = [
  {
    value: "what-is-mindex",
    trigger: "Mindex là gì?",
    content:
      "Mindex là một nền tảng quản lý tri thức cá nhân (Neural Knowledge Base) sử dụng trí tuệ nhân tạo (AI). Mindex cho phép bạn tải lên các tài liệu cá nhân, tự động trích xuất thực thể, tạo sơ đồ tư duy (Mindmap) và trò chuyện với dữ liệu của mình một cách thông minh.",
  },
  {
    value: "formats",
    trigger: "Mindex hỗ trợ những định dạng tài liệu nào?",
    content:
      "Hiện tại Mindex hỗ trợ các định dạng phổ biến như PDF, DOCX, TXT và các tệp văn bản thuần túy. Hệ thống của chúng tôi được tối ưu hóa để xử lý cả những tài liệu có cấu trúc phức tạp như bảng biểu và mã nguồn.",
  },
  {
    value: "security",
    trigger: "Dữ liệu của tôi có được bảo mật không?",
    content:
      "Bảo mật là ưu tiên hàng đầu của chúng tôi. Tất cả tài liệu bạn tải lên đều được mã hóa và lưu trữ riêng tư. Chúng tôi không sử dụng dữ liệu cá nhân của bạn để huấn luyện các mô hình ngôn ngữ công cộng mà không có sự cho phép của bạn.",
  },
  {
    value: "limits",
    trigger: "Làm thế nào để tăng hạn mức lưu trữ và câu hỏi?",
    content:
      "Bạn có thể nâng cấp lên các gói PRO hoặc ULTRA trong phần 'Gói dịch vụ & Hạn mức' để nhận được nhiều dung lượng lưu trữ hơn, tốc độ xử lý nhanh hơn và quyền truy cập vào các mô hình AI tiên tiến nhất.",
  },
  {
    value: "support",
    trigger: "Tôi có thể yêu cầu tính năng mới ở đâu?",
    content:
      "Chúng tôi luôn lắng nghe ý kiến từ người dùng. Bạn có thể gửi yêu cầu tính năng hoặc báo lỗi trong phần 'Góp ý hệ thống' ngay trong menu cài đặt này.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} className="text-primary" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Info size={20} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                Về chúng tôi
              </span>
            </div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Mindex Neural Ecosystem
            </CardTitle>
            <CardDescription className="text-base text-white/50 max-w-2xl">
              Mindex không chỉ là một công cụ lưu trữ, mà là "bộ não số" đồng hành
              cùng bạn trong hành trình chinh phục tri thức. Chúng tôi kết hợp
              sức mạnh của RAG (Retrieval-Augmented Generation) để giúp bạn hiểu
              sâu hơn về mọi tài liệu của mình.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <Zap className="text-yellow-500" size={20} />
              <h3 className="font-semibold text-white">Tốc độ & Hiệu quả</h3>
              <p className="text-xs text-white/40">
                Trích xuất thông tin chỉ trong vài giây ngay cả với các tài liệu
                hàng trăm trang.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <ShieldCheck className="text-green-500" size={20} />
              <h3 className="font-semibold text-white">Bảo mật tuyệt đối</h3>
              <p className="text-xs text-white/40">
                Hệ thống mã hóa đa lớp đảm bảo tri thức của bạn luôn thuộc về duy
                nhất bạn.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <Sparkles className="text-primary" size={20} />
              <h3 className="font-semibold text-white">Trải nghiệm Premium</h3>
              <p className="text-xs text-white/40">
                Giao diện tinh tế, hiệu ứng mượt mà mang lại cảm hứng làm việc
                mỗi ngày.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Câu hỏi thường gặp
            </CardTitle>
            <CardDescription>
              Giải đáp những thắc mắc phổ biến về tài khoản, tính năng và bảo mật
              tại Mindex.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion className="w-full">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="border-white/5"
                >
                  <AccordionTrigger className="text-white/80 hover:text-white hover:no-underline transition-colors py-4">
                    {item.trigger}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/50 leading-relaxed pb-4">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      <div className="text-center pt-8 opacity-20">
        <p className="text-xs font-medium tracking-[0.2em] uppercase">
          Mindex Neural OS v1.0.4 • Crafted with Passion
        </p>
      </div>
    </div>
  );
}
