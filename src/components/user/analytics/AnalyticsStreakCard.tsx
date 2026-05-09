"use client";

import { Flame, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnalyticsStreakCardProps = {
  currentStreak: number;
  longestStreak: number;
  hasActivity: boolean;
};

export function AnalyticsStreakCard({
  currentStreak,
  longestStreak,
  hasActivity,
}: AnalyticsStreakCardProps) {
  return (
    <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/12 via-amber-500/8 to-transparent shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_32%)]" />
      <CardContent className="relative space-y-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-300">
              Learning Streak
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tracking-tight text-orange-600 dark:text-orange-300">
                {currentStreak}
              </span>
              <span className="mb-1 text-sm font-semibold text-orange-500/90">ngay</span>
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/15">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-orange-500/15 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Dai nhat
            </p>
            <p className="mt-1 text-lg font-black text-foreground">{longestStreak} ngay</p>
          </div>
          <div className="rounded-2xl border border-orange-500/15 bg-background/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hom nay
            </p>
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-1.5 text-sm font-bold",
                hasActivity ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {hasActivity ? "Da hoc" : "Chua hoc"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
