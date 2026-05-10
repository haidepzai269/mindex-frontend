"use client";

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MindmapPdfViewerProps {
  url: string;
  currentPage: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
}

export default function MindmapPdfViewer({ url, currentPage, onLoadSuccess }: MindmapPdfViewerProps) {
  // Safe window width check for responsive PDF width
  const pdfWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth / 2 - 40, 800) : 800;

  return (
    <Document
      file={url}
      onLoadSuccess={onLoadSuccess}
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
