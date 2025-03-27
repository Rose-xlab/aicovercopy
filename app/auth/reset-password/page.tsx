"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setErrorMsg(error.message || "Failed to send password reset email");
        toast({
          title: "Error",
          description: error.message || "Failed to send reset email",
          variant: "destructive",
        });
      } else {
        setIsSubmitted(true);
        toast({
          title: "Success",
          description: "Check your email for a password reset link",
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6">
          <Link href="/auth/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>
        
        {isSubmitted ? (
          <div className="text-center">
            <p className="mb-4">
              A password reset link has been sent to <strong>{email}</strong>.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Check your email and follow the instructions to reset your password.
              If you don't receive an email within a few minutes, check your spam folder.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center mb-6 text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <LoadingSpinner /> : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}