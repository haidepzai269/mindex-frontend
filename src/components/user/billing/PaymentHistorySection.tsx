"use client";

import { History, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PaymentEntry = {
  order_code: string | number;
  package_name: string;
  amount: number;
  status: string;
  created_at: string;
};

function statusClass(status: string) {
  if (status === "PAID") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  }

  if (status === "PENDING") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  }

  return "border-border bg-muted/30 text-muted-foreground";
}

export function PaymentHistorySection({ paymentHistory }: { paymentHistory: PaymentEntry[] }) {
  return (
    <Card className="border-border/60 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" />
          Lịch sử thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {paymentHistory.length > 0 ? (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Gói</TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="text-right">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((entry) => (
                    <TableRow key={String(entry.order_code)}>
                      <TableCell className="font-semibold text-foreground">
                        {entry.package_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">#{entry.order_code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {entry.amount.toLocaleString("vi-VN")}d
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={statusClass(entry.status)}>
                          {entry.status === "PAID" ? "Thành công" : entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {paymentHistory.map((entry) => (
                <div
                  key={String(entry.order_code)}
                  className="rounded-2xl border border-border/60 bg-background/55 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{entry.package_name}</p>
                          <p className="text-xs text-muted-foreground">#{entry.order_code}</p>
                        </div>
                        <Badge variant="outline" className={statusClass(entry.status)}>
                          {entry.status === "PAID" ? "Thành công" : entry.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString("vi-VN")}
                        </span>
                        <span className="font-semibold text-foreground">
                          {entry.amount.toLocaleString("vi-VN")}d
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">Chưa có giao dịch nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lịch sử thanh toán sẽ xuất hiện tại đây sau khi bạn nâng cấp gói.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
