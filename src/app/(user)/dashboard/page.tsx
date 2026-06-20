"use client";

import { FileText, MessageSquare, Mail, ThumbsUp, ThumbsDown } from "lucide-react";
import useSWR from "swr";
import { useDashboardStore } from "@/store/useDashboardStore";
import { fetchDashboardMetrics } from "@/lib/api/dashboard";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { ViewModeToggle } from "@/components/dashboard/ViewModeToggle";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { TopDocuments } from "@/components/dashboard/TopDocuments";
import { TopChats } from "@/components/dashboard/TopChats";
import { DetailedView } from "@/components/dashboard/DetailedView";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";

export default function DashboardPage() {
  const { period, viewMode } = useDashboardStore();

  const { data, isLoading } = useSWR(
    [`/dashboard/metrics`, period],
    () => fetchDashboardMetrics(period),
  );

  const metrics = data?.data;
  const isEmpty =
    !isLoading &&
    metrics &&
    metrics.document_count === 0 &&
    metrics.chat_count === 0 &&
    metrics.message_count === 0;

  const cards = [
    {
      label: "Tài liệu",
      value: metrics?.document_count ?? 0,
      icon: FileText,
      iconClassName: "text-sky-600 dark:text-sky-300",
      iconBgClassName: "border border-sky-500/20 bg-sky-500/10",
    },
    {
      label: "Phiên chat",
      value: metrics?.chat_count ?? 0,
      icon: MessageSquare,
      iconClassName: "text-emerald-600 dark:text-emerald-300",
      iconBgClassName: "border border-emerald-500/20 bg-emerald-500/10",
    },
    {
      label: "Tin nhắn",
      value: metrics?.message_count ?? 0,
      icon: Mail,
      iconClassName: "text-violet-600 dark:text-violet-300",
      iconBgClassName: "border border-violet-500/20 bg-violet-500/10",
    },
    {
      label: "Hài lòng",
      value: metrics?.positive_feedback ?? 0,
      icon: ThumbsUp,
      iconClassName: "text-amber-600 dark:text-amber-300",
      iconBgClassName: "border border-amber-500/20 bg-amber-500/10",
    },
    {
      label: "Chưa hài lòng",
      value: metrics?.negative_feedback ?? 0,
      icon: ThumbsDown,
      iconClassName: "text-rose-600 dark:text-rose-300",
      iconBgClassName: "border border-rose-500/20 bg-rose-500/10",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="border-b border-border/60 px-4 py-6 md:px-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Trang chủ
            </h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan hoạt động học tập của bạn trên Mindex
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter />
            <ViewModeToggle />
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 pb-20 md:px-8">
        {isEmpty ? (
          <EmptyDashboard />
        ) : viewMode === "detailed" ? (
          <DetailedView />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {cards.map((card) => (
                <MetricCard key={card.label} {...card} isLoading={isLoading} />
              ))}
            </div>

            <ActivityChart />

            <div className="grid gap-6 lg:grid-cols-2">
              <TopDocuments />
              <TopChats />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
