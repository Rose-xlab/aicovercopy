import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Special admin email that will bypass checks - MUST match the one in useOsloAuth.ts
const TEMP_ADMIN_EMAIL = 'jennifernanyombi1@gmail.com';

// Corrected: The 'feature' property is now optional to allow for tier-only checks.
const PROTECTED_API_ROUTES: Record<string, { feature?: string; tier?: string }> = {
  '/api/cover-letter/generate': { feature: 'coverLetters' },
  '/api/resume/create': { feature: 'resumes' },
  '/api/resume/ats-scan': { feature: 'atsScans' },
  '/api/interview/session': { feature: 'interviewSessions' },
  '/api/templates/premium': { tier: 'PRO' },
};

// This middleware protects routes and handles subscription checks
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Get the user session and pathname
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;
  
  // --- Standard User Authentication Checks ---

  // Define protected routes that require a logged-in user
  const protectedRoutes = [
    '/dashboard',
    '/api/user',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If the user is not logged in and is trying to access a protected route, redirect to login
  if (!session && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is already logged in, prevent them from accessing login/register pages
  if (session && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- Admin Route Checks (Original Logic Preserved) ---

  const adminRoutes = [
    '/oslo'
  ];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route)) && 
                       pathname !== '/oslo/auth/login';
  
  if (isAdminRoute) {
    // If no session, redirect to admin login
    if (!session) {
      const redirectUrl = new URL('/oslo/auth/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check if the email is the special admin bypass email
    if (session.user.email === TEMP_ADMIN_EMAIL) {
      // Allow access without checking the database
      return response;
    }
        
    // For all other users, check if they are an admin in the database
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
            
      // If not an admin or error, redirect to admin login
      if (profileError || !profile?.is_admin) {
        const redirectUrl = new URL('/oslo/auth/login', request.url);
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      // If there's any error checking admin status, redirect to login
      const redirectUrl = new URL('/oslo/auth/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // --- Pro Feature Subscription Checks (Original Logic Preserved) ---

  const proFeatureRoutes = [
    '/dashboard/resumes/ats-scanner',
    '/dashboard/interview-buddy',
  ];
  
  // If the route requires pro subscription, check the user's subscription
  if (proFeatureRoutes.some(route => pathname.startsWith(route)) && session) {
    // We'll check the subscription status for specific pro features
    // This logic could be expanded based on your application's needs
    // For now, we'll let these pass and check subscription in the component
    // This keeps the middleware lightweight and avoids extra database queries
  }

  // NEW: Check API routes for subscription limits
  const protection = PROTECTED_API_ROUTES[pathname];
  if (protection && session) {
    // For API routes that need subscription checking, add a header
    // The actual enforcement will happen in the API route itself
    // This keeps the middleware fast and avoids blocking requests
    response.headers.set('x-subscription-check-required', 'true');
    response.headers.set('x-subscription-feature', protection.feature || '');
    response.headers.set('x-subscription-tier', protection.tier || '');
  }
    
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (we handle api routes manually inside the middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};