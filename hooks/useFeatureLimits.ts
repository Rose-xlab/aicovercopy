// hooks/useFeatureLimits.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LimitedFeature } from '@/lib/subscription-enforcement';

interface FeatureUsage {
  used: number;
  limit: number;
  unlimited: boolean;
}

interface UseFeatureLimitsReturn {
  usage: Record<LimitedFeature, FeatureUsage>;
  loading: boolean;
  error: string | null;
  checkLimit: (feature: LimitedFeature) => Promise<boolean>;
  trackUsage: (feature: LimitedFeature) => Promise<boolean>;
  refreshUsage: () => Promise<void>;
  canUseFeature: (feature: LimitedFeature) => boolean;
  getUsageText: (feature: LimitedFeature) => string;
  getUsagePercentage: (feature: LimitedFeature) => number;
}

export function useFeatureLimits(): UseFeatureLimitsReturn {
  const [usage, setUsage] = useState<Record<LimitedFeature, FeatureUsage>>({
    coverLetters: { used: 0, limit: 0, unlimited: false },
    resumes: { used: 0, limit: 0, unlimited: false },
    atsScans: { used: 0, limit: 0, unlimited: false },
    interviewSessions: { used: 0, limit: 0, unlimited: false },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch usage data
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const response = await fetch('/api/user/usage');
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsage(data);
    } catch (err: any) {
      console.error('Error fetching usage:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);
  
  // Check if user can use a feature (pre-check)
  const checkLimit = useCallback(async (feature: LimitedFeature): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch('/api/subscription/check-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Limit Reached',
          description: data.error || `You've reached your ${feature} limit`,
          variant: 'destructive',
        });
        return false;
      }
      
      return data.allowed;
    } catch (err) {
      console.error('Error checking limit:', err);
      return false;
    }
  }, [user, toast]);
  
  // Track usage after successful operation
  const trackUsage = useCallback(async (feature: LimitedFeature): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch('/api/subscription/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to track usage');
      }
      
      // Refresh usage data
      await fetchUsage();
      return true;
    } catch (err) {
      console.error('Error tracking usage:', err);
      return false;
    }
  }, [user, fetchUsage]);
  
  // Check if user can use feature (synchronous)
  const canUseFeature = useCallback((feature: LimitedFeature): boolean => {
    const featureUsage = usage[feature];
    if (!featureUsage) return false;
    
    return featureUsage.unlimited || featureUsage.used < featureUsage.limit;
  }, [usage]);
  
  // Get formatted usage text
  const getUsageText = useCallback((feature: LimitedFeature): string => {
    const featureUsage = usage[feature];
    if (!featureUsage) return '0/0';
    
    if (featureUsage.unlimited) return 'Unlimited';
    
    return `${featureUsage.used}/${featureUsage.limit}`;
  }, [usage]);
  
  // Get usage percentage
  const getUsagePercentage = useCallback((feature: LimitedFeature): number => {
    const featureUsage = usage[feature];
    if (!featureUsage || featureUsage.unlimited || featureUsage.limit === 0) return 0;
    
    return Math.min(100, Math.round((featureUsage.used / featureUsage.limit) * 100));
  }, [usage]);
  
  return {
    usage,
    loading,
    error,
    checkLimit,
    trackUsage,
    refreshUsage: fetchUsage,
    canUseFeature,
    getUsageText,
    getUsagePercentage,
  };
}