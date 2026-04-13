"use client";

import { Folder, MoreVertical, MessageSquare, Trash2, Edit3, Plus, Clock, Infinity } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useEffect } from "react";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    emoji: string;
    doc_count: number;
    last_chat_at: string | null;
    expires_at?: string | null;
    documents: Array<{ title: string; status: string }>;
  };
  viewMode?: "grid" | "list";
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onAddDoc: (id: string) => void;
}

export function CollectionCard({ 
    collection, 
    viewMode = "grid", 
    onDelete, 
    onEdit, 
    onAddDoc 
}: CollectionCardProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (!collection.expires_at) {
        setTimeLeft("Vĩnh viễn");
        return;
    }

    const target = new Date(collection.expires_at).getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const diff = target - now;

        if (diff <= 0) {
            setTimeLeft("Đã hết hạn");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setIsExpiringSoon(days === 0 && hours < 1);

        if (days > 0) {
            setTimeLeft(`${days} ngày`);
        } else {
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [collection.expires_at]);

  if (viewMode === "list") {
    return (
      <motion.div 
        whileHover={{ x: 4 }}
        className="glass-card p-3 group flex items-center gap-4 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden h-[72px]"
        onClick={() => router.push(`/collection/${collection.id}/chat`)}
      >
        <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:bg-primary/20 transition-colors text-xl">
           {collection.emoji || "📁"}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white/90 truncate mb-1 pr-4">
            {collection.name}
          </h3>
          <div className="flex items-center gap-3">
             <span className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/20">
                Bộ tài liệu • {collection.doc_count} file
             </span>
             <div className={cn(
                "flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest",
                collection.expires_at 
                    ? isExpiringSoon ? "text-red-500 animate-pulse" : "text-amber-500"
                    : "text-emerald-500"
             )}>
                {collection.expires_at ? <Clock size={10} /> : <Infinity size={10} />}
                {timeLeft}
             </div>
             <span className="text-[10px] text-white/30 hidden sm:inline">
                {collection.last_chat_at 
                  ? `Chat: ${formatDistanceToNow(new Date(collection.last_chat_at), { addSuffix: true, locale: vi })}`
                  : "Chưa chat"}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto pr-1">
             <Button 
                size="sm"
                onClick={(e) => { e.stopPropagation(); router.push(`/collection/${collection.id}/chat`); }} 
                className="h-8 px-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold gap-2"
             >
               <MessageSquare size={14} />
               Chat bộ
             </Button>
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10 text-white/80">
                  <DropdownMenuItem onClick={() => onAddDoc(collection.id)} className="flex gap-2">
                      <Plus size={14} /> Thêm tài liệu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(collection.id)} className="flex gap-2">
                      <Edit3 size={14} /> Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(collection.id)} className="flex gap-2 text-red-400 focus:text-red-400">
                      <Trash2 size={14} /> Xóa bộ
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card w-[240px] shrink-0 p-4 flex flex-col justify-between group cursor-pointer border-white/5 hover:border-primary/40 transition-all shadow-lg min-h-[180px]"
      onClick={() => router.push(`/collection/${collection.id}/chat`)}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="text-3xl">{collection.emoji || "📁"}</div>
          
          <div className="flex flex-col items-end gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10 text-white/80">
                <DropdownMenuItem onClick={() => onAddDoc(collection.id)} className="flex gap-2">
                    <Plus size={14} /> Thêm tài liệu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(collection.id)} className="flex gap-2">
                    <Edit3 size={14} /> Đổi tên/Emoji
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(collection.id)} className="flex gap-2 text-red-400 focus:text-red-400">
                    <Trash2 size={14} /> Xóa bộ
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black tracking-tighter uppercase",
                collection.expires_at 
                    ? isExpiringSoon 
                        ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}>
                {collection.expires_at ? <Clock size={8} /> : <Infinity size={8} />}
                {timeLeft}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-white/90 line-clamp-2 leading-tight mb-2 min-h-[2.5rem]">
          {collection.name}
        </h3>

        <div className="flex gap-1 mb-3">
          {collection.documents?.map((doc, i) => (
            <div key={i} className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-primary" title={doc.title}>
              <Folder size={10} />
            </div>
          ))}
          {collection.doc_count > 3 && (
            <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/30">
              +{collection.doc_count - 3}
            </div>
          )}
          {collection.doc_count === 0 && (
            <div className="text-[10px] text-white/20 italic">Chưa có tài liệu</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col text-[10px] text-white/40">
          <span>{collection.doc_count} tài liệu</span>
          <span>
            {collection.last_chat_at 
              ? `Chat: ${formatDistanceToNow(new Date(collection.last_chat_at), { addSuffix: true, locale: vi })}`
              : "• Chưa chat"}
          </span>
        </div>

        <Button 
          className="w-full h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold gap-2"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/collection/${collection.id}/chat`);
          }}
        >
          <MessageSquare size={14} />
          Chat ngay
        </Button>
      </div>
    </motion.div>
  );
}
