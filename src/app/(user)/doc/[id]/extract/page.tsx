"use client";

import { use, useEffect, useState } from "react";
import {
  Tag, History, Layers, ArrowLeft,
  Box, Binary, Zap, ChevronRight, TrendingUp,
  Loader2, GitBranch, Plus, X, FileText, Network,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSWR from "swr";
import { fetchApi, fetcher } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AIAnalysisPanel,
  AIAnalysisStatus,
  AIAnalysisStep,
} from "@/components/user/AIAnalysisPanel";
import {
  ExtractAnalysisType,
  useExtractAnalysisStream,
} from "@/hooks/useExtractAnalysisStream";

const ANALYSIS_META: Record<ExtractAnalysisType, { title: string; description: string; start: string; done: string }> = {
  keywords: {
    title: "Phân tích từ khóa",
    description: "AI sẽ trích xuất thuật ngữ, khái niệm và dữ kiện quan trọng.",
    start: "Bắt đầu đọc tài liệu để tìm từ khóa và khái niệm cốt lõi.",
    done: "Đã hoàn tất trích xuất từ khóa và khái niệm.",
  },
  formulas: {
    title: "Phân tích công thức",
    description: "AI sẽ tìm công thức, định lý, biến số và cách áp dụng.",
    start: "Bắt đầu quét ký hiệu, công thức và định lý trong tài liệu.",
    done: "Đã hoàn tất trích xuất công thức.",
  },
  timeline: {
    title: "Phân tích dòng thời gian",
    description: "AI sẽ tìm mốc thời gian, quy trình và ý nghĩa từng bước.",
    start: "Bắt đầu tìm mốc thời gian và quy trình có thứ tự.",
    done: "Đã hoàn tất dựng dòng thời gian.",
  },
  mindmap: {
    title: "Phân tích mind map",
    description: "AI sẽ tách chủ đề trung tâm và nhóm các nhánh kiến thức.",
    start: "Bắt đầu tách chủ đề trung tâm và các nhánh phụ.",
    done: "Đã hoàn tất cấu trúc mind map.",
  },
  compare: {
    title: "So sánh tài liệu",
    description: "AI sẽ đọc nhiều tài liệu, tìm điểm chung và khác biệt.",
    start: "Bắt đầu đọc các tài liệu đã chọn để so sánh.",
    done: "Đã hoàn tất so sánh tài liệu.",
  },
};

const ANALYSIS_STEP_TEMPLATES: Record<ExtractAnalysisType, Array<Omit<AIAnalysisStep, "status">>> = {
  keywords: [
    { id: "read", label: "Đọc tài liệu", detail: "Quét nội dung văn bản và nhận diện vùng kiến thức chính." },
    { id: "terms", label: "Nhận diện thuật ngữ", detail: "Tìm từ khóa, tần suất và mức độ quan trọng." },
    { id: "concepts", label: "Gom nhóm khái niệm", detail: "Liên kết thuật ngữ với khái niệm, ví dụ và định nghĩa." },
    { id: "facts", label: "Chuẩn bị dữ kiện", detail: "Tổng hợp dữ kiện quan trọng để hiển thị." },
  ],
  formulas: [
    { id: "scan", label: "Quét ký hiệu", detail: "Tìm công thức, phương trình, định lý và hằng số." },
    { id: "variables", label: "Giải thích biến số", detail: "Tách biến, tham số và ý nghĩa sử dụng." },
    { id: "classify", label: "Phân loại công thức", detail: "Gắn lĩnh vực, độ khó và tình huống áp dụng." },
    { id: "prepare", label: "Chuẩn bị kết quả", detail: "Sắp xếp danh sách công thức để dễ đọc." },
  ],
  timeline: [
    { id: "scan", label: "Tìm mốc sự kiện", detail: "Nhận diện ngày tháng, bước và quy trình có thứ tự." },
    { id: "order", label: "Sắp xếp thứ tự", detail: "Ghép các mốc theo dòng diễn tiến logic." },
    { id: "meaning", label: "Kiểm tra ý nghĩa", detail: "Rút ra vai trò và mức độ quan trọng của từng mốc." },
    { id: "prepare", label: "Dựng timeline", detail: "Chuẩn bị dòng thời gian và quy trình để hiển thị." },
  ],
  mindmap: [
    { id: "root", label: "Tìm chủ đề trung tâm", detail: "Xác định ý chính và phạm vi của tài liệu." },
    { id: "branches", label: "Nhóm nhánh phụ", detail: "Gom các cụm kiến thức thành nhánh mind map." },
    { id: "details", label: "Bổ sung chi tiết", detail: "Gắn node con và quan hệ giữa các nhánh." },
    { id: "layout", label: "Dựng cấu trúc", detail: "Chuẩn bị dữ liệu mind map để render." },
  ],
  compare: [
    { id: "load", label: "Đọc tài liệu", detail: "Tải nội dung từ các tài liệu đã chọn." },
    { id: "common", label: "Tìm điểm chung", detail: "Nhận diện chủ đề, luận điểm và khái niệm giao nhau." },
    { id: "differences", label: "Tìm khác biệt", detail: "So sánh từng khía cạnh giữa các tài liệu." },
    { id: "recommend", label: "Tổng hợp gợi ý", detail: "Tạo kết luận và hướng học tiếp theo." },
  ],
};

