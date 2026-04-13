import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes require authentication
const protectedRoutes = ['/library', '/upload', '/community', '/settings', '/doc'];
const authRoutes = ['/login', '/register'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // 1. Admin route: verify JWT role = 'admin'
  if (isAdminRoute) {
    // Nếu hoàn toàn không có token nào, redirect về login
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/login?next=/admin/system', request.url));
    }

    // Nếu có access_token, kiểm tra tính hợp lệ và quyền admin
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'super_secret_jwt_key_change_me');
        const { payload } = await jwtVerify(token, secret);
        
        if (payload.role !== 'admin') {
          return NextResponse.redirect(new URL('/?error=no_access', request.url));
        }
        
        const res = NextResponse.next();
        res.headers.set('x-admin-email', (payload.email as string) ?? '');
        return res;
      } catch (err) {
        // Token hết hạn hoặc lỗi:
        // Nếu có refresh_token, cho phép đi tiếp để Client-side AdminApi thực hiện refresh
        if (refreshToken) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/login?next=/admin/system', request.url));
      }
    } else {
      // Không có access_token nhưng có refresh_token: Cho phép đi tiếp để Client-side refresh
      return NextResponse.next();
    }
  }

  // 2. Redirect to login if accessing a protected route without ANY token
  if (isProtectedRoute && !token && !refreshToken) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('x-middleware-debug', 'no-tokens');
    return response;
  }

  // Debug JWT payload if token exists
  if (token && (isProtectedRoute || isAdminRoute)) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_jwt_key_change_me');
      await jwtVerify(token, secret);
    } catch (err: any) {
      console.log(`[Middleware] JWT Verification failed: ${err.message}`);
      const response = NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
      response.headers.set('x-middleware-debug', `jwt-failed-${err.code || 'unknown'}`);
      return response;
    }
  }

  // 3. Redirect to library if accessing login/register while ALREADY having access_token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/library', request.url));
  }

  // 4. Allow and add debug header
  const response = NextResponse.next();
  if (isProtectedRoute) {
    response.headers.set('x-middleware-auth', token ? 'at-present' : (refreshToken ? 'rt-present' : 'none'));
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

