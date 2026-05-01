"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { fetchApi, fetcher } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, FolderPlus, FileText, Star, Edit3, Plus } from "lucide-react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const EMOJIS = ["📚", "📖", "📝", "📐", "⚖️", "🔬", "📊", "💻", "🏥", "🎓", "📁", "📂", "📓", "📕", "📙"];

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  collection?: any;
  defaultDocId?: string;
}

export function CreateCollectionModal({ open, onOpenChange, onSuccess, collection, defaultDocId }: CreateCollectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const isEdit = !!collection;

  useEffect(() => {
    if (open) {
      if (collection) {
        setName(collection.name || "");
        setDescription(collection.description || "");
        setEmoji(collection.emoji || "📚");
        setSelectedDocs(collection.documents?.map((d: any) => d.id) || []);
      } else {
        setName("");
        setDescription("");
        setEmoji("📚");
        setSelectedDocs(defaultDocId ? [defaultDocId] : []);
      }
    }
  }, [open, collection, defaultDocId]);

  const { data: docsData } = useSWR<any>("/documents", fetcher);
  const readyDocs = docsData?.success ? docsData.data.filter((d: any) => d.status === "ready") : [];

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên bộ tài liệu");
      return;
    }
    if (selectedDocs.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 tài liệu");
      return;
    }

    setIsLoading(true);
    try {
      const url = isEdit ? `/collections/${collection.id}` : "/collections";
      const method = isEdit ? "PATCH" : "POST";

      const res: any = await fetchApi(url, {
        method,
        body: JSON.stringify({
          name,
          description,
          emoji,
          document_ids: selectedDocs,
        }),
      });

      if (res.success) {
        toast.success(isEdit ? "Đã cập nhật bộ tài liệu!" : "Đã tạo bộ tài liệu thành công!");
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 5) {
        toast.warning("Tối đa 5 tài liệu một bộ");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col overflow-hidden border-border bg-card p-0 text-card-foreground shadow-2xl backdrop-blur-xl md:w-full md:max-w-[650px]">
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="flex max-h-[95vh] flex-col">
              <div className="border-b border-border/70 bg-muted/30 p-5 md:p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2.5 text-lg font-black tracking-tight">
                    {isEdit ? <Edit3 className="text-primary" size={20} /> : <FolderPlus className="text-primary" size={20} />}
                    {isEdit ? "Cập nhật bộ" : "Tạo bộ mới"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {isEdit ? "Thay đổi nội dung hoặc danh sách file trong bộ tài liệu." : "Gom nhóm tài liệu để chat tổng hợp hiệu quả hơn."}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-5 md:px-6">
                <div className="space-y-5 py-5 md:space-y-6">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground md:text-xs">Emoji</label>
                      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/30 p-2">
                        {EMOJIS.slice(0, 9).map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setEmoji(e)}
                            className={cn("flex h-10 items-center justify-center rounded-lg text-xl transition-all", emoji === e ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent")}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-9 space-y-1.5 md:col-span-10">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground md:text-xs">Tên bộ tri thức</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Kinh tế vĩ mô..." className="h-10 border-border bg-background text-sm font-bold md:h-11" maxLength={100} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground md:text-xs">Mô tả mục tiêu</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ghi chú ngắn về bộ tài liệu này..."
                      className="h-20 resize-none border-border bg-background py-3 text-sm md:h-24"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground md:text-xs">Gắn kết tri thức</label>
                        <Badge className="h-fit border-primary/20 bg-primary/10 px-1.5 text-[9px] font-black text-primary">{selectedDocs.length}/5</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 pb-4">
                      {readyDocs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">Chưa có tài liệu sẵn sàng.</div>
                      ) : (
                        readyDocs.map((doc: any) => (
                          <div
                            key={doc.id}
                            onClick={() => toggleDoc(doc.id)}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all",
                              selectedDocs.includes(doc.id) ? "border-primary/30 bg-primary/5" : "border-border bg-card/80 hover:bg-accent/30"
                            )}
                          >
                            <Checkbox checked={selectedDocs.includes(doc.id)} className="pointer-events-none h-4 w-4 rounded-md border-border data-[state=checked]:bg-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-foreground">{doc.title}</p>
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText size={10} /> {doc.chunk_count} P
                                </span>
                                {doc.pinned && (
                                  <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                    <Star size={10} fill="currentColor" /> GHIM
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-4 border-t border-border/70 bg-muted/30 p-5 md:p-6">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 flex-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-foreground md:flex-none" disabled={isLoading}>
                  Hủy bỏ
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading || !name.trim() || selectedDocs.length === 0} className="h-11 flex-[2] text-xs font-black uppercase tracking-wider md:flex-none md:px-12">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>{isEdit ? "Cập nhật ngay" : "Tạo bộ ngay"}</>}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
