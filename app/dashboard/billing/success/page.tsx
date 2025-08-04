"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ArrowRight } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-client"

export default function SubscriptionSuccessPage() {
  const { user, loading } = useAuth();
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get session ID from query parameters
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/auth/login?redirect=/dashboard/billing/success');
      return;
    }
    
    // Verify the checkout session
    const verifySession = async () => {
      if (!sessionId) {
        setError('Missing session ID');
        setVerifyingSession(false);
        return;
      }
      
      try {
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify session');
        }
        
        const data = await response.json();
        setSessionData(data.session);
      } catch (error: any) {
        console.error('Error verifying session:', error);
        setError(error.message || 'Failed to verify your subscription');
      } finally {
        setVerifyingSession(false);
      }
    };
    
    if (user && sessionId) {
      verifySession();
    } else if (user && !sessionId) {
      setError('Missing session ID');
      setVerifyingSession(false);
    }
  }, [user, loading, sessionId, router]);
  
  if (loading || verifyingSession) {
    return (
      <div className="container max-w-lg py-12 px-4">
        <div className="flex justify-center py-16">
          <div className="text-center">
            <LoadingSpinner className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying your subscription...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-lg py-12 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Subscription verification failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              We couldn't verify your subscription status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              There was a problem verifying your subscription. This could happen for a few reasons:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-4 text-sm">
              <li>The checkout session has expired</li>
              <li>The payment was not completed</li>
              <li>Our system is experiencing temporary issues</li>
            </ul>
            <p className="text-sm">
              If you believe your payment was successful, please contact our support team.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/dashboard/billing">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Billing
              </Link>
            </Button>
            <Button 
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Determine subscription details from session data
  const tier = sessionData?.tier || 'PRO';
  const interval = sessionData?.interval || 'monthly';
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
  
  return (
    <div className="container max-w-lg py-12 px-4">
      <Card className="border-teal-200">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto rounded-full bg-teal-100 p-3 w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
          <CardDescription>
            Your {plan?.name} plan is now active
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <div className="bg-teal-50 rounded-lg border border-teal-100 p-4 mb-6">
            <h3 className="font-medium text-teal-800 mb-2">Subscription Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{plan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing:</span>
                <span className="font-medium">
                  {interval === 'monthly' ? 'Monthly' : 
                   interval === 'quarterly' ? 'Quarterly' : 'Annually'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">
                  ${plan?.price[interval as keyof typeof plan.price].toFixed(2)}/
                  {interval === 'monthly' ? 'month' : 
                   interval === 'quarterly' ? 'quarter' : 'year'}
                </span>
              </div>
            </div>
          </div>
          
          <h3 className="font-medium mb-3">You now have access to:</h3>
          <ul className="space-y-2 mb-6">
            {plan?.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <p className="text-sm text-center text-muted-foreground">
            You can manage your subscription at any time from your billing dashboard.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            asChild
          >
            <Link href="/dashboard/billing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Billing Dashboard
            </Link>
          </Button>
          <Button 
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
            asChild
          >
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}