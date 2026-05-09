"use client";

import { Lock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
};

export function AnalyticsBadgesCard({ badges }: { badges: BadgeItem[] }) {
  const earnedCount = badges.filter((badge) => badge.earned).length;

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Star className="h-4 w-4 text-amber-500" />
          Huy hieu hoc tap
          <span className="ml-auto rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
            {earnedCount}/{badges.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "rounded-2xl border p-4 transition-all",
                badge.earned
                  ? "border-amber-500/25 bg-gradient-to-br from-amber-500/12 to-transparent"
                  : "border-border/60 bg-muted/20 opacity-75"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-2xl",
                    badge.earned ? "border-amber-500/20 bg-background/70" : "border-border/60 bg-background/40"
                  )}
                >
                  <span>{badge.emoji}</span>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{badge.name}</p>
                    {!badge.earned && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.18em]",
                      badge.earned ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground"
                    )}
                  >
                    {badge.earned ? "Da mo khoa" : "Chua dat"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
