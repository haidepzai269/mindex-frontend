"use client";

import useSWR from "swr";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useDashboardStore } from "@/store/useDashboardStore";
import { fetchDashboardTrends } from "@/lib/api/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  chats: {
    label: "Phiên chat",
    color: "var(--chart-1)",
  },
  documents: {
    label: "Tài liệu",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ActivityChart() {
  const period = useDashboardStore((s) => s.period);
  const { data, isLoading } = useSWR(
    [`/dashboard/trends`, period],
    () => fetchDashboardTrends(period),
  );

  const trends = data?.data;
  const points = trends?.points || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng hoạt động</CardTitle>
          <CardDescription>Chưa có dữ liệu cho khoảng thời gian này</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Dữ liệu sẽ hiển thị khi bạn bắt đầu sử dụng Mindex
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupLabel = trends?.group_by === "month" ? "tháng" : trends?.group_by === "week" ? "tuần" : "ngày";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng hoạt động</CardTitle>
        <CardDescription>
          Số phiên chat và tài liệu theo {groupLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(v: string) => {
                if (trends?.group_by === "month") return v;
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="chats"
              type="monotone"
              fill="var(--color-chats)"
              fillOpacity={0.15}
              stroke="var(--color-chats)"
              strokeWidth={2}
            />
            <Area
              dataKey="documents"
              type="monotone"
              fill="var(--color-documents)"
              fillOpacity={0.15}
              stroke="var(--color-documents)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
