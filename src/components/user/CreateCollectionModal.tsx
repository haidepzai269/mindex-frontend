import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, FolderPlus, FileText, Star, Edit3 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["📚", "📖", "📝", "📐", "⚖️", "🔬", "📊", "💻", "🏥", "🎓", "📁", "📂", "📓", "📕", "📙"];

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  collection?: any; // Dữ liệu khi ở chế độ Edit
  defaultDocId?: string; // Tài liệu được chọn mặc định khi tạo mới
}

export function CreateCollectionModal({ open, onOpenChange, onSuccess, collection, defaultDocId }: CreateCollectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const isEdit = !!collection;

  // Khởi tạo dữ liệu khi mở ở chế độ Edit
  useEffect(() => {
    if (open) {
      if (collection) {
        setName(collection.name || "");
        setDescription(collection.description || "");
        setEmoji(collection.emoji || "📚");
        setSelectedDocs(collection.documents?.map((d: any) => d.id) || []);
      } else {
        // Reset khi là tạo mới
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
    setSelectedDocs(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 5) {
        toast.warning("Tối đa 5 tài liệu một bộ");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:w-full md:max-w-[650px] max-h-[95vh] bg-zinc-950/90 border border-white/10 text-white shadow-2xl backdrop-blur-3xl p-0 overflow-hidden outline-none flex flex-col">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="flex flex-col h-full max-h-[95vh]"
            >
              {/* FIXED HEADER */}
              <div className="p-5 md:p-6 border-b border-white/5 bg-white/[0.02]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2.5 text-lg md:text-xl font-black uppercase tracking-tight">
                    {isEdit ? <Edit3 className="text-primary" size={20} /> : <FolderPlus className="text-primary" size={20} />}
                    {isEdit ? "Cập nhật bộ" : "Tạo bộ mới"}
                  </DialogTitle>
                  <DialogDescription className="text-white/40 text-[11px] md:text-xs">
                    {isEdit ? "Thay đổi nội dung hoặc danh sách file trong bộ tài liệu." : "Gom nhóm tài liệu để chat tổng hợp hiệu quả hơn."}
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* SCROLLABLE FORM AREA */}
              <div className="flex-1 overflow-y-auto px-5 md:px-6 custom-scrollbar">
                <div className="py-5 space-y-5 md:space-y-6">
                  {/* Row 1: Emoji + Name (Side by side even on mobile) */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 md:col-span-2 space-y-1.5">
                      <label className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-wider">Emoji</label>
                      <div className="relative group">
                        <button 
                          className="w-full h-10 md:h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl md:text-2xl hover:bg-white/10 transition-all font-sans"
                        >
                          {emoji}
                        </button>
                        <div className="absolute top-full left-0 mt-2 p-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 hidden group-focus-within:grid grid-cols-5 gap-1 w-[180px]">
                           {EMOJIS.map(e => (
                             <button key={e} onClick={() => setEmoji(e)} className="p-1 hover:bg-white/10 rounded-md transition-colors">{e}</button>
                           ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-9 md:col-span-10 space-y-1.5">
                      <label className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-wider">Tên bộ tri thức</label>
                      <Input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="VD: Kinh tế vĩ mô..."
                        className="glass-input h-10 md:h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-sm font-bold"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-wider">Mô tả mục tiêu</label>
                    <Textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ghi chú ngắn về bộ tài liệu này..."
                      className="glass-input bg-white/5 border-white/10 h-20 md:h-24 resize-none focus:border-primary/50 transition-colors text-sm py-3"
                    />
                  </div>

                  {/* Document Selection */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-wider">Gắn kết tri thức</label>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black h-fit px-1.5">
                          {selectedDocs.length}/5
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {readyDocs.length === 0 ? (
                        <div className="py-8 text-center text-white/20 text-xs border border-dashed border-white/10 rounded-2xl">
                          Chưa có tài liệu sẵn sàng.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 pb-4">
                          {readyDocs.map((doc: any) => (
                            <div 
                              key={doc.id}
                              onClick={() => toggleDoc(doc.id)}
                              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${selectedDocs.includes(doc.id) ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                            >
                              <Checkbox 
                                checked={selectedDocs.includes(doc.id)} 
                                // Bỏ onCheckedChange để tránh xung đột với onClick của parent
                                className="w-4 h-4 rounded-md border-white/20 data-[state=checked]:bg-primary pointer-events-none"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-bold text-zinc-300 truncate">{doc.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
                                   <span className="flex items-center gap-1"><FileText size={10} /> {doc.chunk_count} P</span>
                                   {doc.pinned && <span className="text-amber-600 flex items-center gap-0.5"><Star size={10} fill="currentColor" /> GHIM</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FIXED FOOTER */}
              <div className="p-5 md:p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 md:flex-none text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl h-11 text-xs font-bold uppercase tracking-wider"
                  disabled={isLoading}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !name.trim() || selectedDocs.length === 0}
                  className="flex-[2] md:flex-none md:px-12 bg-white text-black hover:bg-zinc-200 rounded-xl h-11 text-xs font-black uppercase tracking-wider shadow-xl transition-all active:scale-95 disabled:opacity-30"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>{isEdit ? "Cập nhật ngay" : "Tạo bộ ngay"}</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
