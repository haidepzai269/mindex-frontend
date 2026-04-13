"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  BookOpen,
  Layout,
  Download,
  Copy,
  Loader2,
  Clock,
  Zap,
  Info,
  ChevronRight,
  ClipboardCheck,
  Search,
  BookMarked,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";
import { fetchApi, API_BASE_URL, handleRefreshToken } from "@/lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { MermaidRenderer } from "@/components/ui/mermaid-renderer";

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [activeMode, setActiveMode] = useState<"quick" | "academic" | "deep">("academic");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [streamText, setStreamText] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  const [modeResults, setModeResults] = useState<Record<string, any>>({});
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch doc metadata
  const { data: docData } = useSWR(id ? `/documents/${id}` : null, fetchApi) as { data: any };
  const doc = docData?.data;

  // Auto scroll khi stream (chỉ thực hiện khi đang phân tích)
  useEffect(() => {
    if (isSummarizing && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamText, isSummarizing]);

  // Reset scroll về đầu khi đổi Mode
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeMode]);

  // Kiểm tra Cache khi đổi Mode
  useEffect(() => {
    const checkCache = async () => {
      if (!id) return;
      
      // Nếu đã có trong state local thì lấy luôn
      if (modeResults[activeMode]) {
          if (activeMode === "quick") {
              setSummaryData(modeResults[activeMode]);
              setStreamText("");
          } else {
              setStreamText(modeResults[activeMode]);
              setSummaryData(null);
          }
          return;
      }

      // Reset tạm thời để check
      setSummaryData(null);
      setStreamText("");
      setIsCheckingCache(true);

      try {
        const res = (await fetchApi(`/summary/cache/${id}?mode=${activeMode}`)) as any;
        if (res.success && res.data?.summary) {
            const data = res.data.summary;
            if (activeMode === "quick") {
                setSummaryData(data);
                setModeResults(prev => ({ ...prev, [activeMode]: data }));
            } else {
                setStreamText(data);
                setModeResults(prev => ({ ...prev, [activeMode]: data }));
            }
        }
      } catch (err) {
        console.log("No cache found or error fetching cache:", err);
      } finally {
        setIsCheckingCache(false);
      }
    };

    checkCache();
  }, [activeMode, id]);

  const handleGenerateSummary = async (mode: string) => {
    setIsSummarizing(true);
    setSummaryData(null);
    setStreamText("");
    setProgressMsg("Khởi động hệ thống phân tích...");

    let accumulatedText = ""; // Tiền thân của fullText, dùng để lưu cache

    if (mode === "quick") {
      try {
        setProgressMsg("Đang quét cấu trúc tài liệu...");
        const res = (await fetchApi(`/summary/quick`, { 
          method: "POST", 
          body: JSON.stringify({ document_id: id, mode: "quick" }) 
        })) as any;
        
        console.log("🔍 [QuickScan] Raw Response:", res);
        
        if (res.success && res.data) {
          const raw = res.data.summary;
          
          // Case 1: Raw is just a string (failed unmarshal fallback in BE)
          if (typeof raw === "string") {
            setSummaryData({
                overview: raw,
                key_points: ["Xem chi tiết ở mục tổng quan"],
                concepts: [],
                application: "Vui lòng xem nội dung tóm tắt phía trên."
            });
          } else {
            // Case 2: Raw is an object, normalize mapping
            const normalize = (keys: string[], target: string) => {
                if (!raw[target]) {
                for (const k of keys) {
                    if (raw[k]) {
                    raw[target] = raw[k];
                    return;
                    }
                }
                }
            };
            normalize(["tổng_quan", "tong_quan", "nội_dung", "tóm_tắt", "noi_dung_tong_quan"], "overview");
            normalize(["ý_chính", "y_chinh", "points", "điểm_chính"], "key_points");
            normalize(["khái_niệm", "thuat_ngu", "thuật_ngữ", "core_concepts"], "concepts");
            normalize(["ứng_dụng", "ung_dung", "thực_tế"], "application");

            const normalized = {
                overview: raw.overview || "",
                key_points: raw.key_points || [],
                concepts: raw.concepts || [],
                application: raw.application || ""
            };
            setSummaryData(normalized);
            setModeResults(prev => ({ ...prev, [mode]: normalized }));
          }
          toast.success("Quick Scan đã sẵn sàng!");
        } else {
          toast.error("Không thể tạo tóm tắt nhanh.");
        }
      } catch (err) {
        toast.error("Lỗi kết nối máy chủ AI.");
      } finally {
        setIsSummarizing(false);
      }
    } else {
      // Academic hoặc Deep Analysis sử dụng SSE
      try {
        let token = Cookies.get("access_token");
        let response = await fetch(`${API_BASE_URL}/summary/detailed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ document_id: id, mode: mode }),
          credentials: "include"
        });

        // Xử lý 401 Reactive Refresh cho SSE
        if (response.status === 401) {
           console.log("[SSE] 401 detected, attempting token refresh...");
           try {
              token = await handleRefreshToken();
              response = await fetch(`${API_BASE_URL}/summary/detailed`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ document_id: id, mode: mode }),
                credentials: "include"
              });
           } catch (refreshErr) {
              toast.error("Phiên làm việc hết hạn, vui lòng đăng nhập lại.");
              return;
           }
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "AI Service temporary unavailable");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              const lines = part.split("\n");
              let event = "";
              let data = "";

              for (const line of lines) {
                if (line.startsWith("event: ")) event = line.replace("event: ", "").trim();
                if (line.startsWith("data: ")) data = line.replace("data: ", "").trim();
              }

              if (event === "token" && data) {
                try {
                  const parsedData = JSON.parse(data);
                  const token = parsedData.token || "";
                  accumulatedText += token;
                  setStreamText(prev => prev + token);
                } catch (e) {}
              } else if (event === "info" && data) {
                try {
                  const parsedData = JSON.parse(data);
                  setProgressMsg(parsedData.message);
                } catch (e) {}
              } else if (event === "done") {
                setIsSummarizing(false);
                // Lưu vào local state để chuyển tab không bị load lại
                setModeResults(prev => ({ ...prev, [mode]: accumulatedText }));
                toast.success("Phân tích hoàn tất!");
              }
            }
          }
        }
      } catch (err) {
        toast.error("Lỗi truyền tải dữ liệu AI.");
        setIsSummarizing(false);
      }
    }
  };

  const handleCopy = () => {
    let text = "";
    if (activeMode === "quick" && summaryData) {
        text = `# ${doc?.title} - Quick Scan\n\n` +
               `## Tổng quan kiến thức\n${summaryData.overview}\n\n` +
               `## Key Points\n${summaryData.key_points?.map((p: string) => `- ${p}`).join("\n")}\n\n` +
               `## Khả năng ứng dụng\n${summaryData.application}`;
    } else {
        text = streamText;
    }
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép vào bộ nhớ tạm!");
  };

  const handleExport = (format: "md" | "doc" | "pdf") => {
    setShowExportMenu(false);
    
    if (format === "pdf") {
      window.print();
      return;
    }

    let content = "";
    const extension = format === "md" ? ".md" : ".doc";
    const mimeType = format === "md" ? "text/markdown" : "application/msword";
    const fileName = `${doc?.title || "Summary"}_${activeMode}${extension}`;
    
    // Thu thập nội dung Markdown
    let markdown = "";
    if (activeMode === "quick" && summaryData) {
        markdown = `# ${doc?.title}\nMode: Quick Scan\n\n` +
                  `## 1. Tổng quan kiến thức\n${summaryData.overview}\n\n` +
                  `## 2. Các ý chính (Key Points)\n${summaryData.key_points?.map((p: string) => `- ${p}`).join("\n")}\n\n` +
                  `## 3. Thuật ngữ cốt lõi (Concepts)\n${summaryData.concepts?.map((c: any) => `### ${c.t}\n${c.d}`).join("\n\n")}\n\n` +
                  `## 4. Khả năng ứng dụng\n${summaryData.application}\n\n` +
                  `--- \n*Xuất bản bởi Mindex AI Dashboard*`;
    } else {
        markdown = `# ${doc?.title}\nMode: ${activeMode.toUpperCase()}\n\n${streamText}\n\n--- \n*Xuất bản bởi Mindex AI Dashboard*`;
    }

    if (format === "md") {
        content = markdown;
    } else {
        // Biến đổi Markdown sơ bộ sang HTML cho Word (Dùng mẹo Office HTML)
        const htmlBody = markdown
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/^\- (.*$)/gim, "<li>$1</li>")
            .replace(/\n/gim, "<p></p>");

        content = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #000; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h2 { color: #1a56db; margin-top: 20px; border-left: 4px solid #1a56db; padding-left: 10px; }
            li { margin-left: 20px; }
          </style></head>
          <body>${htmlBody}</body></html>`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Đã tải xuống file ${format.toUpperCase()}`);
  };

  // Hàm xử lý Column Layout (::cols :::split :::) - ĐÃ VÔ HIỆU HÓA ĐỂ GIỮ DẢI DỌC
  const renderContent = (content: string) => {
    // Đảm bảo nội dung luôn hiển thị theo một dải dọc
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content.replace(/:::cols|:::split|:::/g, "")}
      </ReactMarkdown>
    );

    return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>;
  };

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "";
      
      if (!inline && lang === "mermaid") {
        return <MermaidRenderer chart={String(children).replace(/\n$/, "")} />;
      }
      
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    table({ children }: any) {
      return (
        <div className="my-8 overflow-x-auto rounded-3xl border border-white/10 shadow-2xl bg-white/[0.02]">
          <table className="w-full border-collapse text-left min-w-[500px]">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return <thead className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-white/10">{children}</thead>;
    },
    tbody({ children }: any) {
      return <tbody className="divide-y divide-white/5">{children}</tbody>;
    },
    th({ children }: any) {
      return <th className="px-6 py-4 text-[10px] font-black text-primary uppercase tracking-widest">{children}</th>;
    },
    td({ children }: any) {
      return <td className="px-6 py-4 text-sm text-zinc-400 font-medium">{children}</td>;
    },
    strong({ children }: any) {
      return <strong className="text-primary font-black italic">{children}</strong>;
    },
    h3({ children }: any) {
      return <h3 className="text-xl font-black text-white italic mt-12 mb-6 border-l-4 border-primary pl-4 uppercase tracking-tight">{children}</h3>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-8 space-y-3 my-6 text-zinc-400">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-8 space-y-3 my-6 text-zinc-400">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="pl-2 marker:text-primary marker:font-black">{children}</li>;
    },
    p({ children }: any) {
      return <p className="mb-4 leading-[1.8]">{children}</p>;
    }
  };

  const menuItems = [
    { id: "academic", label: "PHÂN TÍCH HỌC THUẬT", icon: BookMarked, desc: "Kiến trúc bóc tách chuyên sâu" },
    { id: "quick", label: "QUICK SCAN", icon: Zap, desc: "Tóm tắt ý chính & thuật ngữ" },
    { id: "deep", label: "DEEP INSIGHT", icon: Lightbulb, desc: "Ứng dụng & Lộ trình thực tế" }
  ];

  if (!doc) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
       <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
    </div>
  );

  return (
    <div className="h-full bg-[#050505] text-zinc-100 flex flex-col md:flex-row overflow-hidden font-sans border-t border-white/5">
      <style jsx global>{`
        @media (max-width: 768px) {
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          .print-content { 
            display: block !important; 
            color: black !important;
            padding: 40px !important;
            background: white !important;
          }
          .markdown-content * { color: black !important; }
          .markdown-content h1, .markdown-content h2 { color: #1a56db !important; }
          .prose { max-width: none !important; }
        }
      `}</style>
      
      {/* Sidebar - Mobile: Top Scroll / Desktop: Left Side */}
      <div className="w-full md:w-80 h-auto md:h-full border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a0a] flex flex-col shrink-0 animate-in slide-in-from-left duration-500 no-print z-[60]">
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between md:block md:space-y-4">
           <button 
             onClick={() => window.history.back()} 
             className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-500 hover:text-white transition-all uppercase tracking-widest font-bold"
           >
              <ArrowLeft size={14} /> <span className="md:inline">Thư viện</span>
           </button>
           <div className="text-right md:text-left flex-1 md:flex-none ml-4 md:ml-0">
              <div className="text-[8px] md:text-[10px] font-black text-primary mb-0.5 md:mb-1 tracking-tighter">SUMMARY</div>
              <h1 className="text-[11px] md:text-sm font-bold text-zinc-200 truncate max-w-[150px] md:max-w-full ml-auto md:ml-0">{doc.title}</h1>
           </div>
        </div>

        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-4 gap-2 hide-scrollbar">
           <div className="hidden md:block px-3 py-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Analysis Modes</div>
           {menuItems.map((item) => (
             <button
                key={item.id}
                onClick={() => setActiveMode(item.id as any)}
                className={cn(
                  "flex-shrink-0 md:w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl transition-all group relative overflow-hidden flex items-center md:block gap-3",
                  activeMode === item.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white/5 md:bg-transparent hover:bg-white/5 text-zinc-400"
                )}
             >
                <div className="flex items-center gap-2 md:gap-4 relative z-10">
                   <item.icon size={18} className={activeMode === item.id ? "text-white" : "text-zinc-600 group-hover:text-primary transition-colors"} />
                   <div>
                      <div className="text-[10px] md:text-[12px] font-black uppercase tracking-tight whitespace-nowrap">{item.label}</div>
                      <div className={cn("hidden md:block text-[10px] font-medium opacity-70", activeMode === item.id ? "text-white" : "text-zinc-500")}>
                        {item.desc}
                      </div>
                   </div>
                </div>
                {activeMode === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
             </button>
           ))}
        </div>

        <div className="hidden md:block p-6 border-t border-white/5 bg-black/20">
           <Button 
             className="w-full h-12 bg-zinc-100 text-black hover:bg-white rounded-xl font-bold gap-2 text-xs uppercase tracking-widest"
             onClick={() => handleGenerateSummary(activeMode)}
             disabled={isSummarizing}
           >
             {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
             Khai thác ngay
           </Button>
        </div>
      </div>

      {/* Main Content Area - Inbox Style */}
      <div className="flex-1 h-full flex flex-col relative animate-in fade-in duration-1000">
        {/* Top Header */}
        <div className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#080808]/50 backdrop-blur-xl no-print z-50">
           <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
              <Badge variant="outline" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[9px] tracking-tighter ring-1 ring-primary/20 shrink-0">Mindex AI v2</Badge>
              <div className="hidden sm:block h-4 w-px bg-white/10" />
              <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">
                {activeMode === "academic" ? "Detailed Scholarship Analysis" : activeMode === "quick" ? "Interactive Key Summary" : "Deep Domain Insights"}
              </span>
           </div>
           {(summaryData || streamText) && (
              <div className="flex items-center gap-1 md:gap-2">
                 <Button 
                   variant="ghost" size="sm" 
                   className="text-zinc-500 hover:text-white h-8 md:h-9 px-2 md:px-3 rounded-lg gap-1.5"
                   onClick={handleCopy}
                 >
                    <Copy size={13} /> <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden xs:inline">Copy</span>
                 </Button>
                 <div className="relative">
                    <Button 
                      variant="ghost" size="sm" 
                      className={cn("text-zinc-500 hover:text-white h-8 md:h-9 px-2 md:px-3 rounded-lg gap-1.5", showExportMenu && "bg-white/10 text-white")}
                      onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                        <Download size={13} /> <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden xs:inline">Export</span>
                    </Button>
                    
                    {showExportMenu && (
                        <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setShowExportMenu(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-white/10 rounded-xl shadow-2xl p-2 z-[110] animate-in fade-in zoom-in-95 duration-200">
                                <button onClick={() => handleExport("pdf")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all text-left">
                                    <FileText size={16} className="text-red-400" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Adobe PDF (.pdf)</span>
                                </button>
                                <button onClick={() => handleExport("doc")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all text-left">
                                    <BookOpen size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold uppercase tracking-tight">MS Word (.doc)</span>
                                </button>
                                <button onClick={() => handleExport("md")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all text-left">
                                    <FileText size={16} className="text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Markdown (.md)</span>
                                </button>
                            </div>
                        </>
                    )}
                 </div>
              </div>
           )}
        </div>

        {/* Content Viewer - Chat Style */}
        <div className="flex-1 relative bg-[#050505]">
           <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-6 py-12 lg:p-20" ref={scrollRef}>
              <div className="max-w-4xl mx-auto space-y-12 mb-20">
                 {isSummarizing && (
                   <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center animate-pulse">
                      <div className="relative">
                         <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                         <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                      </div>
                      <div className="space-y-2">
                         <h2 className="text-xl font-black text-white italic uppercase tracking-tight">{progressMsg}</h2>
                         <p className="text-sm font-medium leading-relaxed opacity-70">
                            Hãy nhấn nút <strong>Khai thác ngay</strong> ở thanh bên trái để bắt đầu bóc tách tinh túy của tài liệu này. 
                         </p>
                      </div>
                   </div>
                 )}

                 {/* Kết quả Quick Scan */}
                 {activeMode === "quick" && summaryData && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="h-6 md:h-8 w-1 bg-primary rounded-full" />
                             <h2 className="text-lg md:text-2xl font-black text-white uppercase italic tracking-tighter">Tổng quan kiến thức</h2>
                          </div>
                          <div className="p-5 md:p-8 rounded-[24px] md:rounded-[32px] bg-white/[0.03] border border-white/5 shadow-2xl">
                             <div className="markdown-content prose prose-invert max-w-none prose-p:text-sm md:prose-p:text-lg prose-p:leading-[1.7] md:prose-p:leading-[1.8] prose-p:text-zinc-300 prose-p:font-medium">
                                {renderContent(summaryData.overview)}
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Zap size={14} className="text-primary" /> Key Points
                             </h3>
                             <div className="space-y-3">
                                {summaryData.key_points?.map((p: string, i: number) => (
                                   <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3 group hover:bg-white/[0.05] transition-all">
                                      <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                      <span className="text-sm text-zinc-400 group-hover:text-zinc-200">{p}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Search size={14} className="text-primary" /> Core Concepts
                             </h3>
                             <div className="space-y-3">
                                {summaryData.concepts?.map((c: any, i: number) => (
                                   <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all">
                                      <div className="text-[13px] font-black text-primary uppercase italic mb-1">{c.t}</div>
                                      <div className="text-[11px] text-zinc-500 leading-relaxed">{c.d}</div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="p-10 rounded-[40px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
                          <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                             <Lightbulb size={16} /> Khả năng ứng dụng
                          </h4>
                          <p className="text-[17px] leading-[1.9] text-zinc-300 italic font-medium opacity-90">
                             "{summaryData.application}"
                          </p>
                       </div>
                    </div>
                 )}

                 {/* Kết quả Academic / DeepAnalysis */}
                 {(activeMode === "academic" || activeMode === "deep") && streamText && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
                           <div className="p-3 md:p-4 rounded-xl md:rounded-[20px] bg-primary/10 ring-1 ring-primary/30 text-primary">
                              <BookOpen size={24} className="md:w-8 md:h-8" />
                           </div>
                           <div>
                              <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter shrink-0">Academic Report.</h2>
                              <p className="text-[9px] md:text-xs font-medium text-zinc-500 uppercase tracking-widest">Mindex AI Analytical Architecture</p>
                           </div>
                        </div>
                        
                        <div className="markdown-content prose prose-invert max-w-none prose-headings:text-white prose-headings:font-black prose-headings:italic prose-headings:tracking-tight prose-h1:text-2xl md:prose-h1:text-4xl prose-h2:text-lg md:prose-h2:text-2xl prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-3 md:prose-h2:pb-4 prose-h2:mt-8 md:prose-h2:mt-12 prose-p:text-[15px] md:prose-p:text-[18px] prose-p:leading-[1.7] md:prose-p:leading-[1.9] prose-p:text-zinc-300 prose-p:font-medium prose-li:text-[14px] md:prose-li:text-[16px] prose-li:leading-[1.7] md:prose-li:leading-[1.8] prose-li:text-zinc-300 prose-li:font-medium prose-strong:text-primary prose-strong:font-black">
                          {renderContent(streamText)}
                        </div>
                     </div>
                 )}
                 <div ref={bottomRef} className="h-20" />
              </div>
           </div>
           
           {/* FAB for Mobile Generation */}
           {!isSummarizing && (
             <div className="md:hidden fixed bottom-6 right-6 z-[70]">
               <Button 
                 onClick={() => handleGenerateSummary(activeMode)}
                 className="w-14 h-14 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center p-0"
               >
                 <Sparkles size={24} />
               </Button>
             </div>
           )}

           {/* Shadow phủ đỉnh và đáy để tạo hiệu ứng Mail chuyên nghiệp */}
           <div className="absolute top-0 left-0 right-0 h-10 md:h-20 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none z-10" />
           <div className="absolute bottom-0 left-0 right-0 h-10 md:h-20 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}
