"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Library, Globe, Settings, Plus, Upload, Link as LinkIcon, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ImportLinkDialog } from "./ImportLinkDialog";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { mutate } from "swr";

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastTouchY = useRef(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - lastTouchY.current;

      // Vuốt lên (Scroll Down trang) -> Ẩn
      if (diff < -15) {
        setIsVisible(false);
        lastTouchY.current = currentY;
      } 
      // Vuốt xuống (Scroll Up trang) -> Hiện
      else if (diff > 15) {
        setIsVisible(true);
        lastTouchY.current = currentY;
      }
    };

    // wheel event cho desktop testing
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 20) setIsVisible(false);
      else if (e.deltaY < -20) setIsVisible(true);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  if (pathname.startsWith("/doc/")) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom,16px)] pt-2 bg-gradient-to-t from-[#0A0B10] via-background/95 to-background/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between relative px-2">
              {/* Thư viện */}
              <NavItem 
                href="/library" 
                icon={<Library size={22} />} 
                active={pathname === "/library"} 
                label="Thư viện"
              />

              {/* Floating Action Button (Center) */}
              <DropdownMenu>
                <DropdownMenuTrigger className="relative -top-6 w-14 h-14 outline-none rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_20px_rgba(184,41,255,0.4)] hover:scale-105 active:scale-95 transition-transform">
                    <Plus size={28} className="drop-shadow-lg" />
                    <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse pointer-events-none" />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  side="top" 
                  sideOffset={16}
                  className="w-56 bg-[#1a1b26]/95 backdrop-blur-xl border-white/10 p-2 rounded-2xl shadow-2xl mb-2"
                >
                  <DropdownMenuItem 
                    onClick={() => router.push('/upload')}
                    className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-white/10 focus:bg-white/10 text-white/90"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Upload size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Tải lên tài liệu</div>
                      <div className="text-[10px] text-white/40">PDF, Word, TXT, MD</div>
                    </div>
                  </DropdownMenuItem>
                  
                  <div className="h-[1px] bg-white/5 my-1" />
                  
                  <DropdownMenuItem 
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-white/10 focus:bg-white/10 text-white/90"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <LinkIcon size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Nhập từ Link</div>
                      <div className="text-[10px] text-white/40">Thêm từ thư viện cộng đồng</div>
                    </div>
                  </DropdownMenuItem>

                  <div className="h-[1px] bg-white/5 my-1" />

                  <DropdownMenuItem 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-white/10 focus:bg-white/10 text-white/90"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <FolderPlus size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Tạo bộ sưu tập</div>
                      <div className="text-[10px] text-white/40">Gom nhóm nhiều tài liệu</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cộng đồng */}
              <NavItem 
                href="/community" 
                icon={<Globe size={22} />} 
                active={pathname === "/community"}
                label="Khám phá"
              />

              {/* Settings */}
              <NavItem 
                href="/settings" 
                icon={<Settings size={22} />} 
                active={pathname.startsWith("/settings")}
                label="Cài đặt"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportLinkDialog 
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
      />
      
      <CreateCollectionModal 
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={() => mutate("/collections")}
      />
    </>
  );
}

function NavItem({ href, icon, active, label }: { href: string; icon: React.ReactNode; active: boolean; label: string }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center w-16 h-12 gap-1.5 transition-all outline-none",
      active ? "text-primary scale-110" : "text-white/40 hover:text-white/60 active:scale-95"
    )}>
      {icon}
      {active && <span className="text-[9px] font-bold tracking-wider">{label}</span>}
      {active && (
        <motion.div 
          layoutId="nav-indicator" 
          className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(184,41,255,0.8)]"
        />
      )}
    </Link>
  );
}
