// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The actual auth callback is handled by the API route
    // This page just shows a loading state
    const timer = setTimeout(() => {
      router.push("/");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8">Processing authentication...</h1>
      <LoadingSpinner />
    </div>
  );
}