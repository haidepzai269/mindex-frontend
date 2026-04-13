"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Progress } from "@/components/ui/progress";
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
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Star className="text-amber-500" size={20} />
            Hạn mức Pin tài liệu
          </CardTitle>
          <CardDescription className="text-white/50">
            Tài liệu được ghim sẽ được lưu trữ vĩnh viễn và không bị xóa tự động.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
               <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <FileText size={16} className="text-primary" />
                  <span>Tổng số tài liệu đã ghim</span>
               </div>
               <span className="text-lg font-bold text-white">{pinnedUsed} <span className="text-white/20 font-normal">/ {pinnedMax}</span></span>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/10">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                  pinnedPercent >= 100 ? "bg-primary-gradient shadow-[0_0_20px_rgba(184,41,255,0.4)]" : "bg-primary/60"
                )}
                style={{ width: `${pinnedPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
            <div className="flex gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-400 leading-normal">
               <Info size={16} className="shrink-0" />
               <span>Mẹo: Bạn có thể nhận thêm Slot Pin bằng cách tham gia đóng góp tài liệu vào Thư viện chung và nhận upvote từ sinh viên khác.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Globe className="text-secondary" size={20} />
            Hạn mức Chia sẻ công khai
          </CardTitle>
          <CardDescription className="text-white/50">
            Chia sẻ tài liệu hay để xây dựng cộng đồng học tập văn minh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
               <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Globe size={16} className="text-secondary" />
                  <span>Tài liệu đang công khai</span>
               </div>
               <span className="text-lg font-bold text-white">{publicUsed} <span className="text-white/20 font-normal">/ {publicMax}</span></span>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/10">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                  publicPercent >= 100 ? "bg-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-secondary/60"
                )}
                style={{ width: `${publicPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
