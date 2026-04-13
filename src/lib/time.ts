import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Định dạng thời gian sang dạng "cách đây x phút/giờ/ngày" bằng tiếng Việt.
 */
export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return "--";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Nếu thời gian cách đây hơn 7 ngày, hiển thị ngày tháng cụ thể
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays > 7) {
    return format(d, "dd/MM/yyyy", { locale: vi });
  }

  return formatDistanceToNow(d, { 
    addSuffix: true, 
    locale: vi 
  }).replace("khoảng ", "");
}

/**
 * Trả về chuỗi mô tả thời gian còn lại cho tài liệu sắp hết hạn.
 */
export function formatTimeLeft(expiredAt: string | null | undefined): string {
  if (!expiredAt) return "Vĩnh viễn";
  
  const now = new Date();
  const exp = new Date(expiredAt);
  const diff = exp.getTime() - now.getTime();
  
  if (diff <= 0) return "Đã hết hạn";
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  return `${minutes} phút`;
}
