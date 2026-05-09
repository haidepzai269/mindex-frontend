"use client";

import { useState, useCallback } from "react";
import {
  Globe,
  Search,
  ThumbsUp,
  Plus,
  BookOpen,
  Clock,
  Zap,
  Loader2,
  Filter,
  GraduationCap,
  ChevronRight,
  Users,
  CheckCircle,
  Edit2,
  ChevronDown,
  History,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/useAuthStore";

import { formatTimeAgo } from "@/lib/time";

const PERSONA_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  student:    { label: "Sinh viên",  emoji: "🎓", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  doctor:     { label: "Y tế",       emoji: "🏥", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  legal:      { label: "Pháp lý",    emoji: "⚖️", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  engineer:   { label: "Kỹ thuật",   emoji: "⚙️", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  business:   { label: "Kinh doanh", emoji: "📊", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  researcher: { label: "Nghiên cứu", emoji: "🔬", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
};

function PersonaBadge({ persona, isOwner, onEdit }: { persona: string; isOwner?: boolean; onEdit?: (newPersona: string) => void }) {
  const cfg = PERSONA_LABELS[persona] || { label: persona, emoji: "📄", color: "text-white/50 bg-white/5 border-white/10" };
  
  const badge = (
    <span className={cn(
      "text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 transition-all", 
      cfg.color,
      isOwner && "hover:brightness-125 cursor-pointer"
    )}>
      {cfg.emoji} {cfg.label}
      {isOwner && <ChevronDown size={10} className="opacity-50" />}
    </span>
  );

  if (!isOwner || !onEdit) return badge;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {badge}
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1 bg-popover border-border shadow-2xl">
        <div className="grid grid-cols-1 gap-0.5">
          {Object.entries(PERSONA_LABELS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onEdit(key)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium rounded-md hover:bg-white/5 transition-colors text-left",
                persona === key ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-white"
              )}
            >
              <span>{value.emoji}</span>
              <span>{value.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeAgo({ dateStr }: { dateStr: string }) {
  return <span>{formatTimeAgo(dateStr)}</span>;
}

import { NotificationBell } from "@/components/user/NotificationBell";

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [usedDocs, setUsedDocs] = useState<Set<string>>(new Set());
  const [votedDocs, setVotedDocs] = useState<Set<string>>(new Set());
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  const debouncedSearch = useDebounce(search, 400);

  const queryKey = `/community/search?q=${debouncedSearch}&subject=${subject === "all" ? "" : subject}`;
  const { data: communityData, isLoading, mutate } = useSWR(queryKey, fetcher as any) as {
    data: any;
    isLoading: boolean;
    mutate: any;
  };

  const { data: historyData, mutate: mutateHistory } = useSWR(user ? "/community/search/history" : null, fetcher as any);
  const history: any[] = historyData?.data || [];
  const [showHistory, setShowHistory] = useState(false);

  const docs: any[] = communityData?.data?.results || [];
  const total: number = communityData?.data?.meta?.total || 0;

  const setLoading = useCallback((docId: string, loading: boolean) => {
    setLoadingDocs((prev) => {
      const next = new Set(prev);
      if (loading) {
        next.add(docId);
      } else {
        next.delete(docId);
      }
      return next;
    });
  }, []);

  const handleSaveSearch = async (q: string) => {
    if (!q.trim() || !user) return;
    try {
        await fetchApi("/community/search/history", {
            method: "POST",
            body: JSON.stringify({ query: q })
        });
        mutateHistory();
    } catch(err) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
        handleSaveSearch(search);
        setShowHistory(false);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
        await fetchApi(`/community/search/history/${id}`, { method: "DELETE" });
        mutateHistory();
    } catch(err) {}
  };

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        await fetchApi(`/community/search/history`, { method: "DELETE" });
        mutateHistory();
    } catch(err) {}
  };

  const handleAddToLibrary = async (docId: string) => {
    if (loadingDocs.has(docId)) return;
    setLoading(docId, true);
    try {
      const res: any = await fetchApi(`/community/documents/${docId}/use`, { method: "POST" });
      if (res.success) {
        setUsedDocs((prev) => new Set([...prev, docId]));
        if (res.data?.is_duplicate) {
          toast.info("Tài liệu đã có trong thư viện của bạn.");
        } else {
          toast.success("✅ Đã thêm vào Thư viện!");
        }
      }
    } catch (err: any) {
      toast.error("Không thể thêm tài liệu. Vui lòng đăng nhập.");
    } finally {
      setLoading(docId, false);
    }
  };

  const handleUpvote = async (docId: string) => {
    if (loadingDocs.has(docId) || votedDocs.has(docId)) return;
    setLoading(docId, true);
    try {
      const res: any = await fetchApi(`/community/documents/${docId}/upvote`, { method: "POST" });
      if (res.success) {
        setVotedDocs((prev) => new Set([...prev, docId]));
        mutate();
        toast.success("👍 Đã bình chọn!");
      }
    } catch (err: any) {
      if (err.data?.error === "ALREADY_VOTED") {
        toast.info("Bạn đã bình chọn tài liệu này rồi.");
        setVotedDocs((prev) => new Set([...prev, docId]));
      } else {
        toast.error("Không thể bình chọn.");
      }
    } finally {
      setLoading(docId, false);
    }
  };

  const handleUpdatePersona = async (docId: string, newPersona: string) => {
    try {
      const res: any = await fetchApi(`/documents/${docId}/persona`, {
        method: "PATCH",
        body: JSON.stringify({ persona: newPersona }),
      });
      if (res.success) {
        toast.success("Đã cập nhật lĩnh vực");
        mutate();
      }
    } catch (err) {
      toast.error("Không thể cập nhật lĩnh vực");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* ── HEADER (Compact) ── */}
      <div className="px-4 md:px-8 pt-4 md:pt-8 pb-3 md:pb-4 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Thư viện chung</h1>
            <Dialog>
              <DialogTrigger className="text-muted-foreground hover:text-foreground transition-colors">
                <Info size={16} />
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Zap size={20} className="text-primary" />
                    Cơ chế Mindex Neural Search
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm text-muted-foreground leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">1. Tìm kiếm lai (Hybrid Search)</p>
                    <p>Hệ thống kết hợp giữa **Tìm kiếm từ khóa** (khớp tiêu đề) và **Tìm kiếm ngữ nghĩa AI** (hiểu nội dung) để đưa ra thực tế chính xác nhất.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">2. Thứ tự ưu tiên</p>
                    <p>Các tài liệu được sắp xếp dựa trên **độ liên quan (relevance score)**. Những kết quả có tiêu đề khớp trực tiếp hoặc nội dung sát với ý định của bạn sẽ luôn được ưu tiên ở trên cùng.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">3. Tối ưu hóa hiệu suất</p>
                    <p>Để tiết kiệm tài nguyên và tăng tốc độ, nếu hệ thống tìm thấy kết quả khớp hoàn toàn trong cơ sở dữ liệu, AI sẽ được tạm nghỉ để trả kết quả ngay lập tức.</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border text-[12px]">
                    <span className="text-primary font-bold">Mẹo:</span> Bạn có thể sử dụng các từ khóa chuyên môn hoặc câu hỏi tự nhiên, Neural Search sẽ tự động hiểu ngữ cảnh.
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground text-xs hidden md:block">
            Khám phá kiến thức từ cộng đồng Mindex.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-6 mb-1">
           <Link href="/rooms" className="p-1.5 rounded-xl bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all" title="Phòng học nhóm">
             <Users size={18} />
           </Link>
           {communityData?.data?.search_mode === "hybrid" && (
             <div className="flex items-center gap-1 bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/20 animate-pulse">
               <Zap size={12} className="text-brand-primary fill-brand-primary" />
               <span className="text-[9px] font-bold text-brand-primary uppercase tracking-tight">AI Smart Search</span>
             </div>
           )}
           <div className="flex items-center gap-1.5 bg-secondary/20 px-2.5 py-1 rounded-full border border-secondary/20">
             <BookOpen size={12} className="text-secondary" />
             <span className="font-bold text-foreground text-[10px] md:text-xs">{total} tài liệu</span>
           </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 border-b border-border/50 bg-muted/10">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
           <Popover open={showHistory && history.length > 0} onOpenChange={setShowHistory}>
             <PopoverTrigger asChild>
               <div className="relative w-full md:max-w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <Input
                    placeholder="Tìm tài liệu..."
                    className="h-9 pl-9 bg-muted/40 border-border hover:bg-muted/60 transition-colors focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl md:rounded-lg text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowHistory(true)}
                    onKeyDown={handleKeyDown}
                  />
               </div>
             </PopoverTrigger>
             <PopoverContent
                 className="w-[calc(100vw-32px)] md:w-[320px] p-0 bg-popover border-border shadow-2xl overflow-hidden rounded-2xl md:rounded-xl z-[100]"
                 align="start"
                 sideOffset={8}
                 onOpenAutoFocus={(e) => e.preventDefault()}
             >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lịch sử tìm kiếm</span>
                   <button onClick={handleClearHistory} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      Xóa tất cả
                   </button>
                </div>
                <div className="py-1">
                   {history.map(item => (
                       <div
                          key={item.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer group transition-colors"
                          onClick={() => {
                              setSearch(item.query);
                              handleSaveSearch(item.query);
                              setShowHistory(false);
                          }}
                       >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                             <History size={14} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                             <span>{item.query}</span>
                          </div>
                          <button
                             onClick={(e) => handleDeleteHistory(e, item.id)}
                             className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded-md transition-all text-muted-foreground hover:text-rose-500"
                          >
                             <X size={14} />
                          </button>
                       </div>
                   ))}
                </div>
             </PopoverContent>
           </Popover>
           
           <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "h-9 w-full md:w-[190px] flex items-center gap-2 px-3 border rounded-xl md:rounded-lg text-[11px] font-medium transition-all",
                  subject === "all"
                    ? "bg-muted/40 border-border text-muted-foreground hover:bg-muted/60"
                    : cn(PERSONA_LABELS[subject]?.color, "border")
                )}>
                  <Filter size={13} className="shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {subject === "all" ? "Tất cả lĩnh vực" : `${PERSONA_LABELS[subject]?.emoji} ${PERSONA_LABELS[subject]?.label}`}
                  </span>
                  <ChevronDown size={13} className="shrink-0 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-1.5 bg-popover border-border shadow-2xl rounded-2xl z-[110]" align="start" sideOffset={6}>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSubject("all")}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all",
                      subject === "all" ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>🌐</span>
                    <span className="flex-1 text-left">Tất cả lĩnh vực</span>
                    {subject === "all" && <CheckCircle size={12} />}
                  </button>
                  <div className="h-px bg-border/50 mx-1 my-0.5" />
                  {Object.entries(PERSONA_LABELS).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setSubject(key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all border",
                        subject === key ? cfg.color : "border-transparent hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{cfg.emoji}</span>
                      <span className="flex-1 text-left">{cfg.label}</span>
                      {subject === key && <CheckCircle size={12} />}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {(search || subject !== "all") && (
              <Button
                variant="ghost"
                onClick={() => { setSearch(""); setSubject("all"); }}
                className="h-8 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Xóa lọc ×
              </Button>
            )}
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
           <Button variant="outline" size="sm" className="flex-1 md:flex-none h-9 border-border text-[10px] md:text-xs gap-2 hover:bg-accent rounded-xl md:rounded-lg">
              <Zap size={14} className="text-amber-500" />
              Tốc độ cao
           </Button>
           <Button variant="outline" size="sm" className="flex-1 md:flex-none h-9 border-border text-[10px] md:text-xs gap-2 hover:bg-accent rounded-xl md:rounded-lg">
              <Users size={14} className="text-emerald-500" />
              Cộng đồng
           </Button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
            <div className="space-y-4">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="h-20 w-full bg-muted/40 animate-pulse rounded-xl border border-border/30" />
               ))}
            </div>
          </div>
        ) : docs.length > 0 ? (
          <>
            {/* Column headers — desktop only, fixed (không cuộn) */}
            <div className="hidden md:grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 md:px-14 py-2.5 shrink-0 border-b border-border/40 bg-background text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
               <div>Tên tài liệu & Người đóng góp</div>
               <div>Lĩnh vực</div>
               <div className="text-center">Chi tiết</div>
               <div className="text-center">Tương tác</div>
               <div className="text-right pr-2">Thao tác</div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3 md:py-4 pb-32 md:pb-6">
            <div className="space-y-3">
             {docs.map((doc: any) => {
                const isUsed = usedDocs.has(doc.id);
                const isVoted = votedDocs.has(doc.id);
                const isLoading_ = loadingDocs.has(doc.id);

                return (
                  <div key={doc.id} className="flex flex-col md:grid md:grid-cols-[1fr_150px_100px_140px_120px] gap-3 md:gap-4 px-4 md:px-6 py-4 md:items-center bg-card/60 border border-border/50 rounded-2xl hover:bg-accent/30 hover:border-border transition-all group shadow-sm">
                     {/* Column: Info */}
                     <div className="min-w-0 md:pr-4">
                        <div className="font-bold text-xs md:text-base text-foreground group-hover:text-primary transition-colors mb-1 md:mb-1 flex items-start md:items-center gap-2">
                           <span className="truncate flex-1">{doc.title}</span>
                           {doc.hybrid_score > 0.8 && (
                             <Badge className="h-3.5 px-1 text-[7px] md:text-[9px] bg-brand-primary/20 text-brand-primary border-brand-primary/20 flex items-center gap-1 shrink-0 mt-0.5 md:mt-0">
                               <Zap size={6} className="fill-brand-primary" /> BEST
                             </Badge>
                           )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-muted-foreground/60">
                           <TimeAgo dateStr={doc.display_date || doc.created_at} />
                           {doc.contributor_name && (
                             <>
                               <span className="w-1 h-1 rounded-full bg-border" />
                               <span className="flex items-center gap-1 truncate shrink-0">
                                 <GraduationCap size={12} className="text-muted-foreground/40 shrink-0" />
                                 <span className="truncate">{doc.contributor_name}</span>
                               </span>
                             </>
                           )}
                        </div>
                     </div>

                     {/* Column: Persona & Details */}
                     <div className="flex items-center gap-3">
                        <PersonaBadge 
                          persona={doc.creator_persona || "student"} 
                          isOwner={doc.owner_id === user?.id}
                          onEdit={(newVal) => handleUpdatePersona(doc.id, newVal)}
                        />
                        <Badge variant="outline" className="md:hidden flex text-[9px] font-medium bg-muted/30 border-border/30 text-muted-foreground px-1.5 h-4 md:h-5 md:text-[10px] md:px-2">
                          {Math.ceil((doc.chunk_count || 0) / 4)} trang
                        </Badge>
                     </div>

                     {/* Column: Detail (Desktop Only - Align with "Chi tiết") */}
                     <div className="hidden md:flex items-center justify-center">
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/30 border-border/30 text-muted-foreground px-2 h-5">
                          {Math.ceil((doc.chunk_count || 0) / 4)} trang
                        </Badge>
                     </div>

                     {/* Column: Stats (Align with "Tương tác") */}
                     <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-3 mt-1 md:border-none md:pt-0 md:mt-0 md:justify-center">
                        <div className="flex items-center gap-4 md:gap-6">
                           <div className="flex flex-col md:items-center gap-0.5" title="Lượt dùng">
                             <span className="text-[7px] md:hidden uppercase font-black text-muted-foreground/40">Dùng</span>
                             <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                               <Search size={10} className="opacity-40" />
                               <span className="font-bold">{doc.query_count || 0}</span>
                             </div>
                           </div>
                           
                           <button 
                             onClick={(e) => { e.stopPropagation(); if (!isVoted) handleUpvote(doc.id); }}
                             className={cn(
                               "flex flex-col md:items-center gap-0.5 transition-all group/v",
                               isVoted ? "text-primary" : "text-muted-foreground/50 hover:text-primary"
                             )}
                             disabled={isLoading_}
                           >
                             <span className="text-[7px] md:hidden uppercase font-black opacity-30 group-hover/v:opacity-100">Vote</span>
                             <div className="flex items-center gap-1.5 text-[11px] md:text-xs">
                               <ThumbsUp size={10} className={cn(isVoted ? "fill-primary" : "group-hover/v:scale-110 transition-transform")} />
                               <span className="font-bold">{(doc.upvote_count || 0) + (isVoted && !doc.upvote_count ? 1 : 0)}</span>
                             </div>
                           </button>
                        </div>

                        {/* Mobile Only Button (Handled in next column for desktop) */}
                        <div className="md:hidden">
                           <Button
                              size="sm"
                              variant={isUsed ? "ghost" : "default"}
                              className={cn(
                                 "h-7 px-3 rounded-lg transition-all shadow-md text-[9px] font-black uppercase tracking-tight",
                                 isUsed
                                 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                 : ""
                              )}
                              onClick={() => !isUsed && handleAddToLibrary(doc.id)}
                              disabled={isLoading_ || isUsed}
                           >
                              {isLoading_ ? <Loader2 size={12} className="animate-spin" /> : isUsed ? "Sẵn sàng" : "Dùng ngay"}
                           </Button>
                        </div>
                     </div>

                     {/* Column: Action (Desktop Only - Align with "Thao tác") */}
                     <div className="hidden md:flex justify-end">
                        <Button
                          size="sm"
                          variant={isUsed ? "ghost" : "default"}
                          className={cn(
                            "h-9 px-4 rounded-xl transition-all shadow-md text-[11px] font-black uppercase tracking-tight min-w-[100px]",
                            isUsed 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-white text-black border-none hover:bg-white/90"
                          )}
                          onClick={() => !isUsed && handleAddToLibrary(doc.id)}
                          disabled={isLoading_ || isUsed}
                        >
                          {isLoading_ ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : isUsed ? (
                            <div className="flex items-center gap-1.5">
                               <CheckCircle size={14} /> 
                               <span>Sẵn sàng</span>
                            </div>
                          ) : (
                            "Dùng ngay"
                          )}
                        </Button>
                     </div>
                  </div>
                );
             })}
            </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mb-6">
              <Globe className="text-muted-foreground/30" size={40} />
            </div>
            <h3 className="text-xl font-bold text-muted-foreground">Không tìm thấy tài liệu</h3>
            <p className="text-sm text-muted-foreground/50 max-w-sm mb-6">
              Thử từ khóa khác hoặc chuyển sang "Tất cả lĩnh vực" để mở rộng tìm kiếm.
            </p>
            <Button variant="outline" onClick={() => { setSearch(""); setSubject("all"); }} className="border-border">
              Xóa lọc tìm kiếm
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
