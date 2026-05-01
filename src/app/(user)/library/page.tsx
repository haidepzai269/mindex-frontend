"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Grid,
  List,
  Plus,
  FileText,
  Loader2,
  Star,
  Trash2,
  Globe,
  GlobeLock,
  Users,
  FolderPlus,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
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
import { ImportLinkDialog } from "@/components/user/ImportLinkDialog";
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

  const { data, isLoading } = useSWR<ApiResponse>("/documents", fetcher as any);
  const { data: collectionsData, mutate: mutateCollections } = useSWR<ApiResponse>("/collections", fetcher as any);

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
        (activeTab === "expiring" &&
          doc.expired_at &&
          new Date(doc.expired_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000);

      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [docs, activeTab, searchQuery]);

  return (
    <div className="relative z-0 flex h-full flex-1 flex-col bg-background">
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px] dark:bg-primary/5" />

      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-md md:h-16 md:px-8">
        <div className="relative max-w-xl flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            className="h-9 border-border bg-card/80 pl-9 text-sm md:h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ml-3 flex items-center gap-2 md:ml-4 md:gap-4">
          <Link
            href="/rooms"
            className="rounded-xl border border-border bg-card/80 p-2 text-muted-foreground transition-all hover:border-primary/20 hover:bg-accent hover:text-foreground"
            title="Phòng học nhóm"
          >
            <Users size={20} />
          </Link>

          <div className="hidden items-center rounded-lg border border-border bg-card/80 p-1 md:flex">
            <button
              onClick={() => handleUpdateViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-all",
                viewMode === "grid"
                  ? "border border-primary/15 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title="Dạng lưới"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => handleUpdateViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-all",
                viewMode === "list"
                  ? "border border-primary/15 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title="Dạng danh sách"
            >
              <List size={16} />
            </button>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="h-10 gap-2 border-border bg-card/80 text-foreground hover:bg-accent">
              <FolderPlus size={16} />
              <span>Bộ tài liệu mới</span>
            </Button>

            <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="h-10 gap-2 border-border bg-card/80 text-foreground hover:bg-accent">
              <LinkIcon size={16} />
              <span>Sử dụng Link Share</span>
            </Button>

            <Button onClick={() => router.push("/upload")} className="h-10 px-4 font-bold">
              <Plus size={16} />
              <span>Upload tài liệu</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32 md:p-8 md:pb-8">
        <div className="mb-4 flex flex-col justify-between gap-4 md:mb-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Thư viện cá nhân</h1>
            <p className="mt-1 hidden text-xs text-muted-foreground md:block">
              Quản lý và trò chuyện với các tài liệu học tập của bạn.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="-mx-4 w-full overflow-x-auto px-4 md:mx-0 md:w-auto md:px-0">
            <TabsList className="flex w-max border border-border bg-card/80 p-1 md:w-auto">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Tất cả
              </TabsTrigger>
              <TabsTrigger value="pinned" className="text-xs data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400">
                Đã ghim
              </TabsTrigger>
              <TabsTrigger value="public" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400">
                Công khai
              </TabsTrigger>
              <TabsTrigger value="expiring" className="text-xs data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400">
                Sắp hết hạn
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <FolderPlus size={18} className="text-primary" />
                Bộ tài liệu
                <Badge variant="outline" className="ml-1 border-border bg-card/80 text-[10px] text-foreground">
                  {collectionsData?.data?.length || 0}/10
                </Badge>
              </h2>
            </div>
            {collectionsData?.data && collectionsData.data.length > 0 && (
              <Button variant="link" onClick={() => setIsCreateModalOpen(true)} className="group h-auto gap-1 p-0 text-xs text-primary">
                Tạo bộ mới <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            )}
          </div>

          {!collectionsData?.data || collectionsData.data.length === 0 ? (
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer rounded-2xl border border-dashed border-border bg-card/70 p-6 transition-all hover:border-primary/40 hover:bg-accent/30"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all">
                  <FolderPlus size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Gom nhóm tài liệu để chat tổng hợp</p>
                  <p className="mt-1 text-xs text-muted-foreground">Học theo khóa học, buổi học hoặc chủ đề ôn thi.</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 border-border bg-background text-foreground hover:bg-accent">
                  Tạo bộ đầu tiên
                </Button>
              </div>
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
                        await fetchApi(`/collections/${id}`, { method: "DELETE" });
                        toast.success("Đã xóa bộ tài liệu");
                        mutateCollections();
                      } catch {
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
              <ScrollBar orientation="horizontal" className="bg-border/70" />
            </ScrollArea>
          ) : (
            <div className="mb-8 space-y-3">
              {collectionsData.data.map((col: any) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  viewMode="list"
                  onDelete={async (id) => {
                    try {
                      await fetchApi(`/collections/${id}`, { method: "DELETE" });
                      toast.success("Đã xóa bộ tài liệu");
                      mutateCollections();
                    } catch {
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

        <Separator className="mb-10 bg-border/70" />

        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText size={18} className="text-primary" />
            Tài liệu đơn lẻ
          </h2>
        </div>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="mb-4 h-10 w-10 animate-spin" />
            <p>Đang tải tài liệu...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/60 text-muted-foreground">
            <FileText className="mb-4 h-12 w-12" />
            {searchQuery ? (
              <>
                <p>Không tìm thấy tài liệu nào khớp với "{searchQuery}"</p>
                <Button onClick={() => setSearchQuery("")} variant="link" className="mt-2 text-primary">
                  Xóa tìm kiếm
                </Button>
              </>
            ) : (
              <>
                <p>Bạn chưa có tài liệu nào trong mục này.</p>
                <Button onClick={() => router.push("/upload")} variant="link" className="mt-2 text-primary">
                  Tải tài liệu đầu tiên
                </Button>
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
                  className="pointer-events-none absolute inset-0 z-50 rounded-2xl bg-background/20 backdrop-blur-[2px]"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                opacity: isSwitching ? 0 : 1,
                filter: isSwitching ? "blur(8px)" : "blur(0px)",
                scale: isSwitching ? 0.98 : 1,
              }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className={viewMode === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3"}
            >
              <AnimatePresence mode="popLayout">
                {filteredDocs.map((doc: any) => (
                  <motion.div
                    key={`${viewMode}-${doc.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 38, opacity: { duration: 0.2 } }}
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
          }}
          collection={selectedCollection}
          onSuccess={() => mutateCollections()}
        />

        <ImportLinkDialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen} />
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
  onMutate,
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

  const isReady = status === "ready";
  const isProcessing = status === "processing" || status === "queued";
  const isError = status === "error";

  const timeLeft = formatTimeLeft(expiredAt);
  const interactionTime = formatTimeAgo(sharedAt || expiredAt);

  const isExpired = timeLeft === "Đã hết hạn";
  const isExpiring = !isExpired && timeLeft !== "Vĩnh viễn" && !timeLeft.includes("ngày");

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinning) return;
    setIsPinning(true);
    try {
      await fetchApi(`/documents/${id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !pinned }),
      });
      toast.success(pinned ? "Đã bỏ ghim tài liệu" : "Đã ghim tài liệu thành công");
      onMutate();
      mutate("/auth/me");
    } catch (error: any) {
      if (error.data?.error === "PIN_QUOTA_EXCEEDED") {
        toast.error("Vượt quá giới hạn!", {
          description: `Bạn chỉ được ghim tối đa ${user?.quota?.maxPins || 3} tài liệu. Hãy bỏ ghim tài liệu cũ.`,
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
          await fetchApi(`/documents/${id}`, { method: "DELETE" });
          toast.success("Đã xóa tài liệu khỏi thư viện");
          onMutate();
          mutate("/auth/me");
        } catch {
          toast.error("Không thể xóa tài liệu");
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const ShareButton = ({ size = 14, className }: { size?: number; className?: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setShowShareDialog(true);
      }}
      className={cn(
        "rounded-md p-1.5 transition-all",
        isPublic
          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
          : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
        className
      )}
      title={isPublic ? "Đang chia sẻ - Nhấn để rút" : "Chia sẻ vào cộng đồng"}
    >
      {isPublic ? <Globe size={size} /> : <GlobeLock size={size} />}
    </button>
  );

  if (viewMode === "list") {
    return (
      <>
        <div
          onClick={() => isReady && !isExpired && router.push(`/doc/${id}/chat`)}
          className={cn(
            "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card/90 p-3 transition-all hover:border-primary/30 hover:bg-accent/30",
            isExpired && "cursor-not-allowed border-rose-500/20 opacity-70"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary transition-colors group-hover:bg-primary/10">
            <FileText size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate pr-4 text-sm font-bold text-foreground md:text-base">{title}</h3>
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {isReady && !isExpired && <StateBadge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Sẵn sàng</StateBadge>}
                {isReady && isExpired && <StateBadge className="border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">Hết hạn</StateBadge>}
                {isProcessing && <StateBadge className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">Đang xử lý</StateBadge>}
                {isError && <StateBadge className="border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">Lỗi trích xuất</StateBadge>}
                {isPublic && <StateBadge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Globe size={10} /> Công khai</StateBadge>}
                {pinned && <StateBadge className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">★ Ghim</StateBadge>}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline">{chunks ? `${chunks} chunks` : "--"}</span>
                <span className={cn("text-[10px] font-medium text-muted-foreground", isExpiring && "text-rose-600 dark:text-rose-400")}>⏱ {timeLeft}</span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-1.5 md:pr-1">
            {isReady && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isExpired}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpired) router.push(`/doc/${id}/summary`);
                  }}
                  className="flex h-8 w-8 items-center gap-2 p-0 text-muted-foreground hover:bg-accent hover:text-foreground md:w-auto md:px-3"
                  title={isExpired ? "Đã hết hạn" : "Tóm tắt"}
                >
                  <List size={16} />
                  <span className="hidden text-xs md:inline">Tóm tắt</span>
                </Button>
                <Button
                  size="sm"
                  disabled={isExpired}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpired) router.push(`/doc/${id}/chat`);
                  }}
                  className={cn(
                    "h-8 border px-2 text-[10px] font-bold transition-all md:px-4 md:text-xs",
                    isExpired
                      ? "border-border bg-muted text-muted-foreground"
                      : "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {isExpired ? "Hết hạn" : "Chat"}
                </Button>
              </>
            )}
            <Separator orientation="vertical" className="mx-1 hidden h-6 bg-border/70 md:block" />
            <div className="hidden items-center gap-1 md:flex">
              <ShareButton size={14} className="relative z-40" />
              <button
                onClick={handleTogglePin}
                disabled={isPinning}
                className={cn(
                  "rounded-md p-1.5 transition-all",
                  pinned
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {isPinning ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill={pinned ? "currentColor" : "none"} />}
              </button>
            </div>
            <button onClick={handleDelete} disabled={isDeleting} className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400">
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>

        <CommunityShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} docId={id} docTitle={title} isPublic={!!isPublic} onSuccess={onMutate} />
      </>
    );
  }

  return (
    <>
      <div className="group relative flex min-h-[330px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/95 p-5 shadow-sm transition-all hover:border-primary/30 hover:bg-card">
        <div>
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-primary transition-colors group-hover:bg-primary/10">
              <FileText size={20} />
            </div>
            <div
              className={cn(
                "relative z-50 flex items-center gap-1 rounded-bl-xl p-1.5 transition-all duration-200 backdrop-blur-sm",
                "bg-background/0 hover:bg-background/90 dark:hover:bg-black/40",
                "opacity-100 group-hover:opacity-70 hover:opacity-100"
              )}
              onMouseEnter={() => setIsIconHovered(true)}
              onMouseLeave={() => setIsIconHovered(false)}
            >
              <ShareButton size={16} />
              <button
                onClick={handleTogglePin}
                disabled={isPinning}
                className={cn(
                  "rounded-md p-1.5 transition-all",
                  pinned
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {isPinning ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} fill={pinned ? "currentColor" : "none"} />}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={cn(
                  "rounded-md p-1.5 text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
                  isReady ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                )}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>

          <h3 className="mb-3 line-clamp-2 font-semibold leading-snug text-foreground">{title}</h3>

          <div className="mb-4 flex flex-wrap gap-2">
            {isReady && !isExpired && <StateBadge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Sẵn sàng</StateBadge>}
            {isReady && isExpired && <StateBadge className="border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">Đã hết hạn</StateBadge>}
            {isProcessing && <StateBadge className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">Đang xử lý</StateBadge>}
            {isError && <StateBadge className="border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">Lỗi trích xuất</StateBadge>}
            {pinned && <StateBadge className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">★ Đã ghim</StateBadge>}
            {isPublic && <StateBadge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Globe size={9} /> Công khai</StateBadge>}
          </div>
        </div>

        <div className="mt-4 flex gap-2 border-t border-border/70 pt-4 md:hidden">
          <Button
            size="sm"
            disabled={isExpired}
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpired) router.push(`/doc/${id}/chat`);
            }}
            className="h-9 flex-1 text-xs font-bold"
          >
            Vào Chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isExpired}
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpired) router.push(`/doc/${id}/summary`);
            }}
            className="h-9 flex-1 border-border bg-background text-foreground hover:bg-accent"
          >
            Tóm tắt
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-[10px] italic text-muted-foreground">
          <div className="flex flex-col gap-0.5">
            <span>{chunks ? `${chunks} chunks` : "--"}</span>
            <span>{sharedAt ? `Chia sẻ: ${formatTimeAgo(sharedAt)}` : `Tạo: ${formatTimeAgo(createdAt || "")}`}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className={cn("font-medium not-italic", isExpiring && "flex items-center gap-1 text-rose-600 dark:text-rose-400")}>
              {isExpiring && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
              ⏱ {timeLeft}
            </span>
            <span className="opacity-70 not-italic">{interactionTime.includes("trước") ? interactionTime : ""}</span>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-0 z-30 hidden transition-all duration-300 md:block",
            "bg-background/88 backdrop-blur-[3px] dark:bg-black/80",
            isReady && !isIconHovered ? "opacity-0 group-hover:opacity-100" : "opacity-0"
          )}
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
            {isReady && (
              <div className="flex w-full flex-col gap-3">
                <Button
                  disabled={isExpired}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpired) router.push(`/doc/${id}/chat`);
                  }}
                  className={cn("h-10 w-full font-bold transition-all hover:scale-[1.02]", isExpired ? "bg-muted text-muted-foreground" : "")}
                >
                  {isExpired ? "Tài liệu đã hết hạn" : "Vào Chat ngay"}
                </Button>
                <Button
                  disabled={isExpired}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpired) router.push(`/doc/${id}/summary`);
                  }}
                  variant="outline"
                  className="h-10 w-full border-border bg-background text-foreground hover:bg-accent"
                >
                  Tóm tắt tài liệu
                </Button>
                <Button
                  disabled={isExpired}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpired) setShowShareDialog(true);
                  }}
                  variant="outline"
                  className={cn(
                    "flex h-10 w-full items-center gap-2 border-border bg-background text-foreground hover:bg-accent",
                    isPublic && "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400"
                  )}
                >
                  {isPublic ? <Globe size={14} /> : <GlobeLock size={14} />}
                  {isPublic ? "Đang chia sẻ cộng đồng" : "Chia sẻ vào cộng đồng"}
                </Button>
              </div>
            )}
            {isProcessing && (
              <div className="w-full">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/upload?docId=${id}`);
                  }}
                  className="h-10 w-full bg-amber-500 text-black hover:bg-amber-400"
                >
                  Theo dõi tiến độ
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CommunityShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} docId={id} docTitle={title} isPublic={!!isPublic} onSuccess={onMutate} />
    </>
  );
}

function StateBadge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", className)}>{children}</span>;
}
