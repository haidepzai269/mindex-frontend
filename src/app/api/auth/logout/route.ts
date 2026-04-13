import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.set("access_token", "", { maxAge: 0, path: "/" }); // Failsafe duplicate explicitly setting blank
  return NextResponse.json({ success: true });
}
