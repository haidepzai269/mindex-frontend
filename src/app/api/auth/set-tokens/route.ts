import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json();
    const cookieStore = await cookies();

    const isProd = process.env.NODE_ENV === 'production';
    const domain = isProd ? 'mindex.io.vn' : undefined;

    if (access_token) {
      cookieStore.set('access_token', access_token, {
        httpOnly: false, // Cần cho Frontend đọc để gửi Authorization header tới Backend (khác domain)
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        domain: domain,
        maxAge: 3600 // 1 hour
      });
    }

    if (refresh_token) {
      cookieStore.set('refresh_token', refresh_token, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        domain: domain,
        maxAge: 604800 // 7 days
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to set cookies' }, { status: 500 });
  }
}
