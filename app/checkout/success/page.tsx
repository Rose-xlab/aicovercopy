"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function CheckoutSuccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  
  // Get the session ID from URL if present
  const sessionId = searchParams?.get('session_id');
  
  // Verify the checkout session was completed
  useEffect(() => {
    const verifyCheckout = async () => {
      if (!user || !sessionId) return;
      
      try {
        // Call the API to verify the session
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to verify checkout session');
        }
        
        // Session verified, update the UI
        setIsProcessing(false);
      } catch (error) {
        console.error('Error verifying checkout session:', error);
        // Even on error, we'll show success and let backend webhooks handle the rest
        setIsProcessing(false);
      }
    };
    
    // If not logged in after a short delay, redirect to login
    const checkUser = setTimeout(() => {
      if (!loading && !user) {
        router.push('/auth/login?redirect=/dashboard/billing');
      }
    }, 1500);
    
    if (user && sessionId) {
      verifyCheckout();
    } else if (user && !sessionId) {
      // If user is logged in but no session ID, they probably navigated here directly
      setIsProcessing(false);
    }
    
    return () => clearTimeout(checkUser);
  }, [user, sessionId, loading, router]);
  
  if (loading || (isProcessing && sessionId)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Processing Your Subscription</CardTitle>
            <CardDescription>Please wait while we verify your payment...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingSpinner className="h-12 w-12 text-teal-600" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-teal-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-base mt-2">
            Thank you for your subscription. Your account has been upgraded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-teal-50 p-4 border border-teal-100">
            <p className="text-sm text-teal-800">
              Your subscription is now active. You can start using all the premium features right away.
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID:</span>
            <span className="font-mono">{sessionId?.slice(0, 14)}...</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
            <Link href="/dashboard/billing">
              <FileText className="mr-2 h-4 w-4" />
              View Subscription Details
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}