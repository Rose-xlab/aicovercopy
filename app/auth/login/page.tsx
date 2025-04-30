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
import { Github, Mail, Linkedin } from "lucide-react";
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
        router.push("/");
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

  const handleSocialLogin = async (
    provider: "google" | "github" | "linkedin"
  ) => {
    setErrorMsg("");
    setSocialLoading(provider);

    try {
      // Add specific scopes for LinkedIn
      const linkedInScopes =
        provider === "linkedin"
          ? ["r_liteprofile", "r_emailaddress"]
          : undefined;

      const { error } = await signInWithProvider(provider, {
        scopes: linkedInScopes,
      });

      if (error) {
        setErrorMsg(error.message || `Failed to login with ${provider}`);
        toast({
          title: "Login Error",
          description: error.message || `Failed to login with ${provider}`,
          variant: "destructive",
        });
      } else {
        // Optional: Add specific handling for LinkedIn
        if (provider === "linkedin") {
          toast({
            title: "LinkedIn Login",
            description: "Successfully logged in with LinkedIn",
          });
        }
      }
      // No need to redirect here as the OAuth provider will handle the redirect
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
              disabled={loading}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner /> : "Login"}
          </Button>
        </form>

        <div className="mt-4">
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

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin("linkedin")}
            disabled={!!socialLoading}
          >
            {socialLoading === "linkedin" ? (
              <LoadingSpinner />
            ) : (
              <>
                <Linkedin className="mr-2 h-4 w-4" />
                Continue with LinkedIn
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin("github")}
            disabled={!!socialLoading}
          >
            {socialLoading === "github" ? (
              <LoadingSpinner />
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin("google")}
            disabled={!!socialLoading}
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
        </div>

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
