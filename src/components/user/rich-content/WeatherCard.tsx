"use client";

import { cn } from "@/lib/utils";
import type { WeatherData } from "@/types/rich-content";
import { MiniChart } from "./MiniChart";
import { Droplets, Wind } from "lucide-react";

const weatherIconUrl = (code: string) =>
  `https://openweathermap.org/img/wn/${code}@2x.png`;

function formatTemp(temp: number) {
  return `${Math.round(temp)}°C`;
}

interface WeatherCardProps {
  data: WeatherData;
  className?: string;
}

export function WeatherCard({ data, className }: WeatherCardProps) {
  const chartData = data.hourly_temps.map((h) => ({
    label: new Date(h.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    value: h.temp,
  }));

  const isOWMIcon = data.condition_icon && !data.condition_icon.startsWith("http") && !data.condition_icon.startsWith("//");

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
            Thời tiết
          </p>
          <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
            {data.city}
          </p>
          <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">
            {formatTemp(data.temperature)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {data.condition}
          </p>
        </div>
        {data.condition_icon && (
          <img
            src={isOWMIcon ? weatherIconUrl(data.condition_icon) : data.condition_icon}
            alt={data.condition}
            className="w-16 h-16 shrink-0"
            width={64}
            height={64}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          Cảm nhận {formatTemp(data.feels_like)}
        </span>
        <span className="flex items-center gap-1">
          <Droplets size={12} />
          {data.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind size={12} />
          {data.wind_speed.toFixed(1)} m/s
        </span>
      </div>

      {chartData.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Dự báo 24h
          </p>
          <MiniChart
            data={chartData}
            height={64}
            formatValue={(v) => `${Math.round(v)}°C`}
          />
        </div>
      )}
    </div>
  );
}
