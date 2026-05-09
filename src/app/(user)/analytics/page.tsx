"use client";

import { BookOpen, Brain, MessageSquare, Trophy, TrendingUp } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { AnalyticsActivityChart } from "@/components/user/analytics/AnalyticsActivityChart";
import { AnalyticsBadgesCard } from "@/components/user/analytics/AnalyticsBadgesCard";
import { AnalyticsStatCard } from "@/components/user/analytics/AnalyticsStatCard";
import { AnalyticsStreakCard } from "@/components/user/analytics/AnalyticsStreakCard";

type SummaryData = {
  documents?: { total?: number; pinned?: number };
  flashcards?: { total?: number; mastery_pct?: number };
  quizzes?: { attempts?: number; avg_score?: number };
  chat_sessions?: number;
};

type ActivityDatum = {
  day: string;
  quizzes: number;
};

type StreakData = {
  current_streak?: number;
  longest_streak?: number;
};

type BadgeData = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
};

export default function AnalyticsPage() {
  const { data: summaryData, isLoading } = useSWR("/analytics/summary", fetcher as any) as {
    data: { data?: SummaryData } | undefined;
    isLoading: boolean;
  };
  const { data: activityData } = useSWR("/analytics/activity", fetcher as any) as {
    data: { data?: ActivityDatum[] } | undefined;
  };
  const { data: streakData } = useSWR("/gamification/streak", fetcher as any) as {
    data: { data?: StreakData } | undefined;
  };
  const { data: badgesData } = useSWR("/gamification/badges", fetcher as any) as {
    data: { data?: BadgeData[] } | undefined;
  };

  const summary = summaryData?.data;
  const activity = activityData?.data || [];
  const streak = streakData?.data;
  const badges = badgesData?.data || [];
  const hasTodayActivity = activity.slice(-7).some((item) => item.quizzes > 0);

  const statCards = [
    {
      label: "Tai lieu",
      value: summary?.documents?.total || 0,
      sublabel: `${summary?.documents?.pinned || 0} da ghim`,
      icon: BookOpen,
      iconClassName: "text-sky-600 dark:text-sky-300",
      iconShellClassName: "border-sky-500/20 bg-sky-500/10",
      accentClassName: "text-sky-500",
    },
    {
      label: "Flashcard",
      value: summary?.flashcards?.total || 0,
      sublabel: `${Math.round(summary?.flashcards?.mastery_pct || 0)}% mastery`,
      icon: Brain,
      iconClassName: "text-violet-600 dark:text-violet-300",
      iconShellClassName: "border-violet-500/20 bg-violet-500/10",
      accentClassName: "text-violet-500",
    },
    {
      label: "Quiz",
      value: summary?.quizzes?.attempts || 0,
      sublabel: `Diem TB ${Math.round(summary?.quizzes?.avg_score || 0)}%`,
      icon: Trophy,
      iconClassName: "text-amber-600 dark:text-amber-300",
      iconShellClassName: "border-amber-500/20 bg-amber-500/10",
      accentClassName: "text-amber-500",
    },
    {
      label: "Phien chat",
      value: summary?.chat_sessions || 0,
      sublabel: "Tuong tac cung AI",
      icon: MessageSquare,
      iconClassName: "text-emerald-600 dark:text-emerald-300",
      iconShellClassName: "border-emerald-500/20 bg-emerald-500/10",
      accentClassName: "text-emerald-500",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="relative overflow-hidden border-b border-border/60 px-4 pb-6 pt-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_26%)] dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_24%)]" />
        <div className="relative flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-background/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Sprint 2 Progress Center
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              Learning Analytics
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Theo doi nhip hoc, streak va cac huy hieu ban dang mo khoa tren Mindex.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 pb-20 md:px-8">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_2fr]">
          <AnalyticsStreakCard
            currentStreak={streak?.current_streak || 0}
            longestStreak={streak?.longest_streak || 0}
            hasActivity={hasTodayActivity}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-[156px] animate-pulse rounded-xl border border-border/60 bg-muted/30" />
                ))
              : statCards.map((stat) => <AnalyticsStatCard key={stat.label} {...stat} />)}
          </div>
        </div>

        <AnalyticsActivityChart activity={activity} />
        <AnalyticsBadgesCard badges={badges} />
      </div>
    </div>
  );
}
