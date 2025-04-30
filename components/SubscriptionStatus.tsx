import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";
import { SubscriptionStatus as SubscriptionStatusType } from "@/types/subscription";
import { CreditCard, CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';

interface SubscriptionStatusProps {
  subscription: SubscriptionStatusType;
  usageStats?: {
    coverLetters: { used: number; limit: number };
    resumes: { used: number; limit: number };
    atsScans: { used: number; limit: number };
  };
}

export default function SubscriptionStatus({ subscription, usageStats }: SubscriptionStatusProps) {
  const { tier, interval, currentPeriodEnd, cancelAtPeriodEnd, status } = subscription;
  const plan = SUBSCRIPTION_PLANS[tier];
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate days remaining in the current period
  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return 0;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysRemaining = currentPeriodEnd ? getDaysRemaining(currentPeriodEnd) : 0;
  
  // Format the subscription interval
  const formatInterval = (interval?: string) => {
    if (!interval) return '';
    return interval.charAt(0).toUpperCase() + interval.slice(1);
  };
  
  // Helper for usage limits display
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, Math.round((used / limit) * 100));
  };
  
  // Style helper for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'canceled': 
      case 'incomplete_expired': 
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'past_due': 
      case 'unpaid': 
        return 'bg-red-100 text-red-800 border-red-300';
      case 'trialing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'incomplete': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-teal-600" />
              Subscription
            </CardTitle>
            <CardDescription>
              Your current subscription plan and usage
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted rounded-md">
          <div>
            <h3 className="font-medium text-base">
              {plan.name} {interval && `(${formatInterval(interval)})`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {plan.description}
            </p>
          </div>
          
          {status === 'active' && currentPeriodEnd && (
            <div className="text-sm flex items-center">
              <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
              {cancelAtPeriodEnd ? (
                <span className="text-amber-600">
                  Cancels on {formatDate(currentPeriodEnd)}
                </span>
              ) : (
                <span>
                  Renews on {formatDate(currentPeriodEnd)}
                </span>
              )}
            </div>
          )}
        </div>

        {cancelAtPeriodEnd && (
          <div className="flex items-start p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">Your subscription is set to cancel.</span>
              <p className="text-muted-foreground">
                You'll lose access to {plan.name} features in {daysRemaining} days.
              </p>
            </div>
          </div>
        )}
        
        {/* Usage Stats */}
        {usageStats && tier !== 'BUSINESS' && (
          <div className="space-y-3 mt-2">
            <h4 className="text-sm font-medium">Current Usage</h4>
            
            {/* Cover Letters */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cover Letters</span>
                <span className="font-medium">
                  {usageStats.coverLetters.used} / 
                  {plan.limits.coverLetters === -1 ? 'Unlimited' : plan.limits.coverLetters}
                </span>
              </div>
              {plan.limits.coverLetters !== -1 && (
                <Progress 
                  value={getUsagePercentage(usageStats.coverLetters.used, plan.limits.coverLetters)} 
                  className="h-2"
                />
              )}
            </div>
            
            {/* Resumes */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resumes</span>
                <span className="font-medium">
                  {usageStats.resumes.used} / 
                  {plan.limits.resumes === -1 ? 'Unlimited' : plan.limits.resumes}
                </span>
              </div>
              {plan.limits.resumes !== -1 && (
                <Progress 
                  value={getUsagePercentage(usageStats.resumes.used, plan.limits.resumes)} 
                  className="h-2"
                />
              )}
            </div>
            
            {/* ATS Scans */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ATS Scans</span>
                <span className="font-medium">
                  {usageStats.atsScans.used} / 
                  {plan.limits.atsScans === -1 ? 'Unlimited' : plan.limits.atsScans}
                </span>
              </div>
              {plan.limits.atsScans !== -1 && (
                <Progress 
                  value={getUsagePercentage(usageStats.atsScans.used, plan.limits.atsScans)} 
                  className="h-2"
                />
              )}
            </div>
          </div>
        )}
        
        {tier === 'BUSINESS' && (
          <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              You have unlimited access to all features with your Business plan.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
        {tier !== 'FREE' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto" 
            asChild
          >
            <Link href="/dashboard/billing/manage">
              Manage Subscription
            </Link>
          </Button>
        )}
        
        {tier !== 'BUSINESS' && (
          <Button 
            size="sm" 
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
            asChild
          >
            <Link href="/pricing">
              {tier === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}