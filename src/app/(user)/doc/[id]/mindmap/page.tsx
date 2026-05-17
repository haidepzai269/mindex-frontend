"use client";

import React, { useState, useEffect, use, useCallback, useRef } from "react";
import { ArrowLeft, Sparkles, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// React Flow
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import dynamic from "next/dynamic";

const MindmapPdfViewer = dynamic(() => import("@/components/user/MindmapPdfViewer"), {
  ssr: false,
  loading: () => <Loader2 className="animate-spin text-muted-foreground mt-10" />
});

interface MindmapNodeData extends Record<string, unknown> {
  label: string;
  summary: string;
  chunk_id: string;
  page_number: number;
}

export default function MindmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindmapData, setMindmapData] = useState<any>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindmapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedNodeData, setSelectedNodeData] = useState<MindmapNodeData | null>(null);

  // Fetch doc metadata for Cloudinary URL
  const { data: docData } = useSWR(id ? `/documents/${id}` : null, fetchApi) as { data: any };
  const doc = docData?.data;

  // Fetch mindmap cache
  const { data: mindmapCache, error: cacheError, mutate: mutateMindmap } = useSWR(
    id ? `/study/docs/${id}/mindmap` : null, 
    fetchApi,
    { shouldRetryOnError: false }
  ) as { data: any, error: any, mutate: any };

  useEffect(() => {
    if (mindmapCache && !mindmapCache.error) {
      setMindmapData(mindmapCache);
      processMindmapData(mindmapCache);
    }
  }, [mindmapCache]);

  const processMindmapData = (data: any) => {
    if (!data || !data.nodes) return;
    
    // Auto-layout logic (simple radial/tree fallback or just list for now)
    // We'll place them in a basic grid if layout is not provided
    const newNodes: Node<MindmapNodeData>[] = data.nodes.map((n: any, i: number) => ({
      id: n.id,
      position: { x: (i % 5) * 250, y: Math.floor(i / 5) * 150 }, // simple grid layout
      data: {
        label: n.label,
        summary: n.summary,
        chunk_id: n.chunk_id,
        page_number: n.page_number
      },
      style: {
        background: '#1a1b26',
        color: '#fff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px',
        width: 180,
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }
    }));
    
    // Auto layout - try to make it look a bit like a mindmap by placing root in center
    if (newNodes.length > 0) {
      const rootId = data.nodes[0].id; // assume first is root
      newNodes[0].position = { x: 400, y: 50 };
      newNodes[0].style = { ...newNodes[0].style, background: '#3b82f6', borderColor: '#60a5fa', fontSize: '14px' };
      
      // place others roughly in circle/tree below root
      let currentX = 50;
      let currentY = 200;
      for (let i = 1; i < newNodes.length; i++) {
        newNodes[i].position = { x: currentX, y: currentY };
        currentX += 220;
        if (currentX > 800) {
          currentX = 50;
          currentY += 150;
        }
      }
    }

    const newEdges: Edge[] = (data.edges || []).map((e: any, i: number) => ({
      id: `e${i}-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      label: e.label,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleGenerateMindmap = async () => {
    setIsGenerating(true);
    try {
      const res = await fetchApi(`/study/docs/${id}/mindmap/generate`, { method: "POST" }) as any;
      if (res && res.nodes) {
        toast.success("Mindmap đã tạo thành công!");
        setMindmapData(res);
        processMindmapData(res);
        mutateMindmap(); // refresh cache
      } else {
        toast.error(res?.error || "Lỗi tạo Mindmap");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống khi tạo mindmap");
    } finally {
      setIsGenerating(false);
    }
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<MindmapNodeData>) => {
    const data = node.data;
    setSelectedNodeData(data);
    if (data.page_number) {
      setCurrentPage(data.page_number);
    }
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!doc) return (
    <div className="h-screen bg-background flex items-center justify-center">
       <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
    </div>
  );

  return (
    <div className="h-full bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="h-14 md:h-16 border-b border-border/50 flex items-center px-4 md:px-8 bg-card/80 backdrop-blur-xl shrink-0 z-10">
         <button
           onClick={() => window.history.back()}
           className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest font-bold mr-4"
         >
            <ArrowLeft size={14} /> <span className="hidden md:inline">Trở về</span>
         </button>
         <div className="h-4 w-px bg-border mx-2" />
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">BẢN ĐỒ TƯ DUY</span>
            <span className="text-xs font-bold text-foreground truncate max-w-[200px] md:max-w-md">{doc.title}</span>
         </div>
         <div className="ml-auto">
            {!mindmapData && !isGenerating && (
              <Button onClick={handleGenerateMindmap} className="gap-2 font-bold text-xs">
                <Sparkles size={14} /> Tạo Mindmap
              </Button>
            )}
            {isGenerating && (
              <Button disabled className="gap-2 font-bold text-xs">
                <Loader2 size={14} className="animate-spin" /> Đang tạo AI...
              </Button>
            )}
         </div>
      </div>

      {/* Main Content - Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
         {/* Left Column: React Flow */}
         <ResizablePanel defaultSize={60} minSize={30} className="relative bg-[#09090b]">
            {!mindmapData ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                     <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-2">Chưa có Mindmap</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">AI sẽ phân tích tài liệu và tự động tạo sơ đồ trực quan hóa các kiến thức quan trọng.</p>
                  <Button onClick={handleGenerateMindmap} disabled={isGenerating} size="lg" className="rounded-xl">
                     {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                     {isGenerating ? "Đang phân tích..." : "Tạo Mindmap Ngay"}
                  </Button>
               </div>
            ) : (
               <div className="absolute inset-0">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    fitView
                    colorMode="dark"
                    attributionPosition="bottom-right"
                  >
                    <Background color="#333" gap={16} />
                    <Controls className="!bg-zinc-900 border-zinc-800 fill-zinc-400 text-zinc-400" style={{ borderRadius: '8px', overflow: 'hidden' }} />
                    <MiniMap zoomable pannable nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.6)" style={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a' }} />
                  </ReactFlow>
               </div>
            )}
         </ResizablePanel>

         <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-primary transition-colors cursor-col-resize z-50" />

         {/* Right Column: PDF Viewer & Info */}
         <ResizablePanel defaultSize={40} minSize={20} className="flex flex-col bg-background relative overflow-hidden">
            {/* Info Panel for clicked node */}
            {selectedNodeData && (
               <div className="shrink-0 p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm shadow-sm animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-primary text-sm uppercase tracking-tight">{selectedNodeData.label}</h4>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold border border-primary/20 shrink-0">
                      Trang {selectedNodeData.page_number > 0 ? selectedNodeData.page_number : "?"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedNodeData.summary}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/60 mt-3 uppercase tracking-widest break-all">
                    Nguồn (Chunk ID): {selectedNodeData.chunk_id}
                  </p>
               </div>
            )}
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto custom-scrollbar flex justify-center bg-[#f0f0f0] dark:bg-zinc-900/50 relative py-4">
               {doc.cloudinary_url && doc.cloudinary_url.endsWith(".pdf") ? (
                  <MindmapPdfViewer 
                    url={doc.cloudinary_url}
                    currentPage={currentPage}
                    onLoadSuccess={onDocumentLoadSuccess}
                  />
               ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-muted-foreground">
                    <p>Tài liệu này không có file PDF hoặc không hỗ trợ hiển thị nội tuyến.</p>
                  </div>
               )}
            </div>

            {/* PDF Controls */}
            {numPages && (
              <div className="h-12 border-t border-border/50 bg-card/80 backdrop-blur flex items-center justify-center gap-4 shrink-0">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={currentPage <= 1}
                   onClick={() => setCurrentPage(p => p - 1)}
                   className="h-8"
                 >
                   Trang trước
                 </Button>
                 <span className="text-xs font-bold font-mono">
                   {currentPage} / {numPages}
                 </span>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={currentPage >= numPages}
                   onClick={() => setCurrentPage(p => p + 1)}
                   className="h-8"
                 >
                   Trang sau
                 </Button>
              </div>
            )}
         </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
