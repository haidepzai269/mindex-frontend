"use client";

import { FileUp, MessageSquare } from "lucide-react";
import Link from "next/link";

export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Chưa có hoạt động nào</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bắt đầu tải tài liệu lên hoặc trò chuyện với AI để xem thống kê tại đây.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <FileUp className="h-4 w-4" />
          Tải tài liệu
        </Link>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <MessageSquare className="h-4 w-4" />
          Bắt đầu chat
        </Link>
      </div>
    </div>
  );
}
