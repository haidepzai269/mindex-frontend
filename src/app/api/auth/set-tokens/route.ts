import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token, remember_me } = await request.json();
    const cookieStore = await cookies();

    const isProd = process.env.NODE_ENV === 'production';
    const domain = isProd ? 'mindex.io.vn' : undefined;

    // Set MaxAge: 10 ngày nếu remember_me, ngược lại 7 ngày
    const refreshMaxAge = remember_me ? 10 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    if (access_token) {
      cookieStore.set('access_token', access_token, {
        httpOnly: false, 
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
        maxAge: refreshMaxAge
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to set cookies' }, { status: 500 });
  }
}
