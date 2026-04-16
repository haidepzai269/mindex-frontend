import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes require authentication
const protectedRoutes = ['/library', '/upload', '/community', '/settings', '/doc'];
const authRoutes = ['/login', '/register'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const cookieHeader = request.headers.get('cookie') || '';
  const token = request.cookies.get('access_token')?.value || 
                cookieHeader.split('access_token=')[1]?.split(';')[0];
  const refreshToken = request.cookies.get('refresh_token')?.value || 
                       cookieHeader.split('refresh_token=')[1]?.split(';')[0];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_jwt_key_change_me');

  // 1. Admin route: verify JWT role = 'admin'
  if (isAdminRoute) {
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/login?next=' + pathname, request.url));
    }

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        if (payload.role !== 'admin') {
          return NextResponse.redirect(new URL('/?error=no_access', request.url));
        }
        return NextResponse.next();
      } catch (err) {
        // Token invalid/expired, handle with refresh token if exists
        if (refreshToken) return NextResponse.next();
        return NextResponse.redirect(new URL('/login?next=' + pathname, request.url));
      }
    } else {
      // Only refresh token exists, allow to proceed for client-side refresh
      return NextResponse.next();
    }
  }

  // 2. Protected routes logic
  if (isProtectedRoute) {
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/login?next=' + pathname, request.url));
    }

    if (token) {
      try {
        await jwtVerify(token, secret);
      } catch (err) {
        if (!refreshToken) {
          return NextResponse.redirect(new URL('/login?next=' + pathname, request.url));
        }
      }
    }
  }

  // 3. Redirect to library if accessing login/register while ALREADY having access_token
  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL('/library', request.url));
    } catch (err) {
      // Token is invalid/expired, let them stay on login/register to re-auth
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};

