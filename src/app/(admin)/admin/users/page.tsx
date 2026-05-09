"use client";

import { useState } from "react";
import { Users, Search, Crown, Shield, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useSWR from "swr";
import { fetchApi, fetcher } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIERS = ["FREE", "PRO", "ULTRA"];
const TIER_COLORS: Record<string, string> = {
  FREE: "border-border text-muted-foreground",
  PRO: "border-amber-400/40 text-amber-500 bg-amber-500/5",
  ULTRA: "border-rose-400/40 text-rose-500 bg-rose-500/5",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [changingId, setChangingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR(
    `/admin/users?q=${search}&tier=${tierFilter}`,
    fetcher as any
  ) as { data: any; isLoading: boolean; mutate: any };

  const users: any[] = data?.data || [];

  const handleChangeTier = async (userId: string, newTier: string) => {
    setChangingId(userId);
    try {
      await fetchApi(`/admin/users/${userId}/tier`, {
        method: "PATCH",
        body: JSON.stringify({ tier: newTier }),
      });
      toast.success(`Đã đổi tier thành ${newTier}`);
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Lỗi");
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users size={20} className="text-primary" />
        <h1 className="text-xl font-bold">Quản lý User</h1>
        <Badge variant="outline" className="ml-2">{users.length} kết quả</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên / email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          <Button variant={tierFilter === "" ? "default" : "outline"} size="sm" className="h-9 text-xs" onClick={() => setTierFilter("")}>Tất cả</Button>
          {TIERS.map(t => (
            <Button key={t} variant={tierFilter === t ? "default" : "outline"} size="sm" className="h-9 text-xs" onClick={() => setTierFilter(t)}>{t}</Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-muted/30 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="border border-border/50 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_100px_160px] gap-4 px-4 py-2.5 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <div>Người dùng</div>
            <div>Email</div>
            <div>Tier hiện tại</div>
            <div>Đổi Tier</div>
          </div>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Không tìm thấy user</div>
          ) : (
            users.map((u: any) => (
              <div key={u.id} className="grid grid-cols-[2fr_2fr_100px_160px] gap-4 px-4 py-3 border-t border-border/30 items-center hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 shrink-0">
                    {u.avatar_url ? <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover rounded-full" /> : null}
                    <AvatarFallback className="text-[10px]">{u.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{u.name}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                <Badge variant="outline" className={cn("text-[10px] w-fit", TIER_COLORS[u.tier] || "")}>
                  {u.tier === "PRO" && <Crown size={10} className="mr-1" />}
                  {u.tier === "ULTRA" && <Shield size={10} className="mr-1" />}
                  {u.tier}
                </Badge>
                <div className="flex gap-1">
                  {TIERS.filter(t => t !== u.tier).map(t => (
                    <Button
                      key={t}
                      variant="outline"
                      size="sm"
                      disabled={changingId === u.id}
                      className={cn("h-7 px-2 text-[10px] font-bold", TIER_COLORS[t])}
                      onClick={() => handleChangeTier(u.id, t)}
                    >
                      → {t}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
