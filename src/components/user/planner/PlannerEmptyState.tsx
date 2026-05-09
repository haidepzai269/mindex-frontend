"use client";

import { CalendarRange, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlannerEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-card/40 px-6 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-primary/20 bg-primary/10">
        <CalendarRange className="h-9 w-9 text-primary" />
      </div>
      <div className="mt-6 space-y-2">
        <h3 className="text-xl font-black tracking-tight text-foreground">Chưa có kế hoạch học tập nào</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Tạo một plan để Mindex tính số trang cần học mỗi ngày và giúp bạn nhìn rõ áp lực trước kỳ thi.
        </p>
      </div>
      <Button onClick={onCreate} className="mt-6">
        <Sparkles className="mr-2 h-4 w-4" />
        Tạo kế hoạch đầu tiên
      </Button>
    </div>
  );
}