function createAnalysisSteps(type: ExtractAnalysisType): AIAnalysisStep[] {
  return ANALYSIS_STEP_TEMPLATES[type].map((step, index) => ({
    ...step,
    status: index === 0 ? "running" : "pending",
  }));
}

function advanceAnalysisSteps(steps: AIAnalysisStep[], detail?: string): AIAnalysisStep[] {
  const currentIndex = steps.findIndex((step) => step.status === "running");
  if (currentIndex === -1) return steps;

  if (currentIndex >= steps.length - 1) {
    return steps.map((step, index) =>
      index === currentIndex ? { ...step, detail: detail || step.detail } : step
    );
  }

  const nextIndex = currentIndex + 1;
  return steps.map((step, index) => {
    if (index < nextIndex) return { ...step, status: "complete" };
    if (index === nextIndex) return { ...step, status: "running", detail: detail || step.detail };
    return { ...step, status: "pending" };
  });
}

function completeAnalysisSteps(steps: AIAnalysisStep[]): AIAnalysisStep[] {
  return steps.map((step) => ({ ...step, status: "complete" }));
}

const MIN_ANALYSIS_VISIBLE_MS = 2200;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForAnalysisPaint() {
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
}

async function waitForMinimumAnalysisTime(startedAt: number) {
  const remainingMs = MIN_ANALYSIS_VISIBLE_MS - (Date.now() - startedAt);
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
}

