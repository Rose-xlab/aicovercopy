// app/pricing/PricingClient.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PricingPlans from "@/components/PricingPlans";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SubscriptionTier, SubscriptionInterval } from '@/types/subscription'; // Make sure SubscriptionInterval is imported

export default function PricingClient() {
  const { user, loading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('FREE');
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // CHANGE 1: Read 'interval' from the URL, not 'tier'
  const defaultInterval = searchParams.get('interval') as SubscriptionInterval | null;
  
  // Fetch the user's current subscription tier
  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      // If there's no user, we don't need to fetch a plan. Stop loading.
      if (!user) {
        setIsLoadingPlan(false);
        return;
      }
      
      try {
        const response = await fetch('/api/user/subscription');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        setCurrentPlan(data.tier);
      } catch (error) {
        console.error('Error fetching subscription tier:', error);
      } finally {
        setIsLoadingPlan(false);
      }
    };
    
    // Only run the fetch logic if the initial auth loading is complete
    if (!loading) {
      fetchSubscriptionTier();
    }
  }, [user, loading]);
  
  const handleSelectPlan = (tier: SubscriptionTier, interval: string) => {
    if (!user) {
      // Redirect to login if not logged in
      router.push(`/auth/login?redirect=/pricing&interval=${interval}`);
      return;
    }
    
    // If user is already on this tier, redirect to billing
    if (tier === currentPlan) {
      router.push('/dashboard/billing');
      return;
    }
    
    // Create checkout session
    router.push(`/api/stripe/create-checkout?tier=${tier}&interval=${interval}`);
  };
  
  // Show a loading spinner while fetching the user's auth status or their current plan
  if (loading || isLoadingPlan) {
    return (
      <div className="flex justify-center my-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }
  
  return (
    <PricingPlans 
      currentPlan={currentPlan} 
      onSelectPlan={handleSelectPlan} 
      // CHANGE 2: Pass the correct 'defaultInterval' prop
      defaultInterval={defaultInterval}
    />
  );
}