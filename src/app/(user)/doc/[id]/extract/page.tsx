"use client";

import { use, useState } from "react";
import {
  Tag, History, Search, Layers, ArrowLeft, Calendar,
  Box, Binary, Code, Zap, ChevronRight, TrendingUp,
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

export default function ExtractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("keywords");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractData, setExtractData] = useState<any>(null);

  // Compare state
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([id]);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const { data: docData } = useSWR(`/documents/${id}`, fetcher) as { data: any };
  const { data: allDocsData } = useSWR(`/documents`, fetcher) as { data: any };
  const doc = docData?.data;
  const allDocs: any[] = allDocsData?.data || [];

  const handleExtract = async (type: string) => {
    setIsExtracting(true);
    setExtractData(null);
    try {
      const res = (await fetchApi(`/extract/${type}`, {
        method: "POST",
        body: JSON.stringify({ document_id: id })
      })) as any;
      setExtractData(res.data || res);
      toast.success("Trích xuất thành công!");
    } catch {
      toast.error("Lỗi khi gọi AI.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCompare = async () => {
    if (selectedDocIds.length < 2) {
      toast.error("Chọn ít nhất 2 tài liệu để so sánh");
      return;
    }
    setIsComparing(true);
    setCompareResult(null);
    try {
      const res = (await fetchApi(`/extract/compare`, {
        method: "POST",
        body: JSON.stringify({ document_ids: selectedDocIds })
      })) as any;
      setCompareResult(res);
      toast.success("So sánh hoàn tất!");
    } catch {
      toast.error("Lỗi khi so sánh.");
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
            <Button onClick={() => handleExtract(activeTab)} disabled={isExtracting} className="shrink-0">
              {isExtracting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
              Chạy trích xuất
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setExtractData(null); }} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto grid grid-cols-3 md:grid-cols-5 gap-1">
            <TabsTrigger value="keywords" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Tag size={14} className="mr-1.5" /> Từ khóa
            </TabsTrigger>
            <TabsTrigger value="formulas" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FlaskConical size={14} className="mr-1.5" /> Công thức
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <History size={14} className="mr-1.5" /> Dòng thời gian
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Network size={14} className="mr-1.5" /> Mind Map
            </TabsTrigger>
            <TabsTrigger value="compare" className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers size={14} className="mr-1.5" /> So sánh
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 min-h-[400px]">
            {/* Loading */}
            {isExtracting && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">AI đang phân tích tài liệu...</p>
              </div>
            )}

            {/* ── KEYWORDS TAB ── */}
            {!isExtracting && (
              <TabsContent value="keywords" className="m-0 space-y-6">
                {!extractData ? (
                  <EmptyState label="Từ khóa & Khái niệm" onExtract={() => handleExtract("keywords")} />
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-300">
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
            )}

            {/* ── FORMULAS TAB ── */}
            {!isExtracting && (
              <TabsContent value="formulas" className="m-0">
                {!extractData ? (
                  <EmptyState label="Công thức & Định lý" onExtract={() => handleExtract("formulas")} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
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
            )}

            {/* ── TIMELINE TAB ── */}
            {!isExtracting && (
              <TabsContent value="timeline" className="m-0">
                {!extractData ? (
                  <EmptyState label="Dòng thời gian" onExtract={() => handleExtract("timeline")} />
                ) : (
                  <div className="max-w-3xl mx-auto py-6 relative animate-in fade-in duration-300">
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
            )}

            {/* ── MIND MAP TAB ── */}
            {!isExtracting && (
              <TabsContent value="mindmap" className="m-0">
                {!extractData ? (
                  <EmptyState label="Mind Map" onExtract={() => handleExtract("mindmap")} />
                ) : (
                  <div className="animate-in fade-in duration-300">
                    <MindMapView node={extractData.root} depth={0} />
                  </div>
                )}
              </TabsContent>
            )}

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
                    <Button onClick={handleCompare} disabled={isComparing || selectedDocIds.length < 2} className="mt-4 w-full md:w-auto">
                      {isComparing ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Layers size={14} className="mr-2" />}
                      So sánh {selectedDocIds.length} tài liệu
                    </Button>
                  </CardContent>
                </Card>

                {isComparing && (
                  <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <span className="text-sm">AI đang so sánh tài liệu...</span>
                  </div>
                )}

                {compareResult && !isComparing && (
                  <div className="space-y-4 animate-in fade-in duration-300">
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
