"use client";

import { Bell, Trash2, Clock, Check, MoreVertical, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore, Notification } from "@/store/useNotificationStore";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
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
          isOpen ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
        )}
      >
        <Bell size={20} className={cn(unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-[#0A0B10] shadow-[0_0_10px_rgba(239,68,68,0.5)]">
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
            className="absolute right-0 mt-3 w-80 md:w-96 bg-[#0F111A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] overflow-hidden z-[100] flex flex-col max-h-[min(520px,80vh)] pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thông báo</h3>
                <Sparkles size={12} className="text-primary animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                  {notifications.length > 0 && (
                    <button 
                        onClick={handleClearAll}
                        className="text-[10px] font-bold text-white/30 hover:text-red-400 transition-colors uppercase tracking-tight flex items-center gap-1"
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

            {/* List */}
            <ScrollArea className="flex-1 min-h-0 relative z-10">
              <div className="flex flex-col pb-10">
                <AnimatePresence initial={false}>
                    {notifications.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-600 italic">
                        <Bell size={32} className="opacity-10 mb-2" />
                        <p className="text-xs">Chưa có thông báo nào</p>
                    </div>
                    ) : (
                    notifications.map((item) => (
                        <NotificationItem 
                            key={item.id} 
                            item={item} 
                            onRead={() => handleMarkAsRead(item.id)}
                            onDelete={() => handleDeleteOne(item.id)}
                        />
                    ))
                    )}
                </AnimatePresence>
              </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="p-3 bg-[#0F111A] border-t border-white/10 text-center shrink-0 relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">Mindex Neural Notifications</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        "p-4 border-b border-white/[0.03] last:border-0 cursor-pointer transition-all hover:bg-white/[0.03] group relative",
        !item.read_at && "bg-primary/5"
      )}
    >
      <div className="flex gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
          isExpired ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : 
          isDeleted ? "bg-red-500/10 border-red-500/20 text-red-500" :
          "bg-white/5 border-white/10 text-white/40"
        )}>
          {isExpired ? <Clock size={18} /> : 
           isDeleted ? <Trash2 size={18} /> : 
           <Bell size={18} />}
        </div>
        
        <div className="flex-1 min-w-0 pr-12">
          <div className="flex justify-between items-start mb-1">
            <h4 className={cn(
              "text-[13px] font-bold truncate pr-2",
              !item.read_at ? "text-white" : "text-white/60"
            )}>
              {item.title}
            </h4>
            <span className="text-[9px] text-white/20 whitespace-nowrap pt-0.5">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
            </span>
          </div>
          <p className={cn(
            "text-[11px] leading-relaxed line-clamp-2",
            !item.read_at ? "text-white/70" : "text-white/40"
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

