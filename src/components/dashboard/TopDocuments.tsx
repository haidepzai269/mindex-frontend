"use client";

import useSWR from "swr";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { fetchDashboardHighlights } from "@/lib/api/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function TopDocuments() {
  const period = useDashboardStore((s) => s.period);
  const { data, isLoading } = useSWR(
    [`/dashboard/highlights`, period],
    () => fetchDashboardHighlights(period),
  );

  const docs = data?.data?.top_documents || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài liệu nổi bật</CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có tài liệu nào
          </p>
        ) : (
          <div className="space-y-1">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/doc/${doc.id}/chat`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">{doc.title}</span>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {doc.query_count} truy vấn
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
