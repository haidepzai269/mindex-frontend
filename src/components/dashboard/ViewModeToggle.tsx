"use client";

import { LayoutGrid, Table } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { cn } from "@/lib/utils";

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useDashboardStore();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
      <button
        onClick={() => setViewMode("overview")}
        aria-pressed={viewMode === "overview"}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          viewMode === "overview"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Tổng quan
      </button>
      <button
        onClick={() => setViewMode("detailed")}
        aria-pressed={viewMode === "detailed"}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          viewMode === "detailed"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Table className="h-3.5 w-3.5" />
        Chi tiết
      </button>
    </div>
  );
}
