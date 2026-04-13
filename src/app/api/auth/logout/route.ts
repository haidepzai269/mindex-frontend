import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const domain = isProd ? 'mindex.io.vn' : undefined;
  
  const cookieOptions = {
    maxAge: 0,
    path: "/",
    domain: domain,
    secure: true,
    sameSite: 'lax' as const
  };

  // Xóa bằng cả delete() và set(maxAge: 0) với đầy đủ thuộc tính để đảm bảo trình duyệt chấp nhận
  cookieStore.delete({ name: "access_token", ...cookieOptions });
  cookieStore.delete({ name: "refresh_token", ...cookieOptions });
  
  cookieStore.set("access_token", "", cookieOptions);
  cookieStore.set("refresh_token", "", cookieOptions);
  
  return NextResponse.json({ success: true });
}
