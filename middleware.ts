import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { shouldRunMiddleware, isPublicPath, isDashboardPath } from './middleware.config';

export async function middleware(req: NextRequest) {
  // Check if middleware should run for this request
  if (!shouldRunMiddleware(req)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // This refreshes the session if needed and gets the session
  const { data: { session } } = await supabase.auth.getSession();
  
  const { pathname } = req.nextUrl;
  
  // If trying to access dashboard without authentication, redirect to login
  if (isDashboardPath(pathname) && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If authenticated and trying to access auth pages, redirect to dashboard
  if (session && pathname.startsWith('/auth') && pathname !== '/auth/callback') {
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

// Define which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};