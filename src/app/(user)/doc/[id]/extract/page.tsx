"use client";

import { use, useState } from "react";
import { 
  Tag, 
  History, 
  Search, 
  Layers, 
  ArrowLeft,
  Calendar,
  Box,
  Binary,
  Code,
  Zap,
  Check,
  ChevronRight,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExtractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("keywords");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractData, setExtractData] = useState<any>(null);

  // Fetch doc metadata
  const { data: docData } = useSWR(`/api/v1/documents/${id}`, fetchApi) as { data: any };
  const doc = docData?.data;

  const handleExtract = async (type: string) => {
    setIsExtracting(true);
    try {
      const res = (await fetchApi(`/extract/${type}`, { 
        method: "POST", 
        body: JSON.stringify({ document_id: id }) 
      })) as any;
      
      if (res.success) {
        setExtractData(res.data);
        toast.success("Trích xuất thông tin thành công!");
      } else {
        toast.error("Lỗi khi gọi AI trích xuất.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối.");
    } finally {
      setIsExtracting(false);
    }
  };

  if (!doc) return <div className="p-8 text-center text-[14px] text-zinc-500">Đang chuẩn bị dữ liệu...</div>;

  return (
    <div className="min-h-full bg-white p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 border-zinc-100">
           <div className="space-y-1">
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-primary transition-colors mb-2"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
            <h1 className="text-[26px] font-bold text-zinc-900 flex items-center gap-3">
              <Zap className="text-amber-500 fill-amber-300" size={28} />
              Trích xuất Thông tin Chuyên sâu
            </h1>
            <p className="text-zinc-500 text-[14px]">
              Tệp: <span className="font-semibold text-zinc-800">{doc.title}</span>
            </p>
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-xl border-zinc-200" onClick={() => handleExtract(activeTab)}>
            Chạy trích xuất ngay →
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-100/50 p-1 rounded-2xl w-full sm:w-auto h-auto grid grid-cols-2 md:inline-flex">
            <TabsTrigger value="keywords" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[13px] font-bold">
              <Tag size={16} className="mr-2" /> Từ khóa & KN
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[13px] font-bold">
              <History size={16} className="mr-2" /> Dòng thời gian
            </TabsTrigger>
            <TabsTrigger value="compare" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[13px] font-bold">
              <Layers size={16} className="mr-2" /> So sánh
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[13px] font-bold">
              <Search size={16} className="mr-2" /> Tùy chỉnh
            </TabsTrigger>
          </TabsList>

          <div className="mt-10 min-h-[400px]">
             {isExtracting ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
                 <Loader2 className="h-10 w-10 animate-spin text-primary" />
                 <p className="text-zinc-500 font-medium">Đang bóc tách dữ liệu phức tạp...</p>
               </div>
             ) : extractData ? (
               <>
                 <TabsContent value="keywords" className="m-0 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Keywords Cloud */}
                      <Card className="border-zinc-100 shadow-xl shadow-zinc-100/50 overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 border-b">
                           <CardTitle className="text-[16px] flex items-center gap-2">
                             <TrendingUp size={18} className="text-primary" /> Từ khóa phổ biến
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="flex flex-wrap gap-3">
                             {(extractData.keywords || ["React", "Go", "PostgreSQL", "AI", "Mindex"]).map((kw: any, i: number) => (
                               <Badge 
                                 key={i} 
                                 className={cn(
                                   "h-9 px-4 text-[14px] font-medium border-2 hover:scale-105 transition-transform cursor-default",
                                   i % 2 === 0 ? "bg-primary/5 text-primary border-primary/20" : "bg-amber-50 text-amber-600 border-amber-200"
                                 )}
                               >
                                 {kw.term || kw} <span className="ml-2 text-[10px] opacity-60">x{kw.frequency || 1}</span>
                               </Badge>
                             ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Formulas / Constants */}
                      <Card className="border-zinc-100 shadow-xl shadow-zinc-100/50">
                        <CardHeader className="bg-zinc-50/50 border-b">
                           <CardTitle className="text-[16px] flex items-center gap-2">
                             <Binary size={18} className="text-blue-500" /> Công thức & Hằng số
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                           <ScrollArea className="h-[300px]">
                              <div className="divide-y divide-zinc-100">
                                {(extractData.formulas || [{n: "Định luật I Newton", f: "F = ma", u: "Tính lực tịnh tiến"}]).map((f: any, i: number) => (
                                  <div key={i} className="p-4 flex items-start gap-4">
                                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Code size={16} />
                                     </div>
                                     <div>
                                        <h4 className="font-bold text-[14px] text-zinc-900">{f.n}</h4>
                                        <code className="text-[14px] text-primary font-bold my-1 block">{f.f}</code>
                                        <p className="text-[12px] text-zinc-500 italic">{f.u}</p>
                                     </div>
                                  </div>
                                ))}
                              </div>
                           </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Core Concepts Accordion */}
                    <Card className="border-zinc-100">
                       <CardHeader>
                          <CardTitle className="text-[18px]">Khái niệm chuyên sâu</CardTitle>
                          <CardDescription>Giải thích chi tiết các thuật ngữ khó theo ngôn ngữ dễ hiểu.</CardDescription>
                       </CardHeader>
                       <CardContent>
                          <Accordion className="w-full">
                            {(extractData.core_concepts || [{name: "Khái niệm 1", explanation: "Giải thích...", example: "Ví dụ..."}]).map((c: any, i: number) => (
                              <AccordionItem key={i} value={`idx-${i}`} className="border-zinc-100">
                                <AccordionTrigger className="hover:no-underline hover:bg-zinc-50/50 px-4 rounded-lg transition-all text-[15px] font-bold italic">
                                  {c.name}
                                </AccordionTrigger>
                                <AccordionContent className="px-6 py-4 bg-zinc-50/30 rounded-b-lg border-t border-zinc-100 text-[14px] leading-relaxed text-zinc-600">
                                   <p className="mb-3">{c.explanation}</p>
                                   <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-start gap-2">
                                      <Box size={14} className="mt-1 text-primary" />
                                      <span><b>Ví dụ:</b> {c.example}</span>
                                   </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                       </CardContent>
                    </Card>
                 </TabsContent>

                 <TabsContent value="timeline" className="m-0 animate-in fade-in duration-500">
                    <div className="max-w-3xl mx-auto py-10 relative">
                       {/* Line */}
                       <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-200 -translate-x-[50%]" />
                       
                       {(extractData.timeline || [{d: "1994", e: "Khởi đầu", s: "Quan trọng", p: 1}, {d: "2024", e: "Mindex Ra đời", s: "Cuộc cách mạng AI", p: 4}]).map((t: any, i: number) => (
                         <div key={i} className={cn(
                           "relative flex items-center mb-16",
                           i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                         )}>
                            {/* Dot */}
                            <div className="absolute left-4 md:left-1/2 -translate-x-[50%] w-4 h-4 rounded-full border-4 border-white bg-primary shadow-sm z-10" />
                            
                            <div className={cn(
                              "ml-12 md:ml-0 md:w-1/2",
                              i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                            )}>
                               <Badge variant="outline" className="mb-2 bg-white text-primary font-bold border-primary/20">
                                 {t.d || t.date_or_step}
                               </Badge>
                               <h3 className="text-[18px] font-bold text-zinc-900 mb-1">{t.e || t.event}</h3>
                               <p className="text-[13px] text-zinc-500 leading-relaxed mb-1">{t.s || t.significance}</p>
                               <span className="text-[12px] bg-zinc-100 px-2 py-0.5 rounded italic">Trang {t.p || t.page_ref}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </TabsContent>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center h-[300px] border border-dashed rounded-3xl gap-4">
                  <div className="p-4 bg-zinc-50 rounded-full">
                    <Zap size={32} className="text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 text-[14px]">Chọn tab và nhấn nút bên dưới để trích xuất.</p>
                  <Button variant="outline" size="sm" onClick={() => handleExtract(activeTab)}>Bắt đầu phân tích</Button>
               </div>
             )}

             {activeTab === "compare" && (
                <TabsContent value="compare" className="m-0 text-center py-20 space-y-6">
                   <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers size={32} />
                   </div>
                   <h3 className="text-[18px] font-bold text-zinc-800">So sánh Đa tài liệu</h3>
                   <p className="text-zinc-500 text-[14px] max-w-sm mx-auto">Chọn các tài liệu khác từ thư viện của bạn để tìm điểm tương đồng và khác biệt.</p>
                   <Button onClick={() => window.location.href = '/library'}>Đến Thư viện ngay</Button>
                </TabsContent>
             )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
