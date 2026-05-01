"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText, Globe, Star, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuotaSection() {
  const quota = useAuthStore((state) => state.quota);

  const pinnedUsed = quota?.pinnedCount ?? quota?.pinnedDocs ?? 0;
  const pinnedMax = quota?.maxPins ?? quota?.pinnedDocsLimit ?? 3;
  const publicUsed = quota?.publicDocs ?? 0;
  const publicMax = quota?.publicDocsLimit ?? 3;

  const pinnedPercent = Math.min((pinnedUsed / pinnedMax) * 100, 100);
  const publicPercent = Math.min((publicUsed / publicMax) * 100, 100);

  return (
    <div className="space-y-6">
      <QuotaCard
        title="Hạn mức Pin tài liệu"
        description="Tài liệu được ghim sẽ được lưu trữ vĩnh viễn và không bị xóa tự động."
        icon={<Star className="text-amber-500" size={20} />}
        label="Tổng số tài liệu đã ghim"
        value={pinnedUsed}
        max={pinnedMax}
        percent={pinnedPercent}
        barClass={pinnedPercent >= 100 ? "bg-amber-500" : "bg-primary"}
        hint="Mẹo: Bạn có thể nhận thêm slot pin bằng cách tham gia đóng góp tài liệu vào thư viện chung và nhận upvote."
        hintClass="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        labelIcon={<FileText size={16} className="text-primary" />}
      />

      <QuotaCard
        title="Hạn mức Chia sẻ công khai"
        description="Chia sẻ tài liệu hay để xây dựng cộng đồng học tập văn minh."
        icon={<Globe className="text-emerald-500" size={20} />}
        label="Tài liệu đang công khai"
        value={publicUsed}
        max={publicMax}
        percent={publicPercent}
        barClass={publicPercent >= 100 ? "bg-cyan-500" : "bg-emerald-500"}
        labelIcon={<Globe size={16} className="text-emerald-500" />}
      />
    </div>
  );
}

function QuotaCard({
  title,
  description,
  icon,
  label,
  value,
  max,
  percent,
  barClass,
  hint,
  hintClass,
  labelIcon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  percent: number;
  barClass: string;
  hint?: string;
  hintClass?: string;
  labelIcon: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {labelIcon}
              <span>{label}</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {value} <span className="font-normal text-muted-foreground">/ {max}</span>
            </span>
          </div>

          <div className="h-4 w-full overflow-hidden rounded-full border border-border bg-muted p-[2px]">
            <div className={cn("relative h-full rounded-full transition-all duration-1000 ease-out", barClass)} style={{ width: `${percent}%` }}>
              <div className="absolute inset-0 h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/20" />
            </div>
          </div>

          {hint ? (
            <div className={cn("flex gap-2 rounded-xl border p-3 text-[11px] leading-normal", hintClass)}>
              <Info size={16} className="shrink-0" />
              <span>{hint}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
