"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnalyticsStatCardProps = {
  label: string;
  value: number;
  sublabel: string;
  icon: LucideIcon;
  iconClassName: string;
  iconShellClassName: string;
  accentClassName: string;
};

export function AnalyticsStatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconClassName,
  iconShellClassName,
  accentClassName,
}: AnalyticsStatCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-70", accentClassName)} />
      <CardContent className="flex items-start justify-between gap-4 pt-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black tracking-tight text-foreground">{value}</span>
            <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Progress
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{sublabel}</p>
        </div>

        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border", iconShellClassName)}>
          <Icon className={cn("h-5 w-5", iconClassName)} />
        </div>
      </CardContent>
    </Card>
  );
}
