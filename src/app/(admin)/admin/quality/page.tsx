"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ThumbsDown, ThumbsUp, Zap, Clock, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

// Model badge màu sắc
function ModelBadge({ model }: { model: string }) {
  const cfg: Record<string, string> = {
    ninerouter: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    groq:       "bg-blue-500/20 text-blue-300 border-blue-500/30",
    cerebras:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    mistral:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
    openrouter: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  };
  const cls = cfg[model] ?? "bg-zinc-700/30 text-zinc-400 border-zinc-700";
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider", cls)}>
      {model}
    </span>
  );
}

export default function AdminQualityPage() {
  const [days, setDays] = useState(7);

  const { data: statsData, isLoading: statsLoading } =
    useSWR<{ success: boolean; data: any[] }>(`/admin/quality/stats?days=${days}`, fetcher as any, { refreshInterval: 60000 });

  const { data: timelineData } =
    useSWR<{ success: boolean; data: any[] }>(`/admin/quality/timeline?days=${days}`, fetcher as any, { refreshInterval: 60000 });

  const { data: lowRatedData } =
    useSWR<{ success: boolean; data: any[] }>("/admin/quality/low-rated?limit=20", fetcher as any, { refreshInterval: 120000 });

  const stats = statsData?.data ?? [];
  const timeline = timelineData?.data ?? [];
  const lowRated = lowRatedData?.data ?? [];

  // Tổng hợp overview
  const totalCalls = stats.reduce((s, m) => s + (m.total_calls || 0), 0);
  const totalRatings = stats.reduce((s, m) => s + (m.total_ratings || 0), 0);
  const avgThumbsDown = stats.length
    ? stats.reduce((s, m) => s + (m.thumbs_down_pct || 0), 0) / stats.length
    : 0;
  const avgLatency = stats.length
    ? Math.round(stats.reduce((s, m) => s + (m.avg_latency_ms || 0), 0) / stats.length)
    : 0;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Activity className="text-purple-400" size={24} />
            AI Quality Monitor
          </h1>
          <p className="text-sm text-white/40 mt-1">Giám sát chất lượng phản hồi và hiệu suất model theo thời gian thực</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                days === opt.value
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng AI Calls", value: totalCalls.toLocaleString(), icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Đã được rating", value: totalRatings.toLocaleString(), icon: ThumbsUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Avg Thumbs Down", value: `${avgThumbsDown.toFixed(1)}%`, icon: ThumbsDown, color: avgThumbsDown > 30 ? "text-red-400" : "text-amber-400", bg: avgThumbsDown > 30 ? "bg-red-500/10" : "bg-amber-500/10" },
          { label: "Avg Latency", value: `${avgLatency}ms`, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
        ].map((card) => (
          <Card key={card.label} className={cn("border-white/10 text-white shadow-xl", card.bg, "bg-[#111115]")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{card.label}</span>
                <card.icon size={16} className={card.color} />
              </div>
              <p className={cn("text-2xl font-black", card.color)}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Thumbs Down Timeline Chart */}
      <Card className="bg-[#111115] border-white/10 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Thumbs Down Rate theo ngày
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timeline} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return isNaN(d.getTime()) ? v : format(d, "dd/MM");
                  }}

                />
                
                {/* Trục Y trái: Percentage */}
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  unit="%" 
                  domain={[0, 100]} 
                />

                {/* Trục Y phải: Absolute count */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                />

                <Tooltip
                  contentStyle={{ 
                    background: "rgba(10, 10, 15, 0.95)", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: 16,
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                  }}
                  itemStyle={{ fontSize: 12, fontWeight: 700 }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4, fontWeight: 900, textTransform: "uppercase" }}
                  cursor={{ stroke: "rgba(167, 139, 250, 0.2)", strokeWidth: 2 }}
                />

                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={36}
                  iconType="circle"
                  formatter={(v) => <span className="text-[11px] font-bold text-white/50 ml-1">{v}</span>} 
                />

                {/* AI Calls: Đại diện bằng đường mờ nhẹ và Area */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="total_calls" 
                  stroke="#a78bfa" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                  name="Tổng AI Calls" 
                  animationDuration={1500}
                />

                {/* Thumbs Down %: Đường cảnh báo màu đỏ */}
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="thumbs_down_pct" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                  name="Tỷ lệ Thumbs Down (%)"
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>

          )}
        </CardContent>
      </Card>

      {/* Model Comparison Table */}
      <Card className="bg-[#111115] border-white/10 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap size={16} className="text-purple-400" />
            So sánh Model AI ({days} ngày)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="h-24 flex items-center justify-center text-white/30 text-sm animate-pulse">Đang tải...</div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-b border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/50">Model</TableHead>
                    <TableHead className="text-right text-white/50">Calls</TableHead>
                    <TableHead className="text-right text-white/50">Avg Latency</TableHead>
                    <TableHead className="text-right text-white/50">Thumbs ✅</TableHead>
                    <TableHead className="text-right text-white/50">Thumbs ❌</TableHead>
                    <TableHead className="text-right text-white/50">Avg ⭐</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-20 text-center text-white/30">Chưa có dữ liệu cho khoảng thời gian này</TableCell></TableRow>
                  ) : stats.map((s: any) => (
                    <TableRow key={s.model} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell><ModelBadge model={s.model} /></TableCell>
                      <TableCell className="text-right text-white/70 font-bold">{s.total_calls?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("font-bold text-sm", s.avg_latency_ms > 5000 ? "text-red-400" : s.avg_latency_ms > 2000 ? "text-amber-400" : "text-emerald-400")}>
                          {s.avg_latency_ms?.toFixed(0)}ms
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-emerald-400 font-bold">{s.thumbs_up_pct?.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("font-bold text-sm", s.thumbs_down_pct > 30 ? "text-red-400" : "text-white/60")}>
                          {s.thumbs_down_pct?.toFixed(1)}%
                          {s.thumbs_down_pct > 30 && <AlertTriangle size={12} className="inline ml-1" />}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-amber-400 font-bold">
                        {s.avg_rating ? `${s.avg_rating}/5` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low-Rated Questions */}
      <Card className="bg-[#111115] border-white/10 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ThumbsDown size={16} className="text-red-400" />
            Câu hỏi bị đánh giá thấp gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowRated.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-white/30 text-sm">Chưa có phản hồi tiêu cực nào 🎉</div>
            ) : lowRated.map((item: any, i: number) => (
              <div key={item.id} className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/8 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-white/30">#{i + 1}</span>
                    <ModelBadge model={item.model_used} />
                    {item.topic_label && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/50 border border-white/10 font-medium">
                        {item.topic_label}
                      </span>
                    )}
                    <span className="text-[10px] text-white/30">
                      {format(new Date(item.created_at), "HH:mm dd/MM", { locale: vi })}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/30 whitespace-nowrap">{item.latency_ms}ms</span>
                </div>
                <p className="text-[13px] text-white/80 font-medium mb-1">Q: {item.question}</p>
                {item.comment && (
                  <p className="text-[12px] text-red-300/70 italic">💬 "{item.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
