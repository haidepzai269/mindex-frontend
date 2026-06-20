"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  isLoading?: boolean;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconBgClassName,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 px-4 py-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconBgClassName
          )}
        >
          <Icon className={cn("h-5 w-5", iconClassName)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value.toLocaleString("vi-VN")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
