// lib/subscription.ts
import { stripe } from './stripe';
import { getServerClient } from './supabase-server';
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';

// Define subscription tiers and their respective Stripe product IDs
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Basic access to the platform',
    features: [
      '3 Cover letters per month',
      '1 Resume',
      'Basic templates',
      'Standard support',
    ],
    limits: {
      coverLetters: 3,
      resumes: 1,
      templates: 'basic',
      atsScans: 2,
      interviewSessions: 1,
    },
    price: {
      monthly: 0,
      quarterly: 0,
      annually: 0,
    },
    stripePriceIds: {
      monthly: '',
      quarterly: '',
      annually: '',
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'Premium features for job seekers',
    features: [
      'Unlimited cover letters',
      'Up to 5 Resumes',
      'All templates',
      'ATS Scanner',
      'Priority support',
    ],
    limits: {
      coverLetters: -1, // Unlimited
      resumes: 5,
      templates: 'all',
      atsScans: 10,
      interviewSessions: 5,
    },
    price: {
      monthly: 9.99,
      quarterly: 26.99,
      annually: 99.99,
    },
    stripePriceIds: {
      monthly: 'price_1OxYZABCDEFGHIJKLMNOPQRS',
      quarterly: 'price_1OxYZXBCDEFGHIJKLMNOPQRS',
      annually: 'price_1OxYZpBCDEFGHIJKLMNOPQRS',
    },
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    description: 'For professionals and teams',
    features: [
      'Unlimited cover letters',
      'Unlimited resumes',
      'All premium templates',
      'Unlimited ATS Scans',
      'Advanced AI features',
      'Dedicated support',
    ],
    limits: {
      coverLetters: -1, // Unlimited
      resumes: -1, // Unlimited
      templates: 'premium',
      atsScans: -1, // Unlimited
      interviewSessions: -1, // Unlimited
    },
    price: {
      monthly: 19.99,
      quarterly: 53.99,
      annually: 199.99,
    },
    stripePriceIds: {
      monthly: 'price_1OxYaABCDEFGHIJKLMNOPQRS',
      quarterly: 'price_1OxYaXBCDEFGHIJKLMNOPQRS',
      annually: 'price_1OxYapBCDEFGHIJKLMNOPQRS',
    },
  },
};

/**
 * Get user's active subscription from Supabase
 */
export async function getUserSubscription(userId: string) {
  const supabase = await getServerClient();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
  
  return data;
}

/**
 * Get a user's subscription tier - defaults to FREE if no active subscription
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return 'FREE';
  }
  
  // Map from Stripe product ID to our tier enum
  const stripePlanMap: Record<string, SubscriptionTier> = {
    [SUBSCRIPTION_PLANS.PRO.id]: 'PRO',
    [SUBSCRIPTION_PLANS.BUSINESS.id]: 'BUSINESS',
  };
  
  return stripePlanMap[subscription.plan_id] || 'FREE';
}

/**
 * Check if a user has access to a specific feature based on their subscription
 */
export async function hasSubscriptionAccess(
  userId: string,
  feature: keyof SubscriptionPlan['limits'],
  requiredCount = 1
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const plan = SUBSCRIPTION_PLANS[tier];
  
  if (!plan) return false;
  
  const limit = plan.limits[feature];
  
  // -1 means unlimited access
  if (limit === -1) return true;
  
  // Check if the user is within their limits
  if (typeof limit === 'number') {
    return limit >= requiredCount;
  }
  
  // For string-based features like template levels
  return limit !== 'none';
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession({
  userId,
  tier,
  interval,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  tier: SubscriptionTier;
  interval: 'monthly' | 'quarterly' | 'annually';
  successUrl: string;
  cancelUrl: string;
}) {
  // Get user's Stripe customer ID or create one
  const { stripeCustomerId } = await getOrCreateStripeCustomer(userId);
  
  // Get the price ID for the selected plan
  const priceId = SUBSCRIPTION_PLANS[tier].stripePriceIds[interval];
  
  if (!priceId) {
    throw new Error(`No price ID found for tier ${tier} and interval ${interval}`);
  }
  
  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      interval,
    },
  });
  
  return session;
}

/**
 * Get or create a Stripe customer for a user
 */
async function getOrCreateStripeCustomer(userId: string) {
  const supabase = await getServerClient();
  
  // Check if user already has a customer ID
  const { data: user, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw error;
  }
  
  // If user has a customer ID, return it
  if (user.stripe_customer_id) {
    return { stripeCustomerId: user.stripe_customer_id };
  }
  
  // Otherwise, create a new customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name,
    metadata: {
      userId,
    },
  });
  
  // Save the customer ID in the user's profile
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);
  
  return { stripeCustomerId: customer.id };
}

/**
 * Create a Stripe customer portal session for managing subscription
 */
export async function createPortalSession(userId: string, returnUrl: string) {
  const { stripeCustomerId } = await getOrCreateStripeCustomer(userId);
  
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  
  return session;
}