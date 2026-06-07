import { create } from 'zustand';

interface ActiveChunk {
  page: number;
  content: string;
  chunkIndex?: number;
}

type SidebarMode = "inbox" | "document";

interface PdfStore {
  activeChunk: ActiveChunk | null;
  sidebarMode: SidebarMode;
  setActiveChunk: (page: number, content: string, chunkIndex?: number) => void;
  clearChunk: () => void;
  setSidebarMode: (mode: SidebarMode) => void;
  navigateToChunk: (page: number, content: string, chunkIndex?: number) => void;
}

export const usePdfStore = create<PdfStore>((set) => ({
  activeChunk: null,
  sidebarMode: "inbox",

  setActiveChunk: (page, content, chunkIndex) =>
    set({ activeChunk: { page, content, chunkIndex } }),

  clearChunk: () => set({ activeChunk: null }),

  setSidebarMode: (mode) => set({ sidebarMode: mode }),

  // Chuyển sidebar sang document mode + set active chunk (dùng khi click source)
  navigateToChunk: (page, content, chunkIndex) =>
    set({
      sidebarMode: "document",
      activeChunk: { page, content, chunkIndex },
    }),
}));
