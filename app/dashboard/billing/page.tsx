//project-bolt-sb1-guerg2d9\project\app\dashboard\billing\page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { CreditCard, Receipt, ArrowLeft, Clock, AlertTriangle, FileDown, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SubscriptionStatus as SubscriptionStatusType, SubscriptionTier } from '@/types/subscription';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import BillingPortalButton from '@/components/BillingPortalButton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BillingPage() {
  const { user, loading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const router = useRouter();
  
  // Fetch the user's subscription and usage data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/subscription');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        setSubscription(data);
        
        // Fetch invoices
        const invoicesResponse = await fetch('/api/user/invoices');
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData.invoices || []);
        }
        
        // Fetch usage data
        const usageResponse = await fetch('/api/user/usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageStats(usageData);
        }
      } catch (error: any) {
        console.error('Error fetching subscription data:', error);
        setError(error.message || 'Failed to load subscription information');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && !loading) {
      fetchSubscriptionData();
    } else if (!loading && !user) {
      router.push('/auth/login?redirect=/dashboard/billing');
    }
  }, [user, loading, router]);
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper to format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount / 100); // Stripe amounts are in cents
  };
  
  if (loading || isLoading) {
    return (
      <div className="container py-8 px-4 sm:px-6 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        </div>
        
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-8 px-4 sm:px-6 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="mt-6 flex justify-center">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 px-4 sm:px-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
      </div>
      
      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="subscription" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="space-y-6">
            {subscription && (
              <SubscriptionStatus 
                subscription={subscription} 
                usageStats={usageStats} 
              />
            )}
            
            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-teal-600" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Manage your payment method and billing details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription && subscription.tier !== 'FREE' ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center">
                        <div className="h-8 w-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md mr-3 flex items-center justify-center text-white text-xs font-bold">
                          CARD
                        </div>
                        <div>
                          <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                          <p className="text-xs text-gray-500">Expires 12/2025</p>
                        </div>
                      </div>
                      
                      <BillingPortalButton 
                        label="Update Payment Method" 
                        returnUrl={`${window.location.origin}/dashboard/billing`}
                        size="sm"
                        variant="outline"
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Your payment method will be charged automatically at the beginning of each billing period.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      You are currently on the Free plan. Upgrade to add a payment method.
                    </p>
                    <Button asChild className="bg-teal-600 hover:bg-teal-700">
                      <Link href="/pricing">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade Now
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Billing Actions */}
            {subscription && subscription.tier !== 'FREE' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Billing Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <BillingPortalButton 
                      label="Manage Subscription"
                      showIcon={true}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      returnUrl={`${window.location.origin}/dashboard/billing`}
                    />
                    
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/pricing">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Change Plan
                      </Link>
                    </Button>
                  </div>
                  
                  {subscription.cancelAtPeriodEnd && (
                    <div className="flex items-start p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Your subscription is scheduled to cancel</p>
                        <p className="text-xs text-muted-foreground">
                          You will lose access to premium features on {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}. 
                          You can reactivate your subscription from the Stripe Customer Portal.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Security & Privacy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-teal-600" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-3 text-muted-foreground">
                  <p>
                    We use Stripe for secure payment processing. Your payment information is never stored on our servers.
                  </p>
                  <p>
                    All transactions are encrypted and processed securely according to PCI DSS standards.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-teal-600" />
                Billing History
              </CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Description</th>
                          <th className="text-right py-3 px-2 text-sm font-medium">Amount</th>
                          <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
                          <th className="text-right py-3 px-2 text-sm font-medium">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b">
                            <td className="py-3 px-2 text-sm">
                              {formatDate(invoice.created_at)}
                            </td>
                            <td className="py-3 px-2 text-sm">
                              {invoice.description || `${subscription?.tier} Plan - ${subscription?.interval || 'Monthly'}`}
                            </td>
                            <td className="py-3 px-2 text-sm text-right">
                              {formatCurrency(invoice.amount)}
                            </td>
                            <td className="py-3 px-2 text-sm text-right">
                              <Badge variant={invoice.status === 'paid' ? 'success' : 'outline'}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-sm text-right">
                              {invoice.invoice_pdf && (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                  <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                                    <FileDown className="h-4 w-4" />
                                    <span className="sr-only">Download</span>
                                  </a>
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No invoices yet</p>
                  {subscription && subscription.tier === 'FREE' && (
                    <Button asChild className="mt-2 bg-teal-600 hover:bg-teal-700">
                      <Link href="/pricing">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade to Pro
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}