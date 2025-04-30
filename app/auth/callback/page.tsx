"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createBrowserClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the code from the URL
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        try {
          // Exchange the code for a session
          await supabase.auth.exchangeCodeForSession(code);
          
          // Redirect to the home page
          router.push("/");
        } catch (error) {
          console.error("Error during auth callback:", error);
          router.push("/auth/login?error=Auth%20callback%20failed");
        }
      } else {
        // No code found, redirect to login
        router.push("/auth/login?error=No%20auth%20code%20found");
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8">Processing authentication...</h1>
      <LoadingSpinner />
    </div>
  );
}