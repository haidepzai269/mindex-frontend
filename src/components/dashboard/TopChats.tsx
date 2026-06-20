"use client";

import useSWR from "swr";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
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

export function TopChats() {
  const period = useDashboardStore((s) => s.period);
  const { data, isLoading } = useSWR(
    [`/dashboard/highlights`, period],
    () => fetchDashboardHighlights(period),
  );

  const chats = data?.data?.top_chats || [];

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
        <CardTitle>Phiên chat nổi bật</CardTitle>
      </CardHeader>
      <CardContent>
        {chats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có phiên chat nào
          </p>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/ai/${chat.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{chat.title || "Phiên chat không tên"}</p>
                  {chat.document_title && (
                    <p className="truncate text-xs text-muted-foreground">
                      {chat.document_title}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {chat.message_count} tin
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
