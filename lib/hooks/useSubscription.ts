import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionTier, SubscriptionStatus } from '@/types/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-client';
import { LimitedFeature } from '@/lib/subscription-enforcement';

interface FeatureUsage {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}

interface UseSubscriptionReturn {
  tier: SubscriptionTier;
  status: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  canAccess: (feature: LimitedFeature) => boolean;
  getUsage: (feature: LimitedFeature) => FeatureUsage | null;
  refreshUsage: () => Promise<void>;
  checkAndTrack: (feature: LimitedFeature) => Promise<{ allowed: boolean; reason?: string }>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('FREE');
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [usage, setUsage] = useState<Record<string, FeatureUsage>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status and usage
  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch subscription status
      const subResponse = await fetch('/api/user/subscription');
      if (!subResponse.ok) throw new Error('Failed to fetch subscription');
      // Corrected: Explicitly type the API response data
      const subData: SubscriptionStatus = await subResponse.json();
      
      setTier(subData.tier || 'FREE');
      setStatus(subData);

      // Fetch usage data
      const usageResponse = await fetch('/api/user/usage');
      if (!usageResponse.ok) throw new Error('Failed to fetch usage');
      const usageData = await usageResponse.json();

      // Transform usage data
      const transformedUsage: Record<string, FeatureUsage> = {};
      const plan = SUBSCRIPTION_PLANS[subData.tier || 'FREE'];
      
      ['coverLetters', 'resumes', 'atsScans', 'interviewSessions'].forEach((feature) => {
        const key = feature as LimitedFeature;
        const limit = plan.limits[key];
        const used = usageData[key]?.used || 0;
        
        transformedUsage[feature] = {
          used,
          // Ensure limit is a number, default to -1 (unlimited) if not found
          limit: typeof limit === 'number' ? limit : -1,
          remaining: limit === -1 ? Infinity : Math.max(0, limit - used),
          unlimited: limit === -1
        };
      });

      setUsage(transformedUsage);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Check if user can access a feature
  const canAccess = useCallback((feature: LimitedFeature): boolean => {
    const featureUsage = usage[feature];
    if (!featureUsage) return false;
    return featureUsage.unlimited || featureUsage.remaining > 0;
  }, [usage]);

  // Get usage for a feature
  const getUsage = useCallback((feature: LimitedFeature): FeatureUsage | null => {
    return usage[feature] || null;
  }, [usage]);

  // Check and track feature usage (for real-time enforcement)
  const checkAndTrack = useCallback(async (feature: LimitedFeature): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    try {
      const response = await fetch('/api/subscription/check-and-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { allowed: false, reason: data.error || 'Feature not available' };
      }

      // Refresh usage data after tracking
      await fetchSubscriptionData();
      
      return { allowed: true };
    } catch (err) {
      console.error('Error checking feature access:', err);
      return { allowed: false, reason: 'Failed to check feature access' };
    }
  }, [user, fetchSubscriptionData]);

  return {
    tier,
    status,
    loading,
    error,
    canAccess,
    getUsage,
    refreshUsage: fetchSubscriptionData,
    checkAndTrack
  };
}