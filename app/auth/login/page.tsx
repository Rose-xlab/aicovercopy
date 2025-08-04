// project/app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const { signIn, signInWithProvider } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setErrorMsg(
          error.message || "Login failed. Please check your credentials."
        );
        toast({
          title: "Error",
          description: error.message || "Login failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "You've been logged in successfully",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSocialLoading("google");

    try {
      const redirectUrl = `${window.location.origin}/api/auth/callback`;

      const { error } = await signInWithProvider("google", {
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to login with Google");
        toast({
          title: "Login Error",
          description: error.message || "Failed to login with Google",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      toast({
        title: "Unexpected Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        {errorMsg && <ErrorMessage message={errorMsg} />}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!socialLoading}
              required
              autoComplete="email"
              aria-label="Email address"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !!socialLoading}
              required
              autoComplete="current-password"
              aria-label="Password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !!socialLoading}
          >
            {loading ? <LoadingSpinner /> : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/auth/reset-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="relative mt-6 mb-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          onClick={handleGoogleLogin}
          disabled={loading || !!socialLoading}
        >
          {socialLoading === "google" ? (
            <LoadingSpinner />
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}