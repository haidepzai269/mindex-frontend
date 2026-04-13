"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, fetchApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminBillingsPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: any }>("/admin/billings", fetcher as any);
  
  const [proPrice, setProPrice] = useState("");
  const [ultraPrice, setUltraPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Khởi tạo state giá khi tải xong data
  useEffect(() => {
    if (data?.data?.packages && !proPrice && !ultraPrice) {
      setProPrice(data.data.packages.PRO.toString());
      setUltraPrice(data.data.packages.ULTRA.toString());
    }
  }, [data, proPrice, ultraPrice]);

  const handleUpdatePrices = async () => {
    try {
      setIsUpdating(true);
      await fetchApi("/admin/billings/prices", {
        method: "POST",
        body: JSON.stringify({
          pro_price: parseInt(proPrice, 10),
          ultra_price: parseInt(ultraPrice, 10)
        })
      });
      toast.success("Đã cập nhật bảng giá");
      mutate();
    } catch (e) {
      toast.error("Lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
    }
  };

  const payments = data?.data?.payments || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Cấu hình Billings</h1>
        <p className="text-sm text-white/50">Quản lý giá gói nâng cấp và danh sách giao dịch nạp của người dùng.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-[#111115] border-white/10 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">💰 Cài đặt Bảng giá</CardTitle>
            <CardDescription className="text-white/40">Thiết lập giá trị nâng cấp cho các mệnh giá (VNĐ)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Giá gói PRO</label>
              <Input 
                type="number" 
                value={proPrice} 
                onChange={(e) => setProPrice(e.target.value)} 
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Giá gói ULTRA</label>
              <Input 
                type="number" 
                value={ultraPrice} 
                onChange={(e) => setUltraPrice(e.target.value)} 
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white"
              />
            </div>
            <Button onClick={handleUpdatePrices} disabled={isLoading || isUpdating} className="w-full bg-primary hover:bg-primary/90 text-white font-medium">
              {isUpdating ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111115] border-white/10 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Danh sách giao dịch nạp tiền</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-b border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/60">Tên người dùng</TableHead>
                  <TableHead className="text-white/60">Gói</TableHead>
                  <TableHead className="text-white/60">Mã GD (OrderCode)</TableHead>
                  <TableHead className="text-right text-white/60">Mệnh giá</TableHead>
                  <TableHead className="text-white/60 text-center">Trạng thái</TableHead>
                  <TableHead className="text-right text-white/60">Ngày giờ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableCell colSpan={6} className="h-24 text-center text-white/40">
                      Chưa có giao dịch nào
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p: any) => (
                    <TableRow key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-white/90">
                        {p.user_name}
                        <br/><span className="text-[10px] text-white/40">{p.user_email}</span>
                      </TableCell>
                      <TableCell>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                           p.package_name === 'PRO' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'
                         }`}>
                           {p.package_name}
                         </span>
                      </TableCell>
                      <TableCell className="text-white/60 text-xs font-mono">{p.order_code}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-400">{p.amount.toLocaleString()} đ</TableCell>
                      <TableCell className="text-center">
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                           p.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                         }`}>
                           {p.status}
                         </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-white/40">
                        {format(new Date(p.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
