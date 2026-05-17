"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Check, Loader2, Library, Clock } from "lucide-react";

interface LibraryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  alreadyLinkedIds: string[];
  myDocCount: number;
  onSuccess: (docTitle: string) => void;
}

interface Doc {
  id: string;
  title: string;
  status: string;
  chunk_count?: number;
  expired_at?: string | null;
}

export function LibraryPickerDialog({
  open,
  onOpenChange,
  roomId,
  alreadyLinkedIds,
  myDocCount,
  onSuccess,
}: LibraryPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useSWR<{ success: boolean; data: Doc[] }>(
    open ? "/documents" : null,
    fetcher as any,
    { revalidateOnFocus: false }
  );

  const docs = data?.data ?? [];
  const maxRoomDocs = 3;
  const remainingSlots = Math.max(0, maxRoomDocs - myDocCount);
  const selectedCount = selected.size;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter((d) => d.title.toLowerCase().includes(q));
  }, [docs, search]);

  const isExpired = (doc: Doc) =>
    doc.expired_at ? new Date(doc.expired_at).getTime() < Date.now() : false;

  const isSelectable = (doc: Doc) =>
    doc.status === "ready" && !isExpired(doc) && !alreadyLinkedIds.includes(doc.id);

  const toggleSelect = (id: string, doc: Doc) => {
    if (!isSelectable(doc)) return;

    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
        return next;
      }

      if (remainingSlots === 0) {
        toast.error("Bạn đã đạt giới hạn 3 tài liệu/người trong phòng");
        return prev;
      }

      if (next.size >= remainingSlots) {
        toast.error(`Bạn chỉ có thể thêm tối đa ${remainingSlots} tài liệu từ thư viện`);
        return prev;
      }

      next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0 || remainingSlots === 0) return;
    setIsSubmitting(true);

    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map(async (docId) => {
        setLinking((prev) => new Set(prev).add(docId));
        try {
          await fetchApi(`/rooms/${roomId}/docs/link`, {
            method: "POST",
            body: JSON.stringify({ document_id: docId }),
          });
          const doc = docs.find((d) => d.id === docId);
          return { docId, title: doc?.title ?? docId, ok: true };
        } catch (err: any) {
          const code = err.data?.error;
          if (code === "ALREADY_LINKED") return { docId, ok: true };
          throw err;
        } finally {
          setLinking((prev) => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          });
        }
      })
    );

    let successCount = 0;
    let lastTitle = "";

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        successCount++;
        lastTitle = result.value.title ?? "";
      } else {
        toast.error("Một số tài liệu không thể thêm vào phòng");
      }
    });

    if (successCount > 0) {
      onSuccess(successCount === 1 ? lastTitle : `${successCount} tài liệu`);
      setSelected(new Set());
      onOpenChange(false);
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSearch("");
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pr-12 pt-6 pb-4 border-b border-border/60">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Library size={18} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Chọn từ thư viện
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground">
                Thêm tài liệu có sẵn vào phòng mà không cần upload lại.
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
            />
            <Input
              placeholder="Tìm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-muted/40 pl-9 text-sm focus-visible:ring-primary/30"
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="h-[340px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary/40" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <FileText size={32} className="mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {search ? `Không tìm thấy "${search}"` : "Thư viện của bạn trống"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 py-2 pl-4 pr-8">
              {filtered.map((doc) => {
                const inRoom = alreadyLinkedIds.includes(doc.id);
                const notReady = doc.status !== "ready";
                const expired = isExpired(doc);
                const isSelected = selected.has(doc.id);
                const limitReached = !isSelected && selectedCount >= remainingSlots;
                const disabled = inRoom || notReady || expired || limitReached;
                const isLinking = linking.has(doc.id);

                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleSelect(doc.id, doc)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full min-w-0 max-w-full items-center gap-3 rounded-xl border px-3 py-3 pr-8 text-left transition-all",
                      disabled
                        ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-50"
                        : isSelected
                          ? "border-primary/30 bg-primary/10 shadow-sm"
                          : "border-border/50 bg-card hover:border-border hover:bg-accent/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all",
                        inRoom
                          ? "border-emerald-500/50 bg-emerald-500/20"
                          : isSelected
                            ? "border-primary bg-primary"
                            : "border-border"
                      )}
                    >
                      {isLinking ? (
                        <Loader2 size={11} className="animate-spin text-primary" />
                      ) : inRoom ? (
                        <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                      ) : isSelected ? (
                        <Check size={11} className="text-primary-foreground" />
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                        isSelected ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <FileText
                        size={15}
                        className={isSelected ? "text-primary" : "text-muted-foreground"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          isSelected ? "text-foreground" : "text-foreground/80"
                        )}
                      >
                        {doc.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {inRoom ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Đã trong phòng
                          </span>
                        ) : expired ? (
                          <span className="text-[10px] font-bold text-rose-500">Đã hết hạn</span>
                        ) : notReady ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                            <Clock size={9} /> Đang xử lý
                          </span>
                        ) : limitReached ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Đã đạt giới hạn
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {doc.chunk_count ? `${doc.chunk_count} chunks` : "Sẵn sàng"}
                          </span>
                        )}
                      </div>
                    </div>

                    {!inRoom && !notReady && !expired && !limitReached && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-3 mr-2 h-4 flex-shrink-0 px-1.5 text-[9px] font-black uppercase",
                          isSelected
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {isSelected ? "Đã chọn" : "READY"}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mx-0 mb-0 flex flex-row flex-wrap items-center gap-3 rounded-none border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-between">
          <span className="min-w-0 flex-1 text-[12px] text-muted-foreground">
            {remainingSlots === 0
              ? "Bạn đã đạt giới hạn 3 tài liệu/người trong phòng"
              : selectedCount > 0
                ? `Đã chọn ${selectedCount} / ${remainingSlots} tài liệu`
                : `Còn có thể thêm ${remainingSlots} / ${maxRoomDocs} tài liệu vào phòng`}
          </span>
          <div className="ml-auto flex shrink-0 gap-2 pr-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-9 text-sm"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || isSubmitting || remainingSlots === 0}
              className="h-9 gap-2 text-sm"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Library size={14} />
              )}
              {isSubmitting
                ? "Đang thêm..."
                : selectedCount > 0
                  ? `Thêm vào phòng (${selectedCount})`
                  : "Thêm vào phòng"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
