"use client";

import { BookOpen, Calendar, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StudyPlan = {
  id: string;
  name: string;
  exam_date: string;
  days_left: number;
  total_pages: number;
  pages_per_day: number;
  doc_ids?: string[];
};

type PlannerPlanCardProps = {
  plan: StudyPlan;
  onDelete: (id: string) => void;
};

function getUrgency(plan: StudyPlan) {
  if (plan.days_left <= 0) {
    return {
      badge: "Đã qua",
      badgeClass: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
      accent: "text-red-600 dark:text-red-300",
      progress: 100,
    };
  }

  if (plan.days_left <= 3) {
    return {
      badge: "Cần ưu tiên",
      badgeClass: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
      accent: "text-red-600 dark:text-red-300",
      progress: 92,
    };
  }

  if (plan.days_left <= 7) {
    return {
      badge: "Sắp đến hạn",
      badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-300",
      accent: "text-orange-600 dark:text-orange-300",
      progress: 68,
    };
  }

  return {
    badge: "Ổn định",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    accent: "text-emerald-600 dark:text-emerald-300",
    progress: Math.min(52, Math.max(18, plan.pages_per_day * 4)),
  };
}

export function PlannerPlanCard({ plan, onDelete }: PlannerPlanCardProps) {
  const urgency = getUrgency(plan);

  return (
    <Card className="group overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60" />
      <CardContent className="space-y-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold tracking-tight text-foreground">{plan.name}</h3>
              <Badge variant="outline" className={urgency.badgeClass}>
                {urgency.badge}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(plan.exam_date).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>

          <button
            onClick={() => onDelete(plan.id)}
            className="rounded-xl p-2 text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
            title="Xóa kế hoạch"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border/60 bg-muted/25 p-3 text-center">
            <p className={cn("text-2xl font-black tracking-tight", urgency.accent)}>{plan.days_left}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ngày còn</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/25 p-3 text-center">
            <p className="text-2xl font-black tracking-tight text-foreground">{plan.total_pages}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trang</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/25 p-3 text-center">
            <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-300">{plan.pages_per_day}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mỗi ngày</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">Cường độ ôn tập</span>
            <span className={cn("text-xs font-semibold uppercase tracking-[0.18em]", urgency.accent)}>
              {urgency.badge}
            </span>
          </div>
          <Progress value={urgency.progress} />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{plan.doc_ids?.length || 0} tài liệu trong kế hoạch</span>
        </div>
      </CardContent>
    </Card>
  );
}
