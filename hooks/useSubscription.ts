// hooks/useSubscription.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SubscriptionStatus, SubscriptionTier } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LimitedFeature } from '@/lib/subscription-enforcement';

interface FeatureUsage {
  used: number;
  limit: number;
  unlimited: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [usageStats, setUsageStats] = useState<Record<LimitedFeature, FeatureUsage> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Fetch subscription and usage data
  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setUsageStats(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch subscription status
      const subResponse = await fetch('/api/user/subscription');
      if (!subResponse.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      const subData = await subResponse.json();
      setSubscription(subData);
      
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
  }, [user, toast]);
  
  // Initial fetch
  useEffect(() => {
    if (!loading) {
      fetchSubscriptionData();
    }
  }, [loading, fetchSubscriptionData]);
  
  // Get current tier
  const tier = subscription?.tier || 'FREE';
  
  // Get current status
  const status = subscription?.status || 'active';
  
  // Check if user has access to a feature
  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    
    const tierValues: Record<SubscriptionTier, number> = {
      'FREE': 0,
      'PRO': 1,
      'BUSINESS': 2
    };
    
    return tierValues[subscription.tier] >= tierValues[requiredTier];
  };
  
  // Check if user can access a feature (with usage limits)
  const canAccess = (feature: LimitedFeature): boolean => {
    if (!usageStats || !usageStats[feature]) return true;
    
    const usage = usageStats[feature];
    return usage.unlimited || usage.used < usage.limit;
  };
  
  // Get usage for a specific feature
  const getUsage = (feature: LimitedFeature): FeatureUsage | null => {
    if (!usageStats) return null;
    return usageStats[feature] || null;
  };
  
  // Check and track usage in one call
  const checkAndTrack = async (feature: LimitedFeature): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      const response = await fetch('/api/subscription/check-and-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { allowed: false, reason: data.error };
      }
      
      // Refresh usage data after tracking
      await fetchSubscriptionData();
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking/tracking usage:', error);
      return { allowed: false, reason: 'Failed to verify subscription' };
    }
  };
  
  // Upgrade subscription
  const upgradeSubscription = (minimumTier?: SubscriptionTier) => {
    const tierParam = minimumTier ? `?tier=${minimumTier}` : '';
    router.push(`/pricing${tierParam}`);
  };
  
  // Manage subscription
  const manageSubscription = () => {
    router.push('/dashboard/billing');
  };
  
  // Refresh usage data
  const refreshUsage = () => {
    return fetchSubscriptionData();
  };
  
  return {
    // State
    subscription,
    usageStats,
    loading: isLoading,
    error,
    tier,
    status,
    
    // Methods
    hasAccess,
    canAccess,
    getUsage,
    checkAndTrack,
    upgradeSubscription,
    manageSubscription,
    refreshUsage,
  };
}