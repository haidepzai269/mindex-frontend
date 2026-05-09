"use client";

import { useMemo, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi, fetcher } from "@/lib/api";
import { PlannerCreatePanel, type PlannerFormState } from "@/components/user/planner/PlannerCreatePanel";
import { PlannerEmptyState } from "@/components/user/planner/PlannerEmptyState";
import { PlannerOverview } from "@/components/user/planner/PlannerOverview";
import { PlannerPlanCard, type StudyPlan } from "@/components/user/planner/PlannerPlanCard";

type ReadyDocument = {
  id: string;
  title: string;
  status: string;
};

export default function PlannerPage() {
  const { data: plansData, mutate } = useSWR("/study/plans", fetcher as any) as {
    data: { data?: StudyPlan[] } | undefined;
    mutate: () => void;
  };
  const { data: docsData } = useSWR("/documents", fetcher as any) as {
    data: { data?: ReadyDocument[] } | undefined;
  };

  const plans = plansData?.data || [];
  const docs = (docsData?.data || []).filter((doc) => doc.status === "ready");

  const [creating, setCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<PlannerFormState>({
    name: "",
    exam_date: "",
    doc_ids: [],
  });

  const overview = useMemo(() => {
    const urgentPlans = plans.filter((plan) => plan.days_left > 0 && plan.days_left <= 7).length;
    const dailyPages = plans.reduce((sum, plan) => sum + (plan.pages_per_day || 0), 0);

    return {
      totalPlans: plans.length,
      readyDocs: docs.length,
      urgentPlans,
      dailyPages,
    };
  }, [docs.length, plans]);

  const resetForm = () => {
    setForm({ name: "", exam_date: "", doc_ids: [] });
  };

  const handleCreate = async () => {
    if (!form.name || !form.exam_date || form.doc_ids.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi("/study/plans", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Đã tạo kế hoạch học tập!");
      mutate();
      setCreating(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo kế hoạch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetchApi(`/study/plans/${id}`, { method: "DELETE" });
    mutate();
    toast.success("Đã xóa kế hoạch");
  };

  const toggleDoc = (id: string) => {
    setForm((prev) => ({
      ...prev,
      doc_ids: prev.doc_ids.includes(id)
        ? prev.doc_ids.filter((value) => value !== id)
        : [...prev.doc_ids, id],
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="relative overflow-hidden border-b border-border/60 px-4 pb-6 pt-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_22%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-background/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Sprint 2 Study Planner
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Study Planner</h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Gom tài liệu, chốt deadline và để Mindex tính cường độ ôn tập mỗi ngày cho bạn.
              </p>
            </div>
          </div>

          <Button onClick={() => setCreating(true)} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            Kế hoạch mới
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 pb-20 md:px-8">
        <PlannerOverview {...overview} />

        {creating ? (
          <PlannerCreatePanel
            docs={docs}
            form={form}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setCreating(false);
              resetForm();
            }}
            onCreate={handleCreate}
            onToggleDoc={toggleDoc}
            onChange={setForm}
          />
        ) : null}

        {plans.length === 0 && !creating ? (
          <PlannerEmptyState onCreate={() => setCreating(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlannerPlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
