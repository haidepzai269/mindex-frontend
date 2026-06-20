"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { cn } from "@/lib/utils";

const periods = [
  { value: "7d" as const, label: "7 ngày" },
  { value: "30d" as const, label: "30 ngày" },
  { value: "6m" as const, label: "6 tháng" },
  { value: "1y" as const, label: "1 năm" },
];

export function PeriodFilter() {
  const { period, setPeriod } = useDashboardStore();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          aria-pressed={period === p.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            period === p.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
