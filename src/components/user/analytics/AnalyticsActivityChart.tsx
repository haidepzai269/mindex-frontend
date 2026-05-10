"use client";

import { Activity, BarChart3 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityDatum = {
  day: string;
  quizzes: number;
};

const chartConfig = {
  quizzes: {
    label: "Quiz",
    theme: {
      light: "#0f766e",
      dark: "#5eead4",
    },
  },
} satisfies ChartConfig;

export function AnalyticsActivityChart({
  activity,
}: {
  activity: ActivityDatum[];
}) {
  if (activity.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            Hoạt động 30 ngày gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30">
            <Activity className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-foreground">
              Chưa có dữ liệu hoạt động
            </p>
            <p className="text-sm text-muted-foreground">
              Hoàn thành quiz để Mindex bắt đầu về nhịp học tập của bạn.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" />
          Hoạt động quiz 30 ngày gần nhất
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={activity} margin={{ left: -18, right: 8, top: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={18}
              tickFormatter={(value: string) => value.slice(5)}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Ngày ${value}`}
                />
              }
            />
            <Area
              dataKey="quizzes"
              type="monotone"
              stroke="var(--color-quizzes)"
              fill="var(--color-quizzes)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
