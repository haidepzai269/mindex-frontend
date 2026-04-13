import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes require authentication
const protectedRoutes = ['/library', '/upload', '/community', '/settings', '/doc'];
const authRoutes = ['/login', '/register'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('access_token')?.value || request.headers.get('cookie')?.split('access_token=')[1]?.split(';')[0];
  const refreshToken = request.cookies.get('refresh_token')?.value || request.headers.get('cookie')?.split('refresh_token=')[1]?.split(';')[0];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // 1. Admin route logic (DEBUG MODE)
  if (isAdminRoute) {
    if (!token && !refreshToken) {
      const response = NextResponse.redirect(new URL('/login?next=' + pathname, request.url));
      response.headers.set('x-mw-debug', 'admin-no-tokens');
      return response;
    }
    
    // Nếu có bất kỳ token nào, cho qua để kiểm chứng middleware có thấy cookie không
    const res = NextResponse.next();
    res.headers.set('x-mw-debug', `admin-token-found-len-${token?.length || 0}`);
    return res;
  }

  // 2. Protected routes logic (DEBUG MODE)
  if (isProtectedRoute && !token && !refreshToken) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('x-mw-debug', 'protected-no-tokens');
    return response;
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

