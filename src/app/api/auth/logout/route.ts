import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  
  // Xóa cả Access Token và Refresh Token
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  
  // Failsafe: ghi đè bằng giá trị rỗng và hết hạn ngay lập tức
  cookieStore.set("access_token", "", { maxAge: 0, path: "/" });
  cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" });
  
  return NextResponse.json({ success: true });
}
