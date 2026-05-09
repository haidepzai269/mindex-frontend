"use client";

import { Lock, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  first_upload: { emoji: "🚀", label: "First Upload" },
  first_quiz: { emoji: "📝", label: "First Quiz" },
  quiz_master: { emoji: "🏆", label: "Quiz Master" },
  flashcard_hero: { emoji: "🃏", label: "Flashcard Hero" },
  community_contributor: { emoji: "🌟", label: "Contributor" },
  doc_collector: { emoji: "📚", label: "Doc Collector" },
  week_streak: { emoji: "🔥", label: "Week Streak" },
};

export function ProfileBadgesCard({ badges }: { badges: string[] }) {
  return (
    <Card className="border-border/60 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Star className="h-4 w-4 text-amber-500" />
          Huy hieu da mo khoa
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {badges.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((badgeId) => {
              const meta = BADGE_META[badgeId] || { emoji: "🏅", label: badgeId };

              return (
                <div
                  key={badgeId}
                  className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/12 to-transparent p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/15 bg-background/75 text-2xl">
                    {meta.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{meta.label}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                      Earned badge
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/60">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Chua co huy hieu cong khai</p>
              <p className="text-sm text-muted-foreground">
                Huy hieu se xuat hien khi nguoi dung hoan thanh cac moc hoc tap.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Dang xay dung thanh tich
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
