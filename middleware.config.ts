//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\middleware.config.ts

import { NextRequest } from 'next/server';

// Define paths that are publicly accessible without authentication
export const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/update-password',
  '/',  // Making the homepage public
  '/api/job-parser' // Allow access to job parsing API endpoint for non-authenticated users
];

// Check if a path should be considered public
export function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  });
}

// Check if the path is a dashboard path (protected)
export function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}

// Determine if middleware should run for this request
export function shouldRunMiddleware(req: NextRequest): boolean {
  // Don't run middleware for static assets, images, etc.
  const { pathname } = req.nextUrl;
  
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/static')
  ) {
    return false;
  }
  
  return true;
}