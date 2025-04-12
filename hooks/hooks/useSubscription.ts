"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SubscriptionStatus, SubscriptionTier } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [usageStats, setUsageStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Fetch subscription data when user is available
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/subscription');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription data');
        }
        
        const data = await response.json();
        setSubscription(data);
        
        // Fetch usage data
        const usageResponse = await fetch('/api/user/usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageStats(usageData);
        }
      } catch (error: any) {
        console.error('Error fetching subscription data:', error);
        setError(error.message || 'Failed to load subscription information');
        
        toast({
          title: 'Error',
          description: 'Failed to load subscription information. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading) {
      fetchSubscriptionData();
    }
  }, [user, loading, toast]);
  
  // Check if user has access to a feature
  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    
    // Map tiers to numeric values for comparison
    const tierValues: Record<SubscriptionTier, number> = {
      'FREE': 0,
      'PRO': 1,
      'BUSINESS': 2
    };
    
    return tierValues[subscription.tier] >= tierValues[requiredTier];
  };
  
  // Check if user is within usage limits
  const checkUsageLimit = (feature: string): boolean => {
    if (!subscription || !usageStats) return true;
    
    // Always allow for BUSINESS tier (unlimited)
    if (subscription.tier === 'BUSINESS') return true;
    
    // Check specific feature limits
    const featureStats = usageStats[feature];
    if (!featureStats) return true;
    
    // If limit is -1, it means unlimited
    if (featureStats.limit === -1) return true;
    
    // Check if usage is within limits
    return featureStats.used < featureStats.limit;
  };
  
  // Upgrade subscription - redirects to pricing page
  const upgradeSubscription = (minimumTier?: SubscriptionTier) => {
    const tierParam = minimumTier ? `?tier=${minimumTier}` : '';
    router.push(`/pricing${tierParam}`);
  };
  
  // Manage subscription - redirects to billing page
  const manageSubscription = () => {
    router.push('/dashboard/billing');
  };
  
  return {
    subscription,
    usageStats,
    isLoading,
    error,
    hasAccess,
    checkUsageLimit,
    upgradeSubscription,
    manageSubscription
  };
}