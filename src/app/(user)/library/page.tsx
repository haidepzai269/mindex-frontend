"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Grid, List, Plus, FileText, MoreVertical, Loader2, Star, Trash2, Globe, GlobeLock, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useConfirmStore } from "@/store/useConfirmStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { CommunityShareDialog } from "@/components/user/CommunityShareDialog";
import { CollectionCard } from "@/components/user/CollectionCard";
import { CreateCollectionModal } from "@/components/user/CreateCollectionModal";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, ChevronRight, Link as LinkIcon } from "lucide-react";
import { ImportLinkDialog } from "@/components/user/ImportLinkDialog";
import { NotificationBell } from "@/components/user/NotificationBell";
import { useAuthStore } from "@/store/useAuthStore";
import { formatTimeAgo, formatTimeLeft } from "@/lib/time";

interface ApiResponse {
  success: boolean;
  data: any[];
}

export default function LibraryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSwitching, setIsSwitching] = useState(false);
  const { mutate } = useSWRConfig();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const { data, error, isLoading } = useSWR<ApiResponse>("/documents", fetcher as any);
  const { data: collectionsData, mutate: mutateCollections } = useSWR<ApiResponse>("/collections", fetcher as any);

  // Load viewMode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("mindex_view_mode") as "grid" | "list";
    if (savedMode) setViewMode(savedMode);
  }, []);

  const handleUpdateViewMode = (mode: "grid" | "list") => {
    if (mode === viewMode || isSwitching) return;
    
    setIsSwitching(true);
    localStorage.setItem("mindex_view_mode", mode);
    
    setTimeout(() => {
      setViewMode(mode);
      setIsSwitching(false);
    }, 150);
  };

  const docs = data?.success ? data.data : [];

  const filteredDocs = useMemo(() => {
    return docs.filter((doc: any) => {
      const matchesTab = 
        activeTab === "all" || 
        (activeTab === "pinned" && doc.pinned) || 
        (activeTab === "public" && doc.is_public) ||
        (activeTab === "expiring" && doc.expired_at && (new Date(doc.expired_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000));
      
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [docs, activeTab, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative z-0">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      {/* TOPBAR */}
      <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-10 w-full shrink-0">
        <div className="flex-1 max-w-xl relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input 
            placeholder="Tìm kiếm tài liệu..." 
            className="pl-9 glass-input bg-white/5 border-white/5 h-9 md:h-11 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 ml-3 md:ml-4">
          <Link href="/rooms" className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all" title="Phòng học nhóm">
            <Users size={20} />
          </Link>
          <div className="hidden md:flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => handleUpdateViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white border border-white/5' : 'text-white/40 hover:text-white'}`}
              title="Dạng lưới"
            >
              <Grid size={16} />
            </button>
            <button 
               onClick={() => handleUpdateViewMode("list")}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white border border-white/5' : 'text-white/40 hover:text-white'}`}
               title="Dạng danh sách"
            >
              <List size={16} />
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2 px-4 h-10">
            <FolderPlus size={16} />
            <span>Bộ tài liệu mới</span>
          </Button>

          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2 px-4 h-10">
            <LinkIcon size={16} />
            <span>Sử dụng Link Share</span>
          </Button>

          <Button onClick={() => router.push('/upload')} className="bg-white/90 text-black hover:bg-white h-10 px-4 font-bold border-none">
            <Plus size={16} />
            <span>Upload tài liệu</span>
          </Button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto">
        <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
             <h1 className="text-xl md:text-2xl font-bold tracking-tight">Thư viện cá nhân</h1>
             <p className="text-white/50 text-xs mt-1 hidden md:block">Quản lý và trò chuyện với các tài liệu học tập của bạn.</p>
           </div>
           
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
             <TabsList className="bg-white/5 border border-white/10 p-1 flex w-max md:w-auto">
               <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Tất cả</TabsTrigger>
               <TabsTrigger value="pinned" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">Đã ghim ⭐</TabsTrigger>
               <TabsTrigger value="public" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">Công khai 🌐</TabsTrigger>
               <TabsTrigger value="expiring" className="text-xs data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">Sắp hết hạn ⚠</TabsTrigger>
             </TabsList>
           </Tabs>
        </div>

        {/* COLLECTIONS SECTION */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FolderPlus size={18} className="text-primary" />
                Bộ tài liệu
                <Badge variant="outline" className="ml-1 text-[10px] bg-white/5 border-white/10">
                  {collectionsData?.data?.length || 0}/10
                </Badge>
              </h2>
            </div>
            {collectionsData?.data && collectionsData.data.length > 0 && (
              <Button variant="link" onClick={() => setIsCreateModalOpen(true)} className="text-primary text-xs h-auto p-0 flex items-center gap-1 group">
                Tạo bộ mới <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </div>

          {!collectionsData?.data || collectionsData.data.length === 0 ? (
            <div 
              onClick={() => setIsCreateModalOpen(true)}
              className="glass-card border-dashed border-white/5 hover:border-primary/50 transition-all p-6 flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <FolderPlus size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">Gom nhóm tài liệu để chat tổng hợp</p>
                <p className="text-xs text-white/30 mt-1">Học theo khóa học, buổi học hoặc chủ đề ôn thi.</p>
              </div>
              <Button variant="outline" size="sm" className="mt-2 border-white/10 text-white/60 group-hover:border-primary/50 group-hover:text-primary transition-all">
                Tạo bộ đầu tiên &rarr;
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {collectionsData.data.map((col: any) => (
                  <CollectionCard 
                    key={col.id} 
                    collection={col}
                    viewMode="grid"
                    onDelete={async (id) => {
                      try {
                        await fetchApi(`/collections/${id}`, { method: 'DELETE' });
                        toast.success("Đã xóa bộ tài liệu");
                        mutateCollections();
                      } catch (e) {
                        toast.error("Không thể xóa bộ tài liệu");
                      }
                    }}
                    onEdit={(id) => {
                      const col = collectionsData.data.find((c: any) => c.id === id);
                      setSelectedCollection(col);
                      setIsCreateModalOpen(true);
                    }}
                    onAddDoc={(id) => {
                      const col = collectionsData.data.find((c: any) => c.id === id);
                      setSelectedCollection(col);
                      setIsCreateModalOpen(true);
                    }}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="bg-white/5" />
            </ScrollArea>
          ) : (
            <div className="space-y-3 mb-8">
               {collectionsData.data.map((col: any) => (
                  <CollectionCard 
                    key={col.id} 
                    collection={col}
                    viewMode="list"
                    onDelete={async (id) => {
                      try {
                        await fetchApi(`/collections/${id}`, { method: 'DELETE' });
                        toast.success("Đã xóa bộ tài liệu");
                        mutateCollections();
                      } catch (e) {
                        toast.error("Không thể xóa bộ tài liệu");
                      }
                    }}
                    onEdit={(id) => {
                      const col = collectionsData.data.find((c: any) => c.id === id);
                      setSelectedCollection(col);
                      setIsCreateModalOpen(true);
                    }}
                    onAddDoc={(id) => {
                      const col = collectionsData.data.find((c: any) => c.id === id);
                      setSelectedCollection(col);
                      setIsCreateModalOpen(true);
                    }}
                  />
                ))}
            </div>
          )}
        </div>

        <Separator className="mb-10 bg-white/5" />

        <div className="mb-6">
           <h2 className="text-lg font-semibold flex items-center gap-2">
             <FileText size={18} className="text-primary" />
             Tài liệu đơn lẻ
           </h2>
        </div>

        {/* DOC GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/20">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Đang tải tài liệu...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
            <FileText className="w-12 h-12 mb-4" />
            {searchQuery ? (
              <>
                <p>Không tìm thấy tài liệu nào khớp với "{searchQuery}"</p>
                <Button onClick={() => setSearchQuery("")} variant="link" className="text-primary mt-2">Xóa tìm kiếm</Button>
              </>
            ) : (
              <>
                <p>Bạn chưa có tài liệu nào trong mục này.</p>
                <Button onClick={() => router.push('/upload')} variant="link" className="text-primary mt-2">Tải tài liệu đầu tiên</Button>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <AnimatePresence>
               {isSwitching && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 z-50 bg-background/20 backdrop-blur-[2px] rounded-2xl pointer-events-none"
                 />
               )}
            </AnimatePresence>

            <motion.div 
              animate={{ 
                opacity: isSwitching ? 0 : 1,
                filter: isSwitching ? "blur(8px)" : "blur(0px)",
                scale: isSwitching ? 0.98 : 1
              }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "flex flex-col gap-3"
              }
            >
              <AnimatePresence mode="popLayout">
                {filteredDocs.map((doc: any) => (
                  <motion.div
                    key={`${viewMode}-${doc.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 38,
                      opacity: { duration: 0.2 }
                    }}
                  >
                    <DocCard 
                      id={doc.id}
                      title={doc.title} 
                      status={doc.status}
                      chunks={doc.chunk_count} 
                      expiredAt={doc.expired_at}
                      sharedAt={doc.shared_at}
                      createdAt={doc.created_at}
                      pinned={doc.pinned}
                      isPublic={doc.is_public}
                      viewMode={viewMode}
                      onMutate={() => mutate("/documents")}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        <CreateCollectionModal 
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) setSelectedCollection(null);
          } }
          collection={selectedCollection}
          onSuccess={() => mutateCollections()}
        />

        <ImportLinkDialog 
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
        />
      </main>
    </div>
  );
}

function DocCard({ 
  id,
  title, 
  status,
  chunks, 
  expiredAt, 
  sharedAt,
  createdAt,
  pinned,
  isPublic,
  viewMode,
  onMutate
}: { 
  id: string; 
  title: string; 
  status: string; 
  chunks?: number; 
  expiredAt?: string | null;
  sharedAt?: string | null;
  createdAt?: string | null;
  pinned?: boolean;
  isPublic?: boolean;
  viewMode: "grid" | "list";
  onMutate: () => void;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const confirm = useConfirmStore((state) => state.confirm);
  const user = useAuthStore((state) => state.user);
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
  
  const isReady = status === 'ready';
  const isProcessing = status === 'processing' || status === 'queued';
  const isError = status === 'error';

  const timeLeft = formatTimeLeft(expiredAt);
  const interactionTime = formatTimeAgo(sharedAt || expiredAt); // Nếu chưa share thì dùng ngày tạo/hết hạn làm mốc
  
  const isExpired = timeLeft === "Đã hết hạn";
  const isExpiring = !isExpired && timeLeft !== "Vĩnh viễn" && !timeLeft.includes("ngày");

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinning) return;
    setIsPinning(true);
    try {
      await fetchApi(`/documents/${id}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !pinned })
      });
      toast.success(pinned ? "Đã bỏ ghim tài liệu" : "Đã ghim tài liệu thành công");
      onMutate();
      mutate("/auth/me");
    } catch (error: any) {
      if (error.data?.error === 'PIN_QUOTA_EXCEEDED') {
        toast.error("Vượt quá giới hạn!", {
          description: `Bạn chỉ được ghim tối đa ${user?.quota?.maxPins || 3} tài liệu. Hãy bỏ ghim tài liệu cũ.`
        });
      } else {
        toast.error("Không thể thực hiện ghim tài liệu");
      }
    } finally {
      setIsPinning(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    confirm({
      title: "Xóa tài liệu",
      message: "Bạn có chắc chắn muốn xóa tài liệu này và toàn bộ lịch sử chat liên quan? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa ngay",
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await fetchApi(`/documents/${id}`, { method: 'DELETE' });
          toast.success("Đã xóa tài liệu khỏi thư viện");
          onMutate();
          mutate("/auth/me");
        } catch (error: any) {
          toast.error("Không thể xóa tài liệu");
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const ShareButton = ({ size = 14, className }: { size?: number; className?: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); setShowShareDialog(true); }}
      className={cn(
        "p-1.5 rounded-md transition-all",
        isPublic
          ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
          : "text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10",
        className
      )}
      title={isPublic ? "Đang chia sẻ – Nhấn để rút" : "Chia sẻ vào cộng đồng"}
    >
      {isPublic ? <Globe size={size} /> : <GlobeLock size={size} />}
    </button>
  );

  if (viewMode === 'list') {
    return (
      <>
        <div 
          onClick={() => isReady && !isExpired && router.push(`/doc/${id}/chat`)}
          className={cn(
            "glass-card p-3 group flex items-center gap-4 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden",
            isExpired && "opacity-60 grayscale-[0.5] cursor-not-allowed border-red-500/20"
          )}
        >
          <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:bg-primary/20 transition-colors">
            <FileText size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm md:text-base text-white/90 truncate mb-1 pr-4">
              {title}
            </h3>
            <div className="flex flex-col gap-1.5 mt-1">
               <div className="flex items-center gap-1.5 flex-wrap">
                  {isReady && !isExpired && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20">Sẵn sàng</span>}
                  {isReady && isExpired && <span className="bg-red-500/10 text-red-500 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-red-500/20">Hết hạn</span>}
                  {isProcessing && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>Đang xử lý</span>}
                  {isError && <span className="bg-red-500/10 text-red-500 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-red-500/20">Lỗi trích xuất</span>}
                  {isPublic && <span className="text-emerald-400 text-[9px] flex items-center gap-1 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10"><Globe size={10} /> Công khai</span>}
                  {pinned && <span className="text-amber-500 text-[9px] flex items-center gap-1 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">⭐ Ghim</span>}
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[9px] font-medium text-white/30 hidden sm:inline">{chunks ? `${chunks} chunks` : '--'}</span>
                 <span className={cn("text-[9px] font-medium text-white/40", isExpiring && "text-red-400")}>⏱ {timeLeft}</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-1.5 shrink-0 ml-auto md:pr-1">
             {isReady && (
               <>
                 <Button 
                   size="sm"
                   variant="ghost" 
                   disabled={isExpired}
                   onClick={(e) => { e.stopPropagation(); if (!isExpired) router.push(`/doc/${id}/summary`); }} 
                   className="h-8 w-8 md:w-auto md:px-3 p-0 text-white/40 hover:text-white hover:bg-white/5 flex items-center gap-2"
                   title={isExpired ? "Đã hết hạn" : "Tóm tắt"}
                 >
                   <List size={16} />
                   <span className="hidden md:inline text-xs">Tóm tắt</span>
                 </Button>
                 <Button 
                    size="sm"
                    disabled={isExpired}
                    onClick={(e) => { e.stopPropagation(); if (!isExpired) router.push(`/doc/${id}/chat`); }} 
                    className={cn(
                      "h-8 px-2 md:px-4 border text-[10px] md:text-xs font-bold transition-all",
                      isExpired 
                        ? "bg-white/5 text-white/20 border-white/5" 
                        : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    )}
                 >
                   {isExpired ? "Hết hạn" : "Chat"}
                 </Button>
               </>
             )}
             <Separator orientation="vertical" className="hidden md:block h-6 bg-white/5 mx-1" />
             <div className="hidden md:flex items-center gap-1">
               <ShareButton size={14} className="relative z-40" />
               <button 
                  onClick={handleTogglePin}
                  disabled={isPinning}
                  className={`p-1.5 rounded-md transition-all ${pinned ? 'text-amber-500 bg-amber-500/10' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
                >
                  {isPinning ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill={pinned ? "currentColor" : "none"} />}
                </button>
             </div>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-white/20 hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-all"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
          </div>
        </div>

        <CommunityShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          docId={id}
          docTitle={title}
          isPublic={!!isPublic}
          onSuccess={onMutate}
        />
      </>
    );
  }

  // Grid view
  return (
    <>
      <div className="glass-card p-5 group flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:bg-primary/10 transition-colors">
              <FileText size={20} />
            </div>
            <div 
              className={cn(
                "flex items-center gap-1 relative z-50 transition-all duration-200",
                "p-1.5 -m-1.5 rounded-bl-xl bg-transparent hover:bg-black/40 backdrop-blur-sm",
                "opacity-100 group-hover:opacity-40 hover:opacity-100"
              )}
              onMouseEnter={() => setIsIconHovered(true)}
              onMouseLeave={() => setIsIconHovered(false)}
            >
              <ShareButton size={16} />
              <button 
                onClick={handleTogglePin}
                disabled={isPinning}
                className={`p-1.5 rounded-md transition-all ${pinned ? 'text-amber-500 bg-amber-500/10' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
              >
                {isPinning ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} fill={pinned ? "currentColor" : "none"} />}
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className={cn(
                  "text-white/20 hover:text-red-500 p-1.5 rounded-md transition-all",
                  "group-hover:opacity-100",
                  isReady ? "opacity-0" : "opacity-100" // Nếu ko ready (đang lỗi/xử lý) thì hiện luôn để xóa
                )}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
          
          <h3 className="font-semibold text-white/90 line-clamp-2 leading-snug mb-3">
            {title}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {isReady && !isExpired && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">Sẵn sàng</span>}
            {isReady && isExpired && <span className="bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/20">Đã hết hạn</span>}
            {isProcessing && <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>Đang xử lý</span>}
            {isError && <span className="bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/20">Lỗi trích xuất</span>}
            {pinned && <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/20">⭐ Đã ghim</span>}
            {isPublic && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"><Globe size={9} /> Công khai</span>}
          </div>
        </div>

        {/* Action Buttons for Mobile (Grid View) */}
        <div className="md:hidden flex gap-2 mt-4 pt-4 border-t border-white/5">
           <Button 
              size="sm"
              disabled={isExpired}
              onClick={(e) => { e.stopPropagation(); if (!isExpired) router.push(`/doc/${id}/chat`); }}
              className="flex-1 bg-white text-black font-bold h-9 text-xs"
           >
             Vào Chat
           </Button>
           <Button 
              size="sm"
              variant="outline"
              disabled={isExpired}
              onClick={(e) => { e.stopPropagation(); if (!isExpired) router.push(`/doc/${id}/summary`); }}
              className="flex-1 bg-white/10 border-white/10 text-white h-9 text-xs"
           >
             Tóm tắt
           </Button>
        </div>
        
        <div className="mt-4 md:mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/30 italic">
           <div className="flex flex-col gap-0.5">
              <span>{chunks ? `${chunks} chunks` : '--'}</span>
              <span>{sharedAt ? `Chia sẻ: ${formatTimeAgo(sharedAt)}` : `Tạo: ${formatTimeAgo(createdAt || "")}`}</span>
           </div>
           <div className="flex flex-col items-end gap-0.5">
             <span className={isExpiring ? 'text-red-400 flex items-center gap-1 font-medium' : ''}>
               {isExpiring && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>}
               ⏱ {timeLeft}
             </span>
             <span className="opacity-50 NOT-ITALIC">{interactionTime.includes("trước") ? interactionTime : ""}</span>
           </div>
        </div>

        <div className={cn(
          "absolute inset-0 bg-black/80 backdrop-blur-[3px] transition-all duration-300 z-30 pointer-events-none hidden md:block",
          (isReady && !isIconHovered) ? "opacity-0 group-hover:opacity-100" : "opacity-0"
        )}>
          <div className="flex flex-col items-center justify-center gap-3 p-6 h-full"> 
             {isReady && (
               <div className="w-full flex flex-col gap-3 pointer-events-auto">
                 <Button 
                   disabled={isExpired}
                   onClick={(e) => { e.stopPropagation(); if (!isExpired) router.push(`/doc/${id}/chat`); }} 
                   className={cn(
                     "w-full border-none h-10 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all",
                     isExpired ? "bg-white/5 text-white/20" : "bg-white text-black"
                   )}
                 >
                   {isExpired ? "Tài liệu đã hết hạn" : "Vào Chat ngay"}
                 </Button>
                 <Button 
                   disabled={isExpired}
                   onClick={(e) => { e.stopPropagation(); if (!isExpired) router.push(`/doc/${id}/summary`); }} 
                   variant="outline" 
                   className="w-full h-10 bg-white/10 border-white/20 hover:bg-white/20 text-white font-medium backdrop-blur-md hover:scale-105 transition-transform disabled:opacity-50"
                 >
                   Tóm tắt tài liệu
                 </Button>
                 <Button
                   disabled={isExpired}
                   onClick={(e) => { e.stopPropagation(); if (!isExpired) setShowShareDialog(true); }}
                   variant="outline"
                   className={cn(
                     "w-full h-10 font-medium backdrop-blur-md hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50",
                     isPublic
                       ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                       : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                   )}
                 >
                   {isPublic ? <Globe size={14} /> : <GlobeLock size={14} />}
                   {isPublic ? "Đang chia sẻ cộng đồng" : "Chia sẻ vào cộng đồng"}
                 </Button>
               </div>
             )}
             {isProcessing && (
                <div className="w-full pointer-events-auto">
                  <Button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/upload?docId=${id}`); }} 
                    className="w-full h-10 bg-amber-500 text-black hover:bg-amber-400 font-bold"
                  >
                    Theo dõi tiến độ
                  </Button>
                </div>
             )}
          </div>
        </div>
      </div>

      <CommunityShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        docId={id}
        docTitle={title}
        isPublic={!!isPublic}
        onSuccess={onMutate}
      />
    </>
  );
}
