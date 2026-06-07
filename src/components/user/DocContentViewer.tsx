"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { usePdfStore } from "@/store/usePdfStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DocContentViewerProps {
  docId: string;
}

interface ChunkData {
  chunk_index: number;
  page_number: number;
  content: string;
}

export default function DocContentViewer({ docId }: DocContentViewerProps) {
  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: { title: string; chunks: ChunkData[] };
  }>(`/documents/${docId}/content`, fetcher as any);

  const activeChunk = usePdfStore((s) => s.activeChunk);
  const chunkRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Auto-scroll đến chunk active khi source được click
  useEffect(() => {
    if (activeChunk?.chunkIndex != null) {
      const el = chunkRefs.current.get(activeChunk.chunkIndex);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeChunk?.chunkIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
          Đang tải nội dung
        </p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle size={16} className="text-amber-500" />
        </div>
        <p className="text-xs font-bold text-muted-foreground">
          Không thể tải nội dung tài liệu
        </p>
      </div>
    );
  }

  const chunks = data.data.chunks;

  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <FileText size={24} className="text-muted-foreground/20" />
        <p className="text-xs font-bold text-muted-foreground/50">
          Tài liệu chưa có nội dung
        </p>
      </div>
    );
  }

  // Nhóm chunks theo page_number
  const pageGroups = new Map<number, ChunkData[]>();
  for (const chunk of chunks) {
    const page = chunk.page_number || 0;
    if (!pageGroups.has(page)) pageGroups.set(page, []);
    pageGroups.get(page)!.push(chunk);
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {/* Header */}
        <div className="mb-4 px-1">
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">
            Nội dung tài liệu
          </p>
          <p className="text-[10px] text-muted-foreground/50 font-medium">
            {chunks.length} đoạn · {pageGroups.size} trang
          </p>
        </div>

        {Array.from(pageGroups.entries()).map(([pageNum, pageChunks]) => (
          <div key={pageNum} className="mb-3">
            {/* Page header */}
            {pageNum > 0 && (
              <div className="sticky top-0 z-10 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/80 backdrop-blur-sm border border-border/50 rounded-lg text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                  <FileText size={9} />
                  Trang {pageNum}
                </span>
              </div>
            )}

            {/* Chunks in this page */}
            <div className="space-y-1.5">
              {pageChunks.map((chunk) => {
                const isActive =
                  activeChunk?.chunkIndex === chunk.chunk_index;

                return (
                  <motion.div
                    key={chunk.chunk_index}
                    ref={(el) => {
                      if (el) chunkRefs.current.set(chunk.chunk_index, el);
                    }}
                    animate={
                      isActive
                        ? { scale: 1.01 }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-[11px] leading-relaxed font-medium transition-all duration-300 border",
                      isActive
                        ? "bg-primary/10 border-primary/30 text-foreground ring-1 ring-primary/20"
                        : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40 hover:border-border/60"
                    )}
                  >
                    {/* Chunk index label */}
                    <span className="inline-block mb-1 text-[8px] font-black uppercase tracking-widest opacity-40">
                      #{chunk.chunk_index + 1}
                    </span>
                    <p className="whitespace-pre-wrap break-words">
                      {chunk.content}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
