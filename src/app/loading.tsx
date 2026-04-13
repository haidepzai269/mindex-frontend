import React from "react";
import MindexLoader from "@/components/ui/MindexLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505]">
      {/* Main Loader */}
      <MindexLoader size="lg" />
      
      {/* Subtle bottom text (can be removed if too busy) */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center opacity-20 transition-opacity hover:opacity-40">
        <p className="text-[10px] font-medium text-white tracking-[0.5em] uppercase">
          Neural Intelligence System
        </p>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
