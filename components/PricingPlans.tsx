import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CheckCircle, X } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";
import { SubscriptionInterval, SubscriptionTier } from "@/types/subscription";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PricingPlansProps {
  currentPlan?: SubscriptionTier;
  onSelectPlan?: (tier: SubscriptionTier, interval: SubscriptionInterval) => void;
}

export default function PricingPlans({ currentPlan, onSelectPlan }: PricingPlansProps) {
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('monthly');
  const { user } = useAuth();
  
  // Calculate savings for quarterly and annually plans
  const getSavings = (tier: SubscriptionTier, interval: SubscriptionInterval): number => {
    const plan = SUBSCRIPTION_PLANS[tier];
    
    if (interval === 'monthly' || plan.price.monthly === 0) return 0;
    
    const monthlyTotal = plan.price.monthly * (interval === 'quarterly' ? 3 : 12);
    const actualPrice = plan.price[interval];
    
    return Math.round(((monthlyTotal - actualPrice) / monthlyTotal) * 100);
  };
  
  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };
  
  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (onSelectPlan) {
      onSelectPlan(tier, selectedInterval);
    } else if (user) {
      // If no handler provided but user is logged in, redirect to checkout
      window.location.href = `/api/stripe/create-checkout?tier=${tier}&interval=${selectedInterval}`;
    }
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
      {/* Interval Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-gray-100 rounded-lg">
          <Button
            variant={selectedInterval === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedInterval('monthly')}
            className={cn(
              "text-sm rounded-md",
              selectedInterval === 'monthly' 
                ? "bg-teal-600 text-white hover:bg-teal-700" 
                : "text-gray-700 hover:text-teal-700"
            )}
          >
            Monthly
          </Button>
          <Button
            variant={selectedInterval === 'quarterly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedInterval('quarterly')}
            className={cn(
              "text-sm rounded-md",
              selectedInterval === 'quarterly' 
                ? "bg-teal-600 text-white hover:bg-teal-700" 
                : "text-gray-700 hover:text-teal-700"
            )}
          >
            Quarterly
            {getSavings('PRO', 'quarterly') > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-teal-700 text-white rounded-full">
                Save {getSavings('PRO', 'quarterly')}%
              </span>
            )}
          </Button>
          <Button
            variant={selectedInterval === 'annually' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedInterval('annually')}
            className={cn(
              "text-sm rounded-md",
              selectedInterval === 'annually' 
                ? "bg-teal-600 text-white hover:bg-teal-700" 
                : "text-gray-700 hover:text-teal-700"
            )}
          >
            Annually
            {getSavings('PRO', 'annually') > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-teal-700 text-white rounded-full">
                Save {getSavings('PRO', 'annually')}%
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[]).map((tier) => {
          const plan = SUBSCRIPTION_PLANS[tier];
          const isCurrentPlan = currentPlan === tier;
          const price = plan.price[selectedInterval];
          const savings = getSavings(tier, selectedInterval);
          
          return (
            <Card key={tier} className={cn(
              "relative overflow-hidden transition-all duration-200",
              tier === 'PRO' && "border-teal-500 shadow-md md:scale-105 z-10",
              tier === 'BUSINESS' && "border-purple-400",
              isCurrentPlan && "ring-2 ring-teal-500"
            )}>
              {tier === 'PRO' && (
                <div className="absolute top-0 left-0 right-0 bg-teal-500 text-white text-xs text-center py-1">
                  MOST POPULAR
                </div>
              )}
              
              <CardHeader className={cn(
                "pb-8",
                tier === 'PRO' && "pt-7"
              )}>
                <CardTitle className={cn(
                  "text-xl font-bold",
                  tier === 'PRO' && "text-teal-600",
                  tier === 'BUSINESS' && "text-purple-600"
                )}>
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm mt-2">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      /{selectedInterval === 'monthly' ? 'mo' : selectedInterval === 'quarterly' ? 'quarter' : 'year'}
                    </span>
                  )}
                  
                  {savings > 0 && (
                    <div className="mt-1 text-sm text-teal-600 font-medium">
                      Save {savings}% vs monthly
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {isCurrentPlan ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className={cn(
                      "w-full",
                      tier === 'FREE' ? "bg-gray-800 hover:bg-gray-700" :
                      tier === 'PRO' ? "bg-teal-600 hover:bg-teal-700" :
                      "bg-purple-600 hover:bg-purple-700"
                    )}
                    onClick={() => handleSelectPlan(tier)}
                  >
                    {tier === 'FREE' ? 'Get Started' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Disclaimer */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        All plans include a 7-day money-back guarantee. No questions asked.
      </p>
    </div>
  );
}