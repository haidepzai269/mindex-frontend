"use client";

import { Folder, MoreVertical, MessageSquare, Trash2, Edit3, Plus, Clock, Infinity } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

export function CollectionCard({ collection, viewMode = "grid", onDelete, onEdit, onAddDoc }: CollectionCardProps) {
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
      setTimeLeft(days > 0 ? `${days} ngày` : `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [collection.expires_at]);

  const timeBadgeClass = collection.expires_at
    ? isExpiringSoon
      ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        className="group relative flex h-[72px] cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card/90 p-3 transition-all hover:border-primary/30 hover:bg-accent/30"
        onClick={() => router.push(`/collection/${collection.id}/chat`)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xl text-primary transition-colors group-hover:bg-primary/10">
          {collection.emoji || "📁"}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate pr-4 font-semibold text-foreground">{collection.name}</h3>
          <div className="flex items-center gap-3">
            <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              Bộ tài liệu • {collection.doc_count} file
            </span>
            <div className={cn("flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest", timeBadgeClass)}>
              {collection.expires_at ? <Clock size={10} /> : <Infinity size={10} />}
              {timeLeft}
            </div>
            <span className="hidden text-[10px] text-muted-foreground sm:inline">
              {collection.last_chat_at ? `Chat: ${formatDistanceToNow(new Date(collection.last_chat_at), { addSuffix: true, locale: vi })}` : "Chưa chat"}
            </span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 pr-1">
          <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/collection/${collection.id}/chat`); }} className="h-8 gap-2 border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/20">
            <MessageSquare size={14} />
            Chat bộ
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-popover text-popover-foreground">
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddDoc(collection.id); }} className="flex gap-2">
                <Plus size={14} /> Thêm tài liệu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(collection.id); }} className="flex gap-2">
                <Edit3 size={14} /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(collection.id); }} className="flex gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400">
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
      className="flex min-h-[180px] w-[240px] shrink-0 cursor-pointer flex-col justify-between rounded-2xl border border-border bg-card/95 p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-card"
      onClick={() => router.push(`/collection/${collection.id}/chat`)}
    >
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="text-3xl">{collection.emoji || "📁"}</div>

          <div className="flex flex-col items-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-border bg-popover text-popover-foreground">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddDoc(collection.id); }} className="flex gap-2">
                  <Plus size={14} /> Thêm tài liệu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(collection.id); }} className="flex gap-2">
                  <Edit3 size={14} /> Đổi tên/Emoji
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(collection.id); }} className="flex gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400">
                  <Trash2 size={14} /> Xóa bộ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className={cn("flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter", timeBadgeClass)}>
              {collection.expires_at ? <Clock size={8} /> : <Infinity size={8} />}
              {timeLeft}
            </div>
          </div>
        </div>

        <h3 className="mb-2 min-h-[2.5rem] line-clamp-2 font-bold leading-tight text-foreground">{collection.name}</h3>

        <div className="mb-3 flex gap-1">
          {collection.documents?.map((doc, i) => (
            <div key={i} className="flex h-6 w-6 items-center justify-center rounded border border-border bg-muted text-[10px] text-primary" title={doc.title}>
              <Folder size={10} />
            </div>
          ))}
          {collection.doc_count > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded border border-border bg-muted text-[10px] text-muted-foreground">
              +{collection.doc_count - 3}
            </div>
          )}
          {collection.doc_count === 0 && <div className="text-[10px] italic text-muted-foreground">Chưa có tài liệu</div>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col text-[10px] text-muted-foreground">
          <span>{collection.doc_count} tài liệu</span>
          <span>{collection.last_chat_at ? `Chat: ${formatDistanceToNow(new Date(collection.last_chat_at), { addSuffix: true, locale: vi })}` : "• Chưa chat"}</span>
        </div>

        <Button
          className="h-8 w-full gap-2 border border-primary/20 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20"
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
