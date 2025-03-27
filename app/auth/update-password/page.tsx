"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { createBrowserClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isResetSession, setIsResetSession] = useState(false);
  const { updatePassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  // Check if this is a valid password reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // If there's no session or the user isn't in a recovery state, redirect to login
        if (!data.session || !data.session.user) {
          router.push('/auth/login');
          return;
        }
        
        // Check for the recovery email
        const { user } = data.session;
        setIsResetSession(true);
        
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/auth/login');
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [router, supabase.auth]);

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
      const { error } = await updatePassword(password);
      
      if (error) {
        setErrorMsg(error.message || "Failed to update password");
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your password has been successfully updated",
        });
        router.push("/");
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

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-center mb-6">Checking Session</h1>
          <LoadingSpinner />
        </Card>
      </div>
    );
  }

  if (!isResetSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-center mb-4">Invalid Session</h1>
          <p className="text-center mb-6 text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/auth/reset-password">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Update Your Password</h1>
        <p className="text-center mb-6 text-muted-foreground">
          Please enter your new password below.
        </p>
        
        {errorMsg && <ErrorMessage message={errorMsg} />}
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner /> : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}