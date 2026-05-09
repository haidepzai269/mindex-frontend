"use client";

import { Calendar, FileText, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type PlannerFormState = {
  name: string;
  exam_date: string;
  doc_ids: string[];
};

type ReadyDocument = {
  id: string;
  title: string;
};

type PlannerCreatePanelProps = {
  docs: ReadyDocument[];
  form: PlannerFormState;
  isSubmitting: boolean;
  onCancel: () => void;
  onCreate: () => void;
  onToggleDoc: (id: string) => void;
  onChange: (next: PlannerFormState) => void;
};

export function PlannerCreatePanel({
  docs,
  form,
  isSubmitting,
  onCancel,
  onCreate,
  onToggleDoc,
  onChange,
}: PlannerCreatePanelProps) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-card/85 shadow-sm backdrop-blur animate-in slide-in-from-top-2 duration-200">
      <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          Tạo kế hoạch mới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tên kế hoạch
            </label>
            <Input
              placeholder="VD: Ôn thi Giải tích chương 3"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="h-11 bg-background/70"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ngày thi
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={form.exam_date}
                onChange={(e) => onChange({ ...form, exam_date: e.target.value })}
                className="h-11 bg-background/70 pl-9"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Chọn tài liệu ôn thi
            </label>
            <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {form.doc_ids.length} đã chọn
            </span>
          </div>

          <ScrollArea className="h-52 rounded-2xl border border-border/60 bg-background/60 p-2">
            <div className="space-y-1">
              {docs.map((doc) => {
                const active = form.doc_ids.includes(doc.id);

                return (
                  <button
                    key={doc.id}
                    onClick={() => onToggleDoc(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all",
                      active
                        ? "border border-primary/20 bg-primary/10 text-foreground"
                        : "border border-transparent text-muted-foreground hover:border-border/60 hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                        active ? "border-primary/20 bg-primary/15 text-primary" : "border-border/60 bg-muted/30"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="flex-1 truncate font-medium">{doc.title}</span>
                    {active ? (
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Đã chọn</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onCreate} disabled={isSubmitting} className="min-w-40">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Tạo kế hoạch
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
