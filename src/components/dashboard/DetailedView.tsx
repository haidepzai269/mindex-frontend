"use client";

import useSWR from "swr";
import Link from "next/link";
import { useDashboardStore } from "@/store/useDashboardStore";
import { fetchDashboardMetrics, fetchDashboardHighlights } from "@/lib/api/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DetailedView() {
  const period = useDashboardStore((s) => s.period);

  const { data: metricsData, isLoading: metricsLoading } = useSWR(
    [`/dashboard/metrics`, period],
    () => fetchDashboardMetrics(period),
  );

  const { data: highlightsData, isLoading: highlightsLoading } = useSWR(
    [`/dashboard/highlights`, period],
    () => fetchDashboardHighlights(period),
  );

  const metrics = metricsData?.data;
  const highlights = highlightsData?.data;
  const isLoading = metricsLoading || highlightsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const metricRows = [
    { label: "Tài liệu", value: metrics?.document_count ?? 0 },
    { label: "Phiên chat", value: metrics?.chat_count ?? 0 },
    { label: "Tin nhắn", value: metrics?.message_count ?? 0 },
    { label: "Phản hồi tích cực", value: metrics?.positive_feedback ?? 0 },
    { label: "Phản hồi tiêu cực", value: metrics?.negative_feedback ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp số liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chỉ số</TableHead>
                <TableHead className="text-right">Giá trị</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricRows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right font-medium">
                    {row.value.toLocaleString("vi-VN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tài liệu hàng đầu</CardTitle>
          </CardHeader>
          <CardContent>
            {!highlights?.top_documents?.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên tài liệu</TableHead>
                    <TableHead className="text-right">Truy vấn</TableHead>
                    <TableHead className="text-right">Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highlights.top_documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Link href={`/doc/${doc.id}/chat`} className="hover:underline">
                          {doc.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{doc.query_count}</TableCell>
                      <TableCell className="text-right">{formatDate(doc.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phiên chat hàng đầu</CardTitle>
          </CardHeader>
          <CardContent>
            {!highlights?.top_chats?.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="text-right">Tin nhắn</TableHead>
                    <TableHead className="text-right">Ngày bắt đầu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highlights.top_chats.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell>
                        <Link href={`/chat/ai/${chat.id}`} className="hover:underline">
                          {chat.title || "Không tên"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{chat.message_count}</TableCell>
                      <TableCell className="text-right">{formatDate(chat.started_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
