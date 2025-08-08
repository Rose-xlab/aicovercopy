// lib/subscription-enforcement.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { SubscriptionTier } from '@/types/subscription';
import { SUBSCRIPTION_PLANS } from './subscription-client';

// Feature types that have limits
export type LimitedFeature = 'coverLetters' | 'resumes' | 'atsScans' | 'interviewSessions';

// Usage tracking functions
export async function trackFeatureUsage(
  userId: string,
  feature: LimitedFeature
): Promise<{ allowed: boolean; reason?: string }> {
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
  if (limit === -1) return { allowed: true };

  // If limit is 0, deny
  if (limit === 0) return { allowed: false, reason: 'This feature is not available on your plan' };

  // Get or create usage record for current period
  const periodStart = subscription?.current_period_start || new Date().toISOString();
  const periodEnd = subscription?.current_period_end || getDefaultPeriodEnd();

  const { data: usageRecord } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('period_end', new Date().toISOString())
    .single();

  if (usageRecord) {
    // Check if limit exceeded
    if (usageRecord.used_count >= limit) {
      return { 
        allowed: false, 
        reason: `You've reached your limit of ${limit} ${feature} for this period` 
      };
    }

    // Increment usage
    await supabase
      .from('usage_limits')
      .update({ 
        used_count: usageRecord.used_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', usageRecord.id);

    return { allowed: true };
  } else {
    // Create new usage record
    await supabase
      .from('usage_limits')
      .insert({
        user_id: userId,
        feature: feature,
        used_count: 1,
        limit_count: limit,
        period_start: periodStart,
        period_end: periodEnd,
      });

    return { allowed: true };
  }
}

// Get current usage for a feature
export async function getFeatureUsage(
  userId: string,
  feature: LimitedFeature
): Promise<{ used: number; limit: number }> {
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
    limit: typeof limit === 'number' ? limit : -1
  };
}

// Check if user can access a feature (without incrementing usage)
export async function canAccessFeature(
  userId: string,
  feature: LimitedFeature
): Promise<boolean> {
  const usage = await getFeatureUsage(userId, feature);
  return usage.limit === -1 || usage.used < usage.limit;
}

// Get all feature usage for a user
export async function getAllFeatureUsage(userId: string) {
  const features: LimitedFeature[] = ['coverLetters', 'resumes', 'atsScans', 'interviewSessions'];
  const usage: Record<string, { used: number; limit: number }> = {};

  for (const feature of features) {
    usage[feature] = await getFeatureUsage(userId, feature);
  }

  return usage;
}

// Helper to determine tier from plan_id
function getTierFromPlanId(planId?: string | null): SubscriptionTier {
  if (!planId) return 'FREE';
  
  // Map Stripe price IDs to tiers
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

  return priceToTier[planId] || 'FREE';
}

// Get default period end (30 days from now)
function getDefaultPeriodEnd(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
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

// Middleware for API routes
export async function enforceSubscriptionLimit(
  userId: string,
  feature: LimitedFeature
): Promise<{ success: boolean; error?: string }> {
  const result = await trackFeatureUsage(userId, feature);
  
  if (!result.allowed) {
    return { 
      success: false, 
      error: result.reason || 'Feature limit exceeded' 
    };
  }
  
  return { success: true };
}

// Template access control
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