"use client";

import { useState } from "react";
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
import { Loader2, FolderPlus, FileText, Star } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

const EMOJIS = ["📚", "📖", "📝", "📐", "⚖️", "🔬", "📊", "💻", "🏥", "🎓", "📁", "📂", "📓", "📕", "📙"];

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCollectionModal({ open, onOpenChange, onSuccess }: CreateCollectionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const { data: docsData } = useSWR<any>("/documents", fetcher);
  const readyDocs = docsData?.success ? docsData.data.filter((d: any) => d.status === "ready") : [];

  const handleCreate = async () => {
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
      const res: any = await fetchApi("/collections", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          emoji,
          document_ids: selectedDocs,
        }),
      });

      if (res.success) {
        toast.success("Đã tạo bộ tài liệu thành công!");
        onSuccess?.();
        onOpenChange(false);
        // Reset state
        setName("");
        setDescription("");
        setEmoji("📚");
        setSelectedDocs([]);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo bộ tài liệu");
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
      <DialogContent className="sm:max-w-[650px] bg-zinc-950 border border-white/10 text-white shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <FolderPlus className="text-primary" size={24} />
            Tạo bộ tài liệu mới
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Gom nhóm các tài liệu liên quan để chat tổng hợp hiệu quả hơn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Emoji</label>
              <div className="grid grid-cols-5 gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                {EMOJIS.slice(0, 10).map(e => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1 rounded hover:bg-white/10 transition-colors ${emoji === e ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-white/70">Tên bộ tài liệu</label>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Ôn thi Giải tích chương 3..."
                className="glass-input h-10 bg-white/5 border-white/10"
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Mô tả (Tùy chọn)</label>
            <Textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú ngắn về bộ tài liệu này..."
              className="glass-input bg-white/5 border-white/10 min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/70">Chọn tài liệu (Tối đa 5)</label>
              <Badge variant="outline" className="text-[10px] bg-white/10 text-white border-white/20">
                {selectedDocs.length}/5 đã chọn
              </Badge>
            </div>
            
            <ScrollArea className="h-[160px] rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="space-y-1">
                {readyDocs.length === 0 ? (
                  <div className="py-8 text-center text-white/20 text-sm">
                    Chưa có tài liệu sẵn sàng trong thư viện.
                  </div>
                ) : readyDocs.map((doc: any) => (
                  <div 
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${selectedDocs.includes(doc.id) ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <Checkbox 
                      checked={selectedDocs.includes(doc.id)} 
                      onCheckedChange={() => toggleDoc(doc.id)}
                      className="border-white/30 data-[state=checked]:bg-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                         <span className="flex items-center gap-0.5"><FileText size={10} /> {doc.chunk_count} chunks</span>
                         {doc.pinned && <span className="text-amber-500 flex items-center gap-0.5"><Star size={10} fill="currentColor" /> Đã ghim</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/50 hover:text-white hover:bg-white/5"
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !name.trim() || selectedDocs.length === 0}
            className="bg-white text-black hover:bg-white/90 border-none px-6 font-bold"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <FolderPlus size={16} className="mr-2" />
            )}
            Tạo bộ tài liệu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
