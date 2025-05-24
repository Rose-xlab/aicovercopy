//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\PricingPlans.tsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CheckCircle, X } from "lucide-react";
import { SubscriptionInterval, SubscriptionTier } from "@/types/subscription";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PricingPlansProps {
  currentPlan?: SubscriptionTier;
  onSelectPlan?: (tier: SubscriptionTier, interval: SubscriptionInterval) => void;
}

// Define the features in the same order as the comparison table
const PLAN_FEATURES = {
  FREE: [
    '1 Cover letter per month',
    '1 Resume',
    'Basic templates only',
    '2 ATS scans per month',
    '1 Interview session',
    'Basic AI cover letter enhancement',
    'Standard email support',
  ],
  PRO: [
    'Unlimited cover letters',
    'Unlimited resumes',
    'All templates',
    'Unlimited ATS scans',
    'Unlimited interview sessions',
    'Advanced AI cover letter enhancement',
    'Priority email support',
  ],
};

export default function PricingPlans({ currentPlan, onSelectPlan }: PricingPlansProps) {
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('monthly');
  const { user } = useAuth();
  
  // Calculate savings for annually plans
  const getSavings = (): number => {
    // 58% savings for annual plan
    return 58;
  };
  
  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  };

  // Get price based on tier and interval
  const getPrice = (tier: SubscriptionTier): number => {
    if (tier === 'FREE') return 0;
    
    // PRO tier prices
    if (selectedInterval === 'annually') {
      return 100; // Annual price
    } else {
      return 20; // Monthly price
    }
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
            {getSavings() > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-teal-700 text-white rounded-full">
                Save {getSavings()}%
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {/* FREE Plan */}
        <Card className={cn(
          "relative overflow-hidden transition-all duration-200 border-gray-200",
          currentPlan === 'FREE' && "ring-2 ring-gray-400"
        )}>
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-gray-800">
              Free
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Basic access to the platform
            </CardDescription>
            
            <div className="mt-4">
              <span className="text-3xl font-bold">
                {formatPrice(0)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                forever
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {PLAN_FEATURES.FREE.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            {currentPlan === 'FREE' ? (
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
              >
                Current Plan
              </Button>
            ) : (
              <Button 
                className="w-full bg-gray-800 hover:bg-gray-700"
                onClick={() => handleSelectPlan('FREE')}
              >
                Get Started
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* PRO Plan */}
        <Card className={cn(
          "relative overflow-hidden transition-all duration-200 border-teal-500 shadow-md",
          currentPlan === 'PRO' && "ring-2 ring-teal-500"
        )}>
          <div className="absolute top-0 left-0 right-0 bg-teal-500 text-white text-xs text-center py-1">
            MOST POPULAR
          </div>
          
          <CardHeader className="pt-7 pb-6">
            <CardTitle className="text-xl font-bold text-teal-600">
              Pro
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Premium features for job seekers
            </CardDescription>
            
            <div className="mt-4">
              <span className="text-3xl font-bold">
                {formatPrice(getPrice('PRO'))}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                /{selectedInterval === 'monthly' ? 'mo' : 'year'}
              </span>
              
              {selectedInterval === 'annually' && (
                <div className="mt-1 text-sm text-teal-600 font-medium">
                  Save {getSavings()}% vs monthly
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {PLAN_FEATURES.PRO.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            {currentPlan === 'PRO' ? (
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
              >
                Current Plan
              </Button>
            ) : (
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => handleSelectPlan('PRO')}
              >
                Upgrade to Pro
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Disclaimer */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        All plans include a 7-day money-back guarantee. No questions asked.
      </p>
    </div>
  );
}