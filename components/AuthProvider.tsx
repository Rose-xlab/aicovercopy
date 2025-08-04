// components/AuthProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { isDashboardPath, isPublicPath } from "../middleware.config";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Don't redirect on public paths
      if (isPublicPath(pathname || '')) {
        setIsChecking(false);
        return;
      }

      // Redirect to login if trying to access dashboard while not authenticated
      if (isDashboardPath(pathname || '') && !user) {
        router.push("/auth/login");
      }
      
      // Redirect to dashboard if trying to access auth pages while authenticated
      if (user && pathname?.startsWith("/auth") && pathname !== "/auth/callback") {
        router.push("/dashboard");
      }
      
      setIsChecking(false);
    }
  }, [user, loading, pathname, router]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}