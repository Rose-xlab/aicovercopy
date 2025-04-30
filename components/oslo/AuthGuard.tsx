"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useOsloAuth } from '@/hooks/useOsloAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, isLoading } = useOsloAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip redirect if still loading or on the login page
    if (isLoading || pathname === '/oslo/auth/login') return;

    // If user is not authenticated and not on login page, redirect to login
    if (!user && pathname !== '/oslo/auth/login') {
      router.push('/oslo/auth/login');
    }
  }, [user, isLoading, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // If on login page or authenticated, render children
  if (pathname === '/oslo/auth/login' || user) {
    return <>{children}</>;
  }

  // This will briefly show before redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
      <span className="ml-2 text-gray-600">Redirecting...</span>
    </div>
  );
};