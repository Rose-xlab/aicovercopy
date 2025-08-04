// lib/subscription.ts
import { stripe } from './stripe';
import { getServerClient } from './supabase-server';
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';
import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS } from './subscription-client';

/**
 * Get user's active subscription details from Supabase based on user ID.
 * Returns the active subscription record or null if not found or error occurs.
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
 * Determines a user's subscription tier (e.g., 'FREE', 'PRO').
 * Defaults to 'FREE' if no active subscription is found.
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await getUserSubscription(userId);

  if (!subscription || !subscription.plan_id) {
    return 'FREE';
  }

  const stripePriceIdMap: { [key: string]: SubscriptionTier } = {};

  for (const tierKey in SUBSCRIPTION_PLANS) {
      const tier = tierKey as SubscriptionTier;
      const plan = SUBSCRIPTION_PLANS[tier];
      if (plan.stripePriceIds.monthly) {
          stripePriceIdMap[plan.stripePriceIds.monthly] = tier;
      }
      if (plan.stripePriceIds.annually) {
          stripePriceIdMap[plan.stripePriceIds.annually] = tier;
      }
      if (plan.stripePriceIds.quarterly) {
        stripePriceIdMap[plan.stripePriceIds.quarterly] = tier;
      }
  }

  const foundTier = stripePriceIdMap[subscription.plan_id];

  return foundTier || 'FREE';
}


/**
 * Checks if a user has access to a specific feature based on their subscription tier.
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

  if (limit === -1) return true;

  if (typeof limit === 'number') {
    return limit >= requiredCount;
  }

  if (typeof limit === 'string') {
      return limit !== 'none';
  }

  return false;
}

/**
 * Creates a Stripe Checkout Session for initiating a subscription.
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
  interval: 'monthly' | 'annually';
  successUrl: string;
  cancelUrl: string;
}) {
  const { stripeCustomerId } = await getOrCreateStripeCustomer(userId);

  if (!SUBSCRIPTION_PLANS[tier]) {
      throw new Error(`Invalid subscription tier specified: ${tier}`);
  }

  const priceId = SUBSCRIPTION_PLANS[tier].stripePriceIds[interval];

  if (!priceId) {
    throw new Error(`No Stripe Price ID found for tier '${tier}' and interval '${interval}'. Check SUBSCRIPTION_PLANS configuration.`);
  }

  console.log(`Creating checkout for user ${userId}, customer ${stripeCustomerId}, price ${priceId}`);

  const checkoutSession = await stripe.checkout.sessions.create({
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
    allow_promotion_codes: true,
  });

  return checkoutSession;
}

/**
 * Retrieves or creates a Stripe Customer ID for a user.
 */
async function getOrCreateStripeCustomer(userId: string): Promise<{ stripeCustomerId: string }> {
  const supabase = await getServerClient();

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
      console.error(`Error fetching profile or profile not found for user ${userId}:`, fetchError);
      throw new Error(`Could not retrieve or find profile for user ${userId}.`);
  }

  if (profile.stripe_customer_id) {
    return { stripeCustomerId: profile.stripe_customer_id };
  }

  console.log(`Creating new Stripe customer for user ${userId}`);
  try {
    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      name: profile.full_name || undefined,
      metadata: {
        userId: userId,
      },
    });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      console.error(`Failed to update profile for user ${userId} with Stripe customer ID ${customer.id}:`, updateError);
    }

    return { stripeCustomerId: customer.id };

  } catch (stripeError) {
      console.error(`Error creating Stripe customer for user ${userId}:`, stripeError);
      throw new Error('Failed to create Stripe customer.');
  }
}

/**
 * Creates a Stripe Billing Portal Session for a user.
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  const { stripeCustomerId } = await getOrCreateStripeCustomer(userId);

  console.log(`Creating portal session for customer ${stripeCustomerId}`);

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return portalSession;
}