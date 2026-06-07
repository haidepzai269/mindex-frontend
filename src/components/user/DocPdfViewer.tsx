"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { usePdfStore } from "@/store/usePdfStore";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface DocPdfViewerProps {
  url: string;
  className?: string;
}

export default function DocPdfViewer({ url, className }: DocPdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loadError, setLoadError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeChunk = usePdfStore((s) => s.activeChunk);

  // Jump to page when source is clicked
  useEffect(() => {
    if (activeChunk?.page && activeChunk.page > 0) {
      setCurrentPage(activeChunk.page);
    }
  }, [activeChunk]);

  // Responsive width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 600;
      setContainerWidth(width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pdfWidth = Math.max(280, containerWidth - 32) * scale;

  const customTextRenderer = ({ str }: { str: string }) => {
    if (!activeChunk?.content || !str.trim()) return str;
    if (activeChunk.content.toLowerCase().includes(str.toLowerCase().trim())) {
      return `<mark class="pdf-chunk-highlight">${str}</mark>`;
    }
    return str;
  };

  if (loadError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full p-6 text-center gap-3",
          className
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle size={18} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">
            Không thể tải PDF
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            File có thể đã hết hạn hoặc không khả dụng
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-muted/20", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={13} />
          </Button>
          <span className="text-[11px] font-bold text-muted-foreground min-w-[64px] text-center tabular-nums">
            {currentPage} / {numPages || "–"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() =>
              setCurrentPage((p) => Math.min(numPages, p + 1))
            }
            disabled={currentPage >= numPages}
          >
            <ChevronRight size={13} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setScale((s) => Math.max(0.4, +(s - 0.2).toFixed(1)))}
          >
            <ZoomOut size={13} />
          </Button>
          <span className="text-[11px] font-bold text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)))}
          >
            <ZoomIn size={13} />
          </Button>
        </div>
      </div>

      {/* Active chunk banner */}
      {activeChunk && (
        <div className="mx-3 mt-2 shrink-0 px-3 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-0.5">
            Đoạn trích dẫn · Trang {activeChunk.page}
          </span>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed line-clamp-3 italic">
            "{activeChunk.content}"
          </p>
        </div>
      )}

      {/* PDF content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center py-4 px-4"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setLoadError(true)}
          loading={
            <div className="flex items-center justify-center h-48 w-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          }
          error={null}
        >
          <Page
            pageNumber={currentPage}
            width={pdfWidth}
            renderTextLayer
            renderAnnotationLayer
            customTextRenderer={customTextRenderer}
            className="shadow-xl rounded-md overflow-hidden"
            loading={
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}
