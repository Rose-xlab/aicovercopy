import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Special admin email that will bypass checks - MUST match the one in useOsloAuth.ts
const TEMP_ADMIN_EMAIL = 'jennifernanyombi1@gmail.com';

// This middleware protects routes and handles subscription checks
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
    
  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();
    
  // Protected routes - requiring authentication
  const authRoutes = [
    '/dashboard',
    '/api/user',
  ];
    
  // Admin routes - requiring admin privileges
  const adminRoutes = [
    '/oslo'
  ];

  // Get the pathname from the request
  const { pathname } = request.nextUrl;
    
  // Check if the route requires authentication
  const requiresAuth = authRoutes.some(route => pathname.startsWith(route));
    
  // Check if the route is an admin route (excluding login)
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route)) && 
                      pathname !== '/oslo/auth/login';
    
  // If the route requires auth and the user is not authenticated, redirect to login
  if (requiresAuth && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
    
  // If it's an admin route, check if user is an admin
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
        
    // For all other users, check if they are an admin
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
    
  // Pro feature routes - requiring subscription
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
    
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};