"use client";

import { cn } from "@/lib/utils";
import type { CryptoPrice } from "@/types/rich-content";
import { MiniChart } from "./MiniChart";
import { TrendingUp, TrendingDown } from "lucide-react";

function formatVND(value: number): string {
  if (value >= 1e15) return `${(value / 1e15).toFixed(1)} triệu tỷ`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} nghìn tỷ`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} triệu`;
  return new Intl.NumberFormat("vi-VN").format(Math.round(value));
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(value)) + " VND";
}

interface CryptoCardProps {
  data: CryptoPrice;
  className?: string;
}

export function CryptoCard({ data, className }: CryptoCardProps) {
  const isPositive = data.change_24h >= 0;
  const changeColor = isPositive ? "text-emerald-500" : "text-red-500";
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  const chartData = data.price_history.map((p) => ({
    label: new Date(p.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    value: p.price,
  }));

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 w-full max-w-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Tiền điện tử
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-sm font-semibold text-foreground truncate">
              {data.name}
            </p>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {data.symbol}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
            {formatPrice(data.price_vnd)}
          </p>
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-semibold mt-6", changeColor)}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{isPositive ? "+" : ""}{data.change_24h.toFixed(2)}%</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>
          Vốn hóa: {formatVND(data.market_cap_vnd)}
        </span>
        <span>
          KL 24h: {formatVND(data.volume_24h_vnd)}
        </span>
      </div>

      {chartData.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Biểu đồ 24h
          </p>
          <MiniChart
            data={chartData}
            color={chartColor}
            height={64}
            formatValue={(v) => formatPrice(v)}
          />
        </div>
      )}
    </div>
  );
}
