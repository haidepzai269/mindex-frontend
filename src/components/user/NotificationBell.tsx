"use client";

import { Bell, Trash2, Clock, Check, Sparkles, Inbox, SlidersHorizontal, FileWarning, FileX2, Megaphone } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore, Notification } from "@/store/useNotificationStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { fetchApi } from "@/lib/api";

type FilterKey = "all" | "unread" | "system" | "document_expired" | "document_deleted";

const FILTERS: { key: FilterKey; label: string; icon: typeof Inbox }[] = [
  { key: "all", label: "Tất cả", icon: Inbox },
  { key: "unread", label: "Chưa đọc", icon: Sparkles },
  { key: "system", label: "Hệ thống", icon: Megaphone },
  { key: "document_expired", label: "Hết hạn", icon: FileWarning },
  { key: "document_deleted", label: "Đã xóa", icon: FileX2 },
];

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hover logic (Desktop only)
  const handleMouseEnter = () => {
    // Chỉ kích hoạt hover nếu là thiết bị có chuột (không phải cảm ứng)
    if (window.matchMedia("(hover: hover)").matches) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia("(hover: hover)").matches) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 200);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
  };

  const handleMarkAllRead = async () => {
    markAllAsRead();
    await fetchApi(`/notifications/all/read`, { method: 'PATCH' });
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    clearAll();
    await fetchApi('/notifications/all', { method: 'DELETE' });
  };

  const handleDeleteOne = async (id: string) => {
    deleteNotification(id);
    await fetchApi(`/notifications/${id}`, { method: 'DELETE' });
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.read_at);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const filterCounts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read_at).length,
      system: notifications.filter((n) => n.type === "system").length,
      document_expired: notifications.filter((n) => n.type === "document_expired").length,
      document_deleted: notifications.filter((n) => n.type === "document_deleted").length,
    } satisfies Record<FilterKey, number>;
  }, [notifications]);

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* BELL ICON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all duration-300",
          isOpen ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Bell size={20} className={cn(unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 35,
              opacity: { duration: 0.2 }
            }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-popover/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[min(560px,80vh)] pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 pb-3 border-b border-border/50 flex items-center justify-between bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-bold text-muted-foreground/50 hover:text-red-500 transition-colors uppercase tracking-tight flex items-center gap-1"
                    title="Xóa tất cả"
                  >
                    <Trash2 size={10} /> Xóa hết
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>

            {/* Tabs: Gần đây / Bộ lọc */}
            <Tabs defaultValue="recent" className="flex-1 min-h-0 flex flex-col gap-0">
              <div className="px-3 pt-3 shrink-0">
                <TabsList className="w-full bg-muted/60 h-9">
                  <TabsTrigger value="recent" className="gap-1.5 text-xs">
                    <Clock size={13} /> Gần đây
                  </TabsTrigger>
                  <TabsTrigger value="filter" className="gap-1.5 text-xs">
                    <SlidersHorizontal size={13} /> Bộ lọc
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB: GẦN ĐÂY — danh sách mặc định, mới nhất trước */}
              <TabsContent value="recent" className="flex-1 min-h-0 flex flex-col mt-2">
                <ScrollArea className="flex-1 overflow-y-auto min-h-0 relative z-10">
                  <div className="flex flex-col pb-4">
                    <NotificationList
                      items={notifications}
                      onRead={handleMarkAsRead}
                      onDelete={handleDeleteOne}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* TAB: BỘ LỌC — chọn loại / trạng thái, danh sách lọc theo lựa chọn */}
              <TabsContent value="filter" className="flex-1 min-h-0 flex flex-col mt-2">
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
                  {FILTERS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors border",
                        filter === key
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Icon size={12} />
                      {label}
                      <span className={cn(
                        "text-[9px] px-1 rounded-full",
                        filter === key ? "bg-primary/20" : "bg-muted"
                      )}>
                        {filterCounts[key]}
                      </span>
                    </button>
                  ))}
                </div>
                <ScrollArea className="flex-1 overflow-y-auto min-h-0 relative z-10">
                  <div className="flex flex-col pb-4">
                    <NotificationList
                      items={filteredNotifications}
                      onRead={handleMarkAsRead}
                      onDelete={handleDeleteOne}
                      emptyLabel="Không có thông báo phù hợp với bộ lọc này."
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="p-3 bg-card border-t border-border text-center shrink-0 relative z-20">
              <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-[0.2em]">Mindex Notifications</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationList({
  items,
  onRead,
  onDelete,
  emptyLabel = "Chưa có thông báo nào",
}: {
  items: Notification[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-muted-foreground italic px-6 text-center">
        <Bell size={32} className="opacity-10 mb-2" />
        <p className="text-xs">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {items.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          onRead={() => onRead(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </AnimatePresence>
  );
}

function NotificationItem({ item, onRead, onDelete }: { item: Notification; onRead: () => void; onDelete: () => void }) {
  const isExpired = item.type === 'document_expired';
  const isDeleted = item.type === 'document_deleted';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onRead}
      className={cn(
        "p-4 border-b border-border/30 last:border-0 cursor-pointer transition-all hover:bg-accent/30 group relative",
        !item.read_at && "bg-primary/5"
      )}
    >
      <div className="flex gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
          isExpired ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
          isDeleted ? "bg-red-500/10 border-red-500/20 text-red-500" :
          "bg-muted border-border text-muted-foreground/60"
        )}>
          {isExpired ? <Clock size={18} /> :
           isDeleted ? <Trash2 size={18} /> :
           <Bell size={18} />}
        </div>

        <div className="flex-1 min-w-0 pr-12">
          <div className="flex justify-between items-start mb-1">
            <h4 className={cn(
              "text-[13px] font-bold truncate pr-2",
              !item.read_at ? "text-foreground" : "text-muted-foreground"
            )}>
              {item.title}
            </h4>
            <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap pt-0.5">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
            </span>
          </div>
          <p className={cn(
            "text-[11px] leading-relaxed line-clamp-2",
            !item.read_at ? "text-foreground/70" : "text-muted-foreground/60"
          )}>
            {item.message}
          </p>
        </div>
      </div>

      {/* Action group on the right */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        {!item.read_at && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
            className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            title="Đánh dấu đã đọc"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          title="Xóa thông báo"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {!item.read_at && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full shadow-[0_0_8px_rgba(184,41,255,0.5)]" />
      )}
    </motion.div>
  );
}