function buildVisibleThinking(type: ExtractAnalysisType, docTitle?: string, selectedCount?: number) {
  const target = docTitle ? `tài liệu "${docTitle}"` : "tài liệu hiện tại";

  if (type === "keywords") {
    return `Người dùng đang yêu cầu tôi trích xuất từ khóa và khái niệm từ ${target}. Tôi cần đọc nội dung trước, sau đó phân biệt đâu là thuật ngữ xuất hiện thường xuyên, đâu là khái niệm thực sự quan trọng cho việc học.

Bố cục phân tích nên có:
1. Xác định các từ khóa nổi bật và mức độ quan trọng.
2. Gom các thuật ngữ gần nhau thành nhóm khái niệm.
3. Rút ra dữ kiện quan trọng có thể dùng để ôn tập.
4. Chuẩn bị phần giải thích ngắn gọn để người học hiểu nhanh thay vì chỉ nhìn một danh sách từ.`;
  }

  if (type === "formulas") {
    return `Người dùng đang yêu cầu tôi tìm công thức, định lý và ký hiệu trong ${target}. Tôi cần ưu tiên các biểu thức có ý nghĩa học thuật, tránh nhầm ví dụ văn bản thông thường thành công thức.

Bố cục phân tích nên có:
1. Quét các biểu thức toán học, vật lý, hóa học hoặc đoạn code có dạng công thức.
2. Xác định tên công thức và nhóm lĩnh vực.
3. Giải thích biến số, điều kiện áp dụng và cách dùng.
4. Trả kết quả theo dạng dễ so sánh để user có thể ôn tập nhanh.`;
  }

  if (type === "timeline") {
    return `Người dùng đang yêu cầu tôi dựng dòng thời gian hoặc quy trình từ ${target}. Tôi cần tìm các mốc có thứ tự, sau đó phân biệt sự kiện, bước xử lý và ý nghĩa của từng mốc.

Bố cục phân tích nên có:
1. Nhận diện ngày tháng, giai đoạn, bước hoặc chuỗi hành động.
2. Sắp xếp lại theo thứ tự logic.
3. Gắn ý nghĩa cho từng mốc để tránh chỉ liệt kê khô.
4. Tách riêng quy trình nếu tài liệu mô tả một chuỗi thao tác thay vì timeline lịch sử.`;
  }

  if (type === "mindmap") {
    return `Người dùng đang yêu cầu tôi dựng mind map từ ${target}. Tôi cần tìm chủ đề trung tâm trước, rồi nhóm các ý phụ theo quan hệ kiến thức thay vì chỉ chia đoạn theo thứ tự xuất hiện.

Bố cục phân tích nên có:
1. Xác định chủ đề chính của toàn bộ tài liệu.
2. Tách các nhánh lớn thành nhóm kiến thức độc lập.
3. Gắn node con cho khái niệm, ví dụ hoặc chi tiết hỗ trợ.
4. Chuẩn bị cấu trúc cây đủ rõ để UI mind map render mạch lạc.`;
  }

  return `Người dùng đang yêu cầu tôi so sánh ${selectedCount || 0} tài liệu. Tôi cần đọc từng nguồn, tìm phần giao nhau giữa các nội dung, rồi chỉ ra khác biệt theo từng khía cạnh thay vì so sánh chung chung.

Bố cục phân tích nên có:
1. Xác định chủ đề và phạm vi của từng tài liệu.
2. Tìm các điểm chung có giá trị học tập.
3. Tách các khác biệt theo khía cạnh cụ thể.
4. Đưa ra gợi ý nên đọc hoặc ôn theo thứ tự nào để hiểu tốt hơn.`;
}

export default function ExtractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<ExtractAnalysisType>("keywords");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractData, setExtractData] = useState<any>(null);
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<AIAnalysisStatus>("idle");
  const [analysisType, setAnalysisType] = useState<ExtractAnalysisType>("keywords");
  const [analysisSteps, setAnalysisSteps] = useState<AIAnalysisStep[]>([]);
  const [analysisInsights, setAnalysisInsights] = useState<string[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [streamDrivenAnalysis, setStreamDrivenAnalysis] = useState(false);

  // Compare state
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([id]);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const { runExtractStream } = useExtractAnalysisStream();

  const { data: docData } = useSWR(`/documents/${id}`, fetcher) as { data: any };
  const { data: allDocsData } = useSWR(`/documents`, fetcher) as { data: any };
  const doc = docData?.data;
  const allDocs: any[] = allDocsData?.data || [];
  const isAnalyzing = isExtracting || isComparing;

  useEffect(() => {
    if (analysisStatus !== "running" || streamDrivenAnalysis) return;

    const interval = window.setInterval(() => {
      setAnalysisSteps((steps) => advanceAnalysisSteps(steps));
    }, 1400);

    return () => window.clearInterval(interval);
  }, [analysisStatus, streamDrivenAnalysis]);

  const appendAnalysisInsight = (text?: string) => {
    const cleanText = text?.trim();
    if (!cleanText) return;
    setAnalysisInsights((items) => [...items, cleanText].slice(-12));
  };

  const resetAnalysis = () => {
    setAnalysisPanelOpen(false);
    setAnalysisStatus("idle");
    setAnalysisSteps([]);
    setAnalysisInsights([]);
    setAnalysisError(null);
    setStreamDrivenAnalysis(false);
  };

  const startAnalysis = (type: ExtractAnalysisType) => {
    setAnalysisType(type);
    setAnalysisPanelOpen(true);
    setAnalysisStatus("running");
    setAnalysisSteps(createAnalysisSteps(type));
    setAnalysisInsights([buildVisibleThinking(type, doc?.title, selectedDocIds.length)]);
    setAnalysisError(null);
    setStreamDrivenAnalysis(false);
  };

  const finishAnalysis = (type: ExtractAnalysisType) => {
    setAnalysisStatus("complete");
    setAnalysisPanelOpen(true);
    setAnalysisSteps((steps) => completeAnalysisSteps(steps));
    appendAnalysisInsight(ANALYSIS_META[type].done);
  };

  const failAnalysis = (message: string) => {
    setAnalysisStatus("error");
    setAnalysisPanelOpen(true);
    setAnalysisError(message);
    setAnalysisSteps((steps) =>
      steps.map((step) => (step.status === "running" ? { ...step, status: "error" } : step))
    );
    appendAnalysisInsight(message);
  };

  const handleStreamStatus = (message?: string) => {
    setStreamDrivenAnalysis(true);
    appendAnalysisInsight(message);
    setAnalysisSteps((steps) => advanceAnalysisSteps(steps, message));
  };

  const handleStreamInsight = (text?: string) => {
    setStreamDrivenAnalysis(true);
    appendAnalysisInsight(text);
  };

  const handleTabChange = (value: string) => {
    if (isAnalyzing) return;
    setActiveTab(value as ExtractAnalysisType);
    setExtractData(null);
    setCompareResult(null);
    resetAnalysis();
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const handleExtract = async (type: string) => {
    const extractType = type as ExtractAnalysisType;
    const analysisStartedAt = Date.now();
    startAnalysis(extractType);
    setIsExtracting(true);
    setExtractData(null);
    await waitForAnalysisPaint();
    try {
      const payload = { document_id: id };
      const streamResult = await runExtractStream({
        type: extractType,
        payload,
        onStatus: (event) => handleStreamStatus(event.message || event.step),
        onInsight: (event) => handleStreamInsight(event.text || event.message),
        onError: (message) => appendAnalysisInsight(message),
      });

      const res = streamResult.streamed && streamResult.data
        ? streamResult.data as any
        : (await fetchApi(`/extract/${type}`, {
            method: "POST",
            body: JSON.stringify(payload)
          })) as any;

      await waitForMinimumAnalysisTime(analysisStartedAt);
      setExtractData(res.data || res);
      finishAnalysis(extractType);
      toast.success("Trích xuất thành công!");
    } catch (error) {
      await waitForMinimumAnalysisTime(analysisStartedAt);
      const message = getErrorMessage(error, "Lỗi khi gọi AI.");
      failAnalysis(message);
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCompare = async () => {
    if (selectedDocIds.length < 2) {
      toast.error("Chọn ít nhất 2 tài liệu để so sánh");
      return;
    }
    const analysisStartedAt = Date.now();
    startAnalysis("compare");
    setIsComparing(true);
    setCompareResult(null);
    await waitForAnalysisPaint();
    try {
      const payload = { document_ids: selectedDocIds };
      const streamResult = await runExtractStream({
        type: "compare",
        payload,
        onStatus: (event) => handleStreamStatus(event.message || event.step),
        onInsight: (event) => handleStreamInsight(event.text || event.message),
        onError: (message) => appendAnalysisInsight(message),
      });

      const res = streamResult.streamed && streamResult.data
        ? streamResult.data as any
        : (await fetchApi(`/extract/compare`, {
            method: "POST",
            body: JSON.stringify(payload)
          })) as any;

      await waitForMinimumAnalysisTime(analysisStartedAt);
      setCompareResult(res);
      finishAnalysis("compare");
      toast.success("So sánh hoàn tất!");
    } catch (error) {
      await waitForMinimumAnalysisTime(analysisStartedAt);
      const message = getErrorMessage(error, "Lỗi khi so sánh.");
      failAnalysis(message);
      toast.error(message);
    } finally {
      setIsComparing(false);
    }
  };

  if (!doc) return <div className="p-8 text-center text-sm text-muted-foreground">Đang tải...</div>;

  return (
    <div className="min-h-full bg-background p-4 md:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
              <ArrowLeft size={14} /> Quay lại
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Zap className="text-amber-500 fill-amber-300" size={24} />
              Trích xuất Thông tin AI
            </h1>
            <p className="text-muted-foreground text-sm">
              Tài liệu: <span className="font-semibold text-foreground">{doc.title}</span>
            </p>
          </div>
          {activeTab !== "compare" && (
            <Button onClick={() => handleExtract(activeTab)} disabled={isAnalyzing} className="shrink-0">
              {isExtracting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
              Chạy trích xuất
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto grid grid-cols-3 md:grid-cols-5 gap-1">
            <TabsTrigger value="keywords" disabled={isAnalyzing} className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Tag size={14} className="mr-1.5" /> Từ khóa
            </TabsTrigger>
            <TabsTrigger value="formulas" disabled={isAnalyzing} className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FlaskConical size={14} className="mr-1.5" /> Công thức
            </TabsTrigger>
            <TabsTrigger value="timeline" disabled={isAnalyzing} className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <History size={14} className="mr-1.5" /> Dòng thời gian
            </TabsTrigger>
            <TabsTrigger value="mindmap" disabled={isAnalyzing} className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Network size={14} className="mr-1.5" /> Mind Map
            </TabsTrigger>
            <TabsTrigger value="compare" disabled={isAnalyzing} className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers size={14} className="mr-1.5" /> So sánh
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 min-h-[400px]">
            {analysisStatus !== "idle" && (
              <AIAnalysisPanel
                title={ANALYSIS_META[analysisType].title}
                description={ANALYSIS_META[analysisType].description}
                status={analysisStatus}
                steps={analysisSteps}
                insights={analysisInsights}
                error={analysisError}
                open={analysisPanelOpen}
                onOpenChange={setAnalysisPanelOpen}
                className="mb-6"
              />
            )}

            {/* ── KEYWORDS TAB ── */}
            <TabsContent value="keywords" className="m-0 space-y-6">
                {isExtracting && activeTab === "keywords" ? (
                  <AnalysisResultSkeleton label="Đang dựng bộ từ khóa và khái niệm..." />
                ) : !extractData ? (
                  <EmptyState label="Từ khóa & Khái niệm" onExtract={() => handleExtract("keywords")} />
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Từ khóa ({extractData.keywords?.length || 0})</CardTitle></CardHeader>
                        <CardContent><div className="flex flex-wrap gap-2">
                          {(extractData.keywords || []).map((kw: any, i: number) => (
                            <Badge key={i} variant="outline" className={cn("text-xs", kw.importance === "high" ? "border-primary/40 text-primary bg-primary/5" : "")}>
                              {kw.term || kw} {kw.frequency > 1 && <span className="ml-1 opacity-50">×{kw.frequency}</span>}
                            </Badge>
                          ))}
                        </div></CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Binary size={16} className="text-blue-500" /> Dữ kiện quan trọng</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(extractData.key_facts || []).slice(0, 5).map((f: any, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <ChevronRight size={12} className="mt-0.5 shrink-0 text-primary" />
                                <span>{f.fact || f}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Khái niệm chuyên sâu</CardTitle></CardHeader>
                      <CardContent>
                        <Accordion className="w-full">
                          {(extractData.core_concepts || []).map((c: any, i: number) => (
                            <AccordionItem key={i} value={`cc-${i}`} className="border-border/50">
                              <AccordionTrigger className="text-sm font-semibold hover:no-underline">{c.name}</AccordionTrigger>
                              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                <p className="mb-2">{c.explanation}</p>
                                {c.example && <div className="p-2 bg-muted/30 rounded-lg"><Box size={12} className="inline mr-1" /><b>Ví dụ:</b> {c.example}</div>}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>
                )}
            </TabsContent>

            {/* ── FORMULAS TAB ── */}
            <TabsContent value="formulas" className="m-0">
                {isExtracting && activeTab === "formulas" ? (
                  <AnalysisResultSkeleton label="Đang chuẩn bị danh sách công thức..." />
                ) : !extractData ? (
                  <EmptyState label="Công thức & Định lý" onExtract={() => handleExtract("formulas")} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {(extractData.formulas || []).map((f: any, i: number) => (
                      <Card key={i} className="border-border/60">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                              <FlaskConical size={16} className="text-blue-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-sm truncate">{f.name}</h4>
                                {f.category && <Badge variant="outline" className="text-[9px] shrink-0">{f.category}</Badge>}
                              </div>
                              <code className="text-sm text-primary font-mono bg-muted/50 px-2 py-1 rounded block mb-2">{f.formula}</code>
                              {f.variables && <p className="text-xs text-muted-foreground mb-1">{f.variables}</p>}
                              {f.usage && <p className="text-xs italic text-muted-foreground/70">{f.usage}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(extractData.formulas || []).length === 0 && (
                      <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">Không tìm thấy công thức trong tài liệu này.</div>
                    )}
                  </div>
                )}
            </TabsContent>

            {/* ── TIMELINE TAB ── */}
            <TabsContent value="timeline" className="m-0">
                {isExtracting && activeTab === "timeline" ? (
                  <AnalysisResultSkeleton label="Đang sắp xếp dòng thời gian..." />
                ) : !extractData ? (
                  <EmptyState label="Dòng thời gian" onExtract={() => handleExtract("timeline")} />
                ) : (
                  <div className="max-w-3xl mx-auto py-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                    {(extractData.timeline || []).map((t: any, i: number) => (
                      <div key={i} className="relative flex items-start mb-8 pl-14">
                        <div className="absolute left-[22px] w-3 h-3 rounded-full border-2 border-primary bg-background" />
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1 text-xs font-bold text-primary border-primary/30">{t.date_or_step || t.d}</Badge>
                          <h3 className="font-bold text-sm mb-0.5">{t.event || t.e}</h3>
                          <p className="text-xs text-muted-foreground">{t.significance || t.s}</p>
                        </div>
                      </div>
                    ))}
                    {(extractData.processes || []).map((p: any, i: number) => (
                      <div key={i} className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><GitBranch size={14} />{p.name}</h4>
                        <div className="space-y-1">
                          {(p.steps || []).map((s: string, j: number) => (
                            <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </TabsContent>

            {/* ── MIND MAP TAB ── */}
            <TabsContent value="mindmap" className="m-0">
                {isExtracting && activeTab === "mindmap" ? (
                  <AnalysisResultSkeleton label="Đang dựng cấu trúc mind map..." />
                ) : !extractData ? (
                  <EmptyState label="Mind Map" onExtract={() => handleExtract("mindmap")} />
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MindMapView node={extractData.root} depth={0} />
                  </div>
                )}
            </TabsContent>

            {/* ── COMPARE TAB ── */}
            <TabsContent value="compare" className="m-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Layers size={16} /> Chọn tài liệu để so sánh</CardTitle>
                    <CardDescription className="text-xs">Tài liệu hiện tại đã được chọn. Chọn thêm 1–3 tài liệu từ thư viện.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedDocIds.map((did) => {
                        const d = allDocs.find((x: any) => x.id === did);
                        return (
                          <Badge key={did} variant="outline" className="gap-1 pr-1 text-xs">
                            <FileText size={10} />
                            {d?.title || did.substring(0, 8)}
                            {did !== id && (
                              <button onClick={() => setSelectedDocIds(prev => prev.filter(x => x !== did))} className="ml-1 hover:text-red-500">
                                <X size={10} />
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                    <ScrollArea className="h-40 border border-border/50 rounded-xl p-2">
                      {allDocs.filter((d: any) => !selectedDocIds.includes(d.id) && d.status === "ready").map((d: any) => (
                        <button key={d.id} onClick={() => {
                          if (selectedDocIds.length < 4) setSelectedDocIds(prev => [...prev, d.id]);
                          else toast.info("Tối đa 4 tài liệu");
                        }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-xs transition-colors">
                          <Plus size={12} className="shrink-0 text-muted-foreground" />
                          <span className="truncate">{d.title}</span>
                        </button>
                      ))}
                    </ScrollArea>
                    <Button onClick={handleCompare} disabled={isAnalyzing || selectedDocIds.length < 2} className="mt-4 w-full md:w-auto">
                      {isComparing ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Layers size={14} className="mr-2" />}
                      So sánh {selectedDocIds.length} tài liệu
                    </Button>
                  </CardContent>
                </Card>

                {isComparing && (
                  <AnalysisResultSkeleton label="Đang tổng hợp điểm chung và khác biệt..." />
                )}

                {compareResult && !isComparing && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {compareResult.data?.summary && (
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Tổng quan</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">{compareResult.data.summary}</p></CardContent>
                      </Card>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {compareResult.data?.common_themes?.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600 dark:text-emerald-400">✓ Điểm chung</CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              {compareResult.data.common_themes.map((t: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <ChevronRight size={12} className="mt-0.5 shrink-0 text-emerald-500" />{t}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {compareResult.data?.differences?.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-600 dark:text-orange-400">≠ Điểm khác biệt</CardTitle></CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {compareResult.data.differences.map((d: any, i: number) => (
                                <div key={i} className="text-xs">
                                  <p className="font-semibold text-foreground mb-0.5">{d.aspect}</p>
                                  {Array.isArray(d.values) && d.values.map((v: string, j: number) => (
                                    <p key={j} className="text-muted-foreground pl-2 border-l border-border">
                                      <span className="font-medium">{compareResult.documents?.[j]?.title}:</span> {v}
                                    </p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    {compareResult.data?.recommendation && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">💡 Gợi ý học</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">{compareResult.data.recommendation}</p></CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ label, onExtract }: { label: string; onExtract: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] border border-dashed border-border rounded-3xl gap-4">
      <div className="p-4 bg-muted/40 rounded-full">
        <Zap size={28} className="text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground text-sm">Nhấn để AI trích xuất <b>{label}</b></p>
      <Button variant="outline" size="sm" onClick={onExtract}>Bắt đầu phân tích</Button>
    </div>
  );
}

function AnalysisResultSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
        <Loader2 size={16} className="shrink-0 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-4 h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted/70" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MindMapNode({ node, depth }: { node: any; depth: number }) {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const color = node.color || colors[depth % colors.length];

  return (
    <div className={cn("pl-4 border-l-2", depth > 0 && "ml-4 mt-1")} style={{ borderColor: color }}>
      <div className="flex items-center gap-2 py-1">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className={cn("text-sm", depth === 0 ? "font-bold text-base" : depth === 1 ? "font-semibold" : "text-muted-foreground")}>{node.label}</span>
      </div>
      {(node.children || []).map((child: any) => (
        <MindMapNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function MindMapView({ node, depth }: { node: any; depth: number }) {
  if (!node) return <div className="text-center py-10 text-muted-foreground text-sm">Không có dữ liệu mind map.</div>;
  return (
    <div className="p-6 bg-muted/20 rounded-2xl border border-border/50">
      <MindMapNode node={node} depth={depth} />
    </div>
  );
}
