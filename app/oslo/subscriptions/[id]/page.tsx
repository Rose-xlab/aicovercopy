"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Receipt,
  CircleDollarSign,
  Building
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SubscriptionDetailProps {
  // Add your props here
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [stripeData, setStripeData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  const subscriptionId = params.id as string;
  
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Important: Using the new query parameter approach
        const response = await fetch(`/api/oslo/subscriptions?id=${subscriptionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch subscription details');
        }
        
        const data = await response.json();
        setSubscription(data.subscription);
        setStripeData(data.stripeData);
        setInvoices(data.invoices || []);
      } catch (err: any) {
        console.error('Error fetching subscription details:', err);
        setError(err.message || 'An error occurred while fetching subscription details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (subscriptionId) {
      fetchSubscriptionDetails();
    }
  }, [subscriptionId]);
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (amount?: number, currency: string = 'USD') => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Stripe amounts are in cents
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return 0;
    
    const endDate = new Date(dateStr);
    const today = new Date();
    
    // Set times to midnight to just compare days
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    setActionInProgress(true);
    
    try {
      // Important: Using the new query parameter approach
      const response = await fetch(`/api/oslo/subscriptions?id=${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: true,
          updateStripe: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      
      // Update local state
      setSubscription((prev: any) => ({
        ...prev,
        cancel_at_period_end: true
      }));
      
      setShowCancelDialog(false);
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle subscription resumption (cancel the cancellation)
  const handleResumeSubscription = async () => {
    setActionInProgress(true);
    
    try {
      // Important: Using the new query parameter approach
      const response = await fetch(`/api/oslo/subscriptions?id=${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: false,
          updateStripe: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resume subscription');
      }
      
      // Update local state
      setSubscription((prev: any) => ({
        ...prev,
        cancel_at_period_end: false
      }));
    } catch (err: any) {
      console.error('Error resuming subscription:', err);
      setError(err.message || 'Failed to resume subscription');
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle period extension
  const handleExtendPeriod = async () => {
    if (!extendDays || extendDays < 1) {
      setError('Please enter a valid number of days');
      return;
    }
    
    setActionInProgress(true);
    
    try {
      // Important: Using the new query parameter approach
      const response = await fetch(`/api/oslo/subscriptions?id=${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extendPeriod: true,
          extendDays: extendDays
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extend subscription period');
      }
      
      const data = await response.json();
      
      // Update local state with the updated subscription
      setSubscription(data.subscription);
      setShowExtendDialog(false);
    } catch (err: any) {
      console.error('Error extending subscription period:', err);
      setError(err.message || 'Failed to extend subscription period');
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'past_due':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-8 w-8 mr-3" />
        <p className="text-lg">Loading subscription details...</p>
      </div>
    );
  }
  
  if (error || !subscription) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="outline"
          onClick={() => router.push('/oslo/subscriptions')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subscriptions
        </Button>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Subscription not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/oslo/subscriptions')}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subscriptions
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(subscription.status)} className="text-xs">
            {subscription.status.toUpperCase()}
          </Badge>
          
          {subscription.cancel_at_period_end && (
            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
              CANCELS AT PERIOD END
            </Badge>
          )}
        </div>
      </div>
      
      {/* Main subscription info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <CreditCard className="h-5 w-5 mr-2 text-teal-600" />
            Subscription Details
          </CardTitle>
          <CardDescription>
            Manage subscription for {subscription.user?.email || 'User'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Information */}
          <div className="bg-muted p-4 rounded-md">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-medium text-lg">
                {subscription.user?.first_name?.charAt(0) || subscription.user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-medium">
                  {subscription.user?.full_name || `${subscription.user?.first_name || ''} ${subscription.user?.last_name || ''}`.trim() || 'Unnamed User'}
                </h3>
                <p className="text-sm text-muted-foreground">{subscription.user?.email}</p>
                {subscription.user?.job_title && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Building className="h-3.5 w-3.5 mr-1" />
                    {subscription.user.job_title}
                  </p>
                )}
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/oslo/users/${subscription.user_id}`}>
                    <User className="h-4 w-4 mr-2" />
                    View User
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Subscription Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Plan Details</h3>
              
              <div className="grid grid-cols-2 gap-y-3">
                <div className="text-sm">Plan</div>
                <div className="text-sm font-medium">
                  <Badge
                    variant={subscription.plan_id === 'pro' ? 'default' : 'outline'}
                    className={
                      subscription.plan_id === 'pro' ? 'bg-teal-500' :
                      subscription.plan_id === 'business' ? 'border-purple-500 text-purple-500' : ''
                    }
                  >
                    {subscription.plan_id.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="text-sm">Billing Interval</div>
                <div className="text-sm font-medium">
                  {subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1)}
                </div>
                
                <div className="text-sm">Status</div>
                <div className="text-sm font-medium">
                  <Badge variant={getStatusBadgeVariant(subscription.status)}>
                    {subscription.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="text-sm">Created</div>
                <div className="text-sm font-medium">
                  {formatDate(subscription.created_at)}
                </div>
                
                <div className="text-sm">Last Updated</div>
                <div className="text-sm font-medium">
                  {formatDate(subscription.updated_at)}
                </div>
              </div>
            </div>
            
            {/* Current Period */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Current Period</h3>
              
              <div className="grid grid-cols-2 gap-y-3">
                <div className="text-sm">Started</div>
                <div className="text-sm font-medium">
                  {formatDate(subscription.current_period_start)}
                </div>
                
                <div className="text-sm">Ends</div>
                <div className="text-sm font-medium">
                  {formatDate(subscription.current_period_end)}
                </div>
                
                <div className="text-sm">Days Remaining</div>
                <div className="text-sm font-medium">
                  {getDaysRemaining(subscription.current_period_end)}
                </div>
                
                <div className="text-sm">Auto-Renew</div>
                <div className="text-sm font-medium">
                  {subscription.cancel_at_period_end ? (
                    <span className="text-red-600 flex items-center">
                      <Ban className="h-4 w-4 mr-1" />
                      No
                    </span>
                  ) : (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Yes
                    </span>
                  )}
                </div>
              </div>
              
              {subscription.cancel_at_period_end && (
                <Alert className="bg-amber-50 border-amber-200 mt-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-800">
                    This subscription will end on {formatDate(subscription.current_period_end)} and will not renew.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          {/* Stripe Information */}
          {stripeData && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Stripe Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="text-sm">Stripe ID</div>
                    <div className="text-sm font-medium font-mono text-muted-foreground">
                      {subscription.stripe_subscription_id}
                    </div>
                    
                    <div className="text-sm">Customer ID</div>
                    <div className="text-sm font-medium font-mono text-muted-foreground">
                      {subscription.stripe_customer_id}
                    </div>
                    
                    {stripeData.current_period_end && (
                      <>
                        <div className="text-sm">Next Bill</div>
                        <div className="text-sm font-medium">
                          {formatDate(new Date(stripeData.current_period_end * 1000).toISOString())}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {stripeData.items?.data?.[0]?.price && (
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="text-sm">Price</div>
                      <div className="text-sm font-medium">
                        {formatCurrency(
                          stripeData.items.data[0].price.unit_amount,
                          stripeData.items.data[0].price.currency.toUpperCase()
                        )}
                      </div>
                      
                      <div className="text-sm">Interval</div>
                      <div className="text-sm font-medium">
                        {stripeData.items.data[0].price.recurring?.interval_count || 1}{' '}
                        {stripeData.items.data[0].price.recurring?.interval || 'month'}{stripeData.items.data[0].price.recurring?.interval_count !== 1 ? 's' : ''}
                      </div>
                      
                      {stripeData.latest_invoice && (
                        <>
                          <div className="text-sm">Latest Invoice</div>
                          <div className="text-sm font-medium font-mono text-muted-foreground">
                            {stripeData.latest_invoice.id}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Invoices */}
          {invoices && invoices.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Recent Invoices</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-2 font-medium">Invoice</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b">
                          <td className="p-2 font-mono text-xs text-muted-foreground">
                            {invoice.stripe_invoice_id}
                          </td>
                          <td className="p-2">
                            {formatDate(invoice.created_at)}
                          </td>
                          <td className="p-2">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </td>
                          <td className="p-2">
                            <Badge
                              variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'open' ? 'outline' :
                                invoice.status === 'uncollectible' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {invoice.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtendDialog(true)}
              disabled={actionInProgress}
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              Extend Period
            </Button>
            
            {subscription.stripe_customer_id && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`https://dashboard.stripe.com/customers/${subscription.stripe_customer_id}`} target="_blank">
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  View in Stripe
                </Link>
              </Button>
            )}
          </div>
          
          <div>
            {subscription.cancel_at_period_end ? (
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                onClick={handleResumeSubscription}
                disabled={actionInProgress}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Resume Subscription
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                onClick={() => setShowCancelDialog(true)}
                disabled={actionInProgress || subscription.status === 'canceled'}
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription? The subscription will remain active until the end of the current billing period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 inline-block mr-2 text-amber-600" />
            This subscription will end on {formatDate(subscription.current_period_end)} and will not renew.
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                'Yes, Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Extend Period Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription Period</DialogTitle>
            <DialogDescription>
              This will extend the current billing period by the specified number of days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="extendDays">Number of Days</Label>
              <Input
                id="extendDays"
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
              <div>Current end date: <span className="font-medium">{formatDate(subscription.current_period_end)}</span></div>
              <div className="mt-1">
                New end date: <span className="font-medium">
                  {(() => {
                    const newDate = new Date(subscription.current_period_end);
                    newDate.setDate(newDate.getDate() + extendDays);
                    return formatDate(newDate.toISOString());
                  })()}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtendDialog(false)}
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendPeriod}
              disabled={actionInProgress || extendDays < 1}
            >
              {actionInProgress ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                'Extend Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}