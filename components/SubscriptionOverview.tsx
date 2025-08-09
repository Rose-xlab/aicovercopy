import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function SubscriptionOverview() {
  // Corrected: Added 'subscription' to the destructuring
  const { tier, status, loading, getUsage, subscription } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 h-48">
          <LoadingSpinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  const plan = SUBSCRIPTION_PLANS[tier];
  
  const features = ['coverLetters', 'resumes', 'atsScans', 'interviewSessions'] as const;
  let totalUsed = 0;
  let totalLimit = 0;
  let hasUnlimited = false;

  features.forEach(feature => {
    const usage = getUsage(feature);
    if (usage && !usage.unlimited) {
      totalUsed += usage.used;
      totalLimit += usage.limit;
    } else if (usage?.unlimited) {
      hasUnlimited = true;
    }
  });

  const overallPercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Your Subscription
              <Badge 
                variant={tier === 'PRO' ? 'default' : 'secondary'}
                className={tier === 'PRO' ? 'bg-teal-600' : ''}
              >
                {plan.name}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {plan.description}
          	</CardDescription>
          </div>
          {tier === 'FREE' && (
            <Button size="sm" asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/pricing">
                <Sparkles className="mr-1 h-3 w-3" />
                Upgrade
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Usage Overview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
                Monthly Usage
            	</span>
            	{hasUnlimited ? (
            		<span className="text-xs text-green-600 font-medium">
            			Unlimited features active
            		</span>
            	) : (
            		<span className="text-xs text-muted-foreground">
            			{totalUsed} / {totalLimit} actions used
            		</span>
            	)}
          	</div>
          	{!hasUnlimited && totalLimit > 0 && (
          		<Progress value={overallPercentage} className="h-2" />
          	)}
        	</div>

        	{/* Quick Stats */}
        	<div className="grid grid-cols-2 gap-3">
        		{features.slice(0, 2).map(feature => {
        			const usage = getUsage(feature);
        			if (!usage) return null;
        			
        			const featureName = feature === 'coverLetters' ? 'Cover Letters' : 
        								feature === 'resumes' ? 'Resumes' :
        								feature === 'atsScans' ? 'ATS Scans' : 'Interviews';
        			
        			return (
        				<div key={feature} className="space-y-1">
        					<p className="text-xs text-muted-foreground">{featureName}</p>
        					<p className="text-sm font-medium">
        						{usage.unlimited ? (
        							<span className="text-green-600">Unlimited</span>
        						) : (
        							`${usage.used} / ${usage.limit}`
        						)}
        					</p>
        				</div>
        			);
        		})}
        	</div>

        	{/* Status Info */}
        	{/* Corrected: Use 'subscription' object instead of 'status' string */}
        	{subscription && (
        		<div className="pt-3 border-t">
        			{subscription.currentPeriodEnd && (
        				<div className="flex items-center text-xs text-muted-foreground">
        					<Clock className="h-3 w-3 mr-1" />
        					{subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
        					{new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        				</div>
        			)}
        			
        			{subscription.cancelAtPeriodEnd && (
        				<div className="flex items-start mt-2 p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
        					<AlertCircle className="h-3 w-3 mr-1 text-amber-600 mt-0.5" />
        					<p className="text-xs text-amber-600">
        						Your subscription is set to cancel
        					</p>
        				</div>
        			)}
        		</div>
        	)}

        	{/* Actions */}
        	<div className="flex gap-2 pt-2">
        		<Button variant="outline" size="sm" asChild className="flex-1">
        			<Link href="/dashboard/billing">
        				Manage Billing
        			</Link>
        		</Button>
        		{tier !== 'PRO' && (
        			<Button size="sm" asChild className="flex-1 bg-teal-600 hover:bg-teal-700">
        				<Link href="/pricing">
        					View Plans
        				</Link>
        			</Button>
        		)}
        	</div>
      	</div>
    	</CardContent>
  	</Card>
  );
}