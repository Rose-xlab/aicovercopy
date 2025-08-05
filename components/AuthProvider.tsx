// components/AuthProvider.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  // Show a global loading spinner while the app is booting up
  // and fetching the initial user session.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Once loading is complete, render the rest of the application.
  // Route protection is now handled entirely by middleware.ts.
  return <>{children}</>;
}