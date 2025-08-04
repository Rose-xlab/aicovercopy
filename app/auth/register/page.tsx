// project/app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const { signUp, signInWithProvider } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Validate password match
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(email, password);

      if (error) {
        setErrorMsg(error.message || "Registration failed");
        toast({
          title: "Error",
          description: error.message || "Registration failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });
        router.push("/auth/login");
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
        setErrorMsg(error.message || "Failed to sign up with Google");
        toast({
          title: "Error",
          description: error.message || "Failed to sign up with Google",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
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
        <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>

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
              autoComplete="new-password"
              aria-label="Password"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !!socialLoading}
              required
              autoComplete="new-password"
              aria-label="Confirm password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !!socialLoading}
          >
            {loading ? <LoadingSpinner /> : "Register"}
          </Button>
        </form>

        <div className="relative mt-6 mb-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading || !!socialLoading}
        >
          {socialLoading === "google" ? (
            <LoadingSpinner />
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </>
          )}
        </Button>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}