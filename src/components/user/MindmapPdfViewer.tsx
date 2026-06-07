"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, Loader2, MapPinned } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface MindmapSourcePreview {
  label: string;
  summary: string;
  chunk_id: string;
  page_number: number;
}

interface MindmapPdfViewerProps {
  url: string;
  currentPage: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  sourcePreview?: MindmapSourcePreview | null;
  relatedPreviews?: MindmapSourcePreview[];
}

type PdfSourceState = "checking" | "available" | "unavailable";

export default function MindmapPdfViewer({
  url,
  currentPage,
  onLoadSuccess,
  sourcePreview,
  relatedPreviews = [],
}: MindmapPdfViewerProps) {
  const [sourceState, setSourceState] = useState<PdfSourceState>("checking");
  const pdfWidth = typeof window !== "undefined" ? Math.min(window.innerWidth / 2 - 40, 800) : 800;

  useEffect(() => {
    if (!url) {
      setSourceState("unavailable");
      return;
    }

    let cancelled = false;
    setSourceState("checking");

    fetch(url, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        setSourceState(res.ok ? "available" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setSourceState("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const samePagePreviews = useMemo(() => {
    if (!sourcePreview) return relatedPreviews.slice(0, 4);
    return relatedPreviews
      .filter((item) => item.chunk_id !== sourcePreview.chunk_id)
      .filter((item) => item.page_number === sourcePreview.page_number)
      .slice(0, 4);
  }, [relatedPreviews, sourcePreview]);

  if (sourceState === "checking") {
    return (
      <div className="flex min-h-[360px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sourceState === "unavailable") {
    return (
      <div className="flex min-h-full w-full items-center justify-center px-5 py-8">
        <div className="w-full max-w-xl rounded-lg border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                PDF gốc chưa thể hiển thị
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Mindex vẫn hiển thị phần nguồn đã trích xuất từ mindmap để bạn đối chiếu nhanh.
              </p>
            </div>
          </div>

          {sourcePreview ? (
            <div className="rounded-md border border-border/60 bg-background/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText size={16} className="shrink-0 text-primary" />
                  <h4 className="truncate text-sm font-bold text-foreground">{sourcePreview.label}</h4>
                </div>
                <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Trang {sourcePreview.page_number > 0 ? sourcePreview.page_number : "?"}
                </span>
              </div>
              <p className="text-sm leading-6 text-foreground/85">{sourcePreview.summary}</p>
              <p className="mt-4 break-all font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Chunk: {sourcePreview.chunk_id}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-5 text-center">
              <MapPinned className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Chọn một node trên mindmap</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nội dung nguồn của node sẽ xuất hiện tại đây.
              </p>
            </div>
          )}

          {samePagePreviews.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Cùng trang
              </div>
              {samePagePreviews.map((item, index) => (
                <div
                  key={`${item.chunk_id}-${item.page_number}-${index}`}
                  className="rounded-md border border-border/50 bg-background/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-bold text-foreground">{item.label}</span>
                    <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
                      Trang {item.page_number > 0 ? item.page_number : "?"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Document
      file={url}
      onLoadSuccess={onLoadSuccess}
      onLoadError={() => setSourceState("unavailable")}
      error={null}
      loading={<Loader2 className="animate-spin text-muted-foreground mt-10" />}
      className="flex flex-col items-center"
    >
      <Page
        pageNumber={currentPage}
        width={pdfWidth}
        className="shadow-xl"
        renderTextLayer={true}
        renderAnnotationLayer={true}
      />
    </Document>
  );
}
