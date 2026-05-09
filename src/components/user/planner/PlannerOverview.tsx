"use client";

import { BookOpen, CalendarClock, FolderKanban, TimerReset } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PlannerOverviewProps = {
  totalPlans: number;
  readyDocs: number;
  urgentPlans: number;
  dailyPages: number;
};

const metrics = [
  {
    key: "totalPlans",
    label: "Kế hoạch đang có",
    icon: FolderKanban,
    shell: "border-sky-500/20 bg-sky-500/10",
    iconClass: "text-sky-600 dark:text-sky-300",
  },
  {
    key: "readyDocs",
    label: "Tài liệu sẵn sàng",
    icon: BookOpen,
    shell: "border-violet-500/20 bg-violet-500/10",
    iconClass: "text-violet-600 dark:text-violet-300",
  },
  {
    key: "urgentPlans",
    label: "Sắp đến hạn",
    icon: CalendarClock,
    shell: "border-orange-500/20 bg-orange-500/10",
    iconClass: "text-orange-600 dark:text-orange-300",
  },
  {
    key: "dailyPages",
    label: "Trang mỗi ngày",
    icon: TimerReset,
    shell: "border-emerald-500/20 bg-emerald-500/10",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
] as const;

export function PlannerOverview({
  totalPlans,
  readyDocs,
  urgentPlans,
  dailyPages,
}: PlannerOverviewProps) {
  const values = {
    totalPlans,
    readyDocs,
    urgentPlans,
    dailyPages,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.key} className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardContent className="flex items-start justify-between gap-4 pt-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-3xl font-black tracking-tight text-foreground">
                  {values[metric.key]}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${metric.shell}`}>
                <Icon className={`h-5 w-5 ${metric.iconClass}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
