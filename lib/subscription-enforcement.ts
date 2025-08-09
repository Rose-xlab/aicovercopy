// lib/subscription-enforcement.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { SubscriptionTier } from '@/types/subscription';
import { SUBSCRIPTION_PLANS } from './subscription-client';

// Feature types that have limits
export type LimitedFeature = 'coverLetters' | 'resumes' | 'atsScans' | 'interviewSessions';

// Check if user can access a feature (without incrementing usage)
export async function canAccessFeature(
  userId: string,
  feature: LimitedFeature
): Promise<{ allowed: boolean; reason?: string; usage?: { used: number; limit: number } }> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get user's subscription tier
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status, current_period_start, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // Determine tier
  const tier = getTierFromPlanId(subscription?.plan_id);
  const plan = SUBSCRIPTION_PLANS[tier];
  const limit = plan.limits[feature];

  // If unlimited (-1), always allow
  if (limit === -1) return { allowed: true, usage: { used: 0, limit: -1 } };

  // If limit is 0, deny
  if (limit === 0) return { 
    allowed: false, 
    reason: 'This feature is not available on your plan',
    usage: { used: 0, limit: 0 }
  };

  // Get current usage for the period
  const periodStart = subscription?.current_period_start || getMonthStart();
  const periodEnd = subscription?.current_period_end || getMonthEnd();

  const { data: usageRecord } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('period_end', new Date().toISOString())
    .single();

  const currentUsage = usageRecord?.used_count || 0;

  if (currentUsage >= limit) {
    return { 
      allowed: false, 
      reason: `You've reached your limit of ${limit} ${feature} for this period`,
      usage: { used: currentUsage, limit }
    };
  }

  return { 
    allowed: true,
    usage: { used: currentUsage, limit }
  };
}

// Track feature usage (call AFTER successful operation)
export async function trackFeatureUsage(
  userId: string,
  feature: LimitedFeature
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get user's subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status, current_period_start, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const tier = getTierFromPlanId(subscription?.plan_id);
  const plan = SUBSCRIPTION_PLANS[tier];
  const limit = plan.limits[feature];

  // If unlimited, no need to track
  if (limit === -1) return { success: true };

  // Get or create usage record for current period
  const periodStart = subscription?.current_period_start || getMonthStart();
  const periodEnd = subscription?.current_period_end || getMonthEnd();

  const { data: existingUsage } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('period_end', new Date().toISOString())
    .single();

  if (existingUsage) {
    // Update existing record
    const { error } = await supabase
      .from('usage_limits')
      .update({ 
        used_count: existingUsage.used_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUsage.id);

    if (error) {
      console.error('Error updating usage:', error);
      return { success: false, error: 'Failed to track usage' };
    }
  } else {
    // Create new usage record
    const { error } = await supabase
      .from('usage_limits')
      .insert({
        user_id: userId,
        feature: feature,
        used_count: 1,
        limit_count: limit,
        period_start: periodStart,
        period_end: periodEnd,
      });

    if (error) {
      console.error('Error creating usage record:', error);
      return { success: false, error: 'Failed to track usage' };
    }
  }

  return { success: true };
}

// Get current usage for a feature
export async function getFeatureUsage(
  userId: string,
  feature: LimitedFeature
): Promise<{ used: number; limit: number; unlimited: boolean }> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const tier = getTierFromPlanId(subscription?.plan_id);
  const plan = SUBSCRIPTION_PLANS[tier];
  const limit = plan.limits[feature];

  // If unlimited
  if (limit === -1) {
    return { used: 0, limit: -1, unlimited: true };
  }

  // Get current usage
  const { data: usageRecord } = await supabase
    .from('usage_limits')
    .select('used_count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('period_end', new Date().toISOString())
    .single();

  return {
    used: usageRecord?.used_count || 0,
    limit: typeof limit === 'number' ? limit : 0,
    unlimited: false
  };
}

// Get all feature usage for a user
export async function getAllFeatureUsage(userId: string) {
  const features: LimitedFeature[] = ['coverLetters', 'resumes', 'atsScans', 'interviewSessions'];
  const usage: Record<string, { used: number; limit: number; unlimited: boolean }> = {};

  for (const feature of features) {
    usage[feature] = await getFeatureUsage(userId, feature);
  }

  return usage;
}

// Enforce subscription limit (combines check + response)
export async function enforceSubscriptionLimit(
  userId: string,
  feature: LimitedFeature
): Promise<{ success: boolean; error?: string; usage?: { used: number; limit: number } }> {
  const result = await canAccessFeature(userId, feature);
  
  if (!result.allowed) {
    return { 
      success: false, 
      error: result.reason || 'Feature limit exceeded',
      usage: result.usage
    };
  }
  
  return { success: true, usage: result.usage };
}

// Helper to determine tier from plan_id
function getTierFromPlanId(planId?: string | null): SubscriptionTier {
  if (!planId) return 'FREE';
  
  // Map plan_id to tier
  const planIdToTier: Record<string, SubscriptionTier> = {
    'free': 'FREE',
    'pro': 'PRO',
    'business': 'BUSINESS'
  };

  // Also check Stripe price IDs
  const priceToTier: Record<string, SubscriptionTier> = {};
  
  Object.entries(SUBSCRIPTION_PLANS).forEach(([tier, plan]) => {
    if (plan.stripePriceIds.monthly) {
      priceToTier[plan.stripePriceIds.monthly] = tier as SubscriptionTier;
    }
    if (plan.stripePriceIds.annually) {
      priceToTier[plan.stripePriceIds.annually] = tier as SubscriptionTier;
    }
    if (plan.stripePriceIds.quarterly) {
      priceToTier[plan.stripePriceIds.quarterly] = tier as SubscriptionTier;
    }
  });

  return planIdToTier[planId] || priceToTier[planId] || 'FREE';
}

// Get start of current month
function getMonthStart(): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

// Get end of current month
function getMonthEnd(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

// Reset usage for a feature (admin use)
export async function resetFeatureUsage(
  userId: string,
  feature: LimitedFeature
): Promise<void> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  await supabase
    .from('usage_limits')
    .delete()
    .eq('user_id', userId)
    .eq('feature', feature);
}

// Check template access
export async function canAccessTemplate(
  userId: string,
  templateCategory?: string | null
): Promise<boolean> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const tier = getTierFromPlanId(subscription?.plan_id);
  const plan = SUBSCRIPTION_PLANS[tier];
  const templateAccess = plan.limits.templates;

  // Check template access level
  switch (templateAccess) {
    case 'none':
      return false;
    case 'basic':
      return !templateCategory || templateCategory === 'basic';
    case 'all':
    case 'premium':
      return true;
    default:
      return false;
  }
}