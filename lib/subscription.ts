// lib/subscription.ts
import { stripe } from './stripe'; // Ensure this path is correct
import { getServerClient } from './supabase-server'; // Ensure this path is correct
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription'; // Ensure this path is correct

// Define subscription tiers and their respective Stripe product IDs
// Removed BUSINESS tier details if they existed previously
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Basic access to the platform',
    features: [
      '1 Cover letter per month',
      '1 Resume',
      'Basic templates',
      '2 ATS scans per month',
      '1 Interview session',
      'Standard support',
    ],
    limits: {
      coverLetters: 1,
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
    stripePriceIds: { // Price IDs for FREE tier (likely empty or placeholder)
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
      'Unlimited resumes',
      'All templates',
      'Unlimited ATS scans',
      'Unlimited interview sessions',
      'Priority support',
    ],
    limits: {
      coverLetters: -1, // -1 signifies unlimited
      resumes: -1, // now unlimited
      templates: 'all',
      atsScans: -1, // now unlimited
      interviewSessions: -1, // now unlimited
    },
    price: {
      monthly: 20.00,
      quarterly: 0, // Not used, set to 0 or remove if type allows undefined
      annually: 100.00,
    },
    stripePriceIds: { // Ensure these match your actual Stripe Price IDs
      monthly: 'price_1RK5xpBh2Msdef2rOP2A93hO', // Updated PRO Monthly Price ID
      quarterly: '', // Not used
      annually: 'price_1RK6FHBh2Msdef2rzti7qMbN', // Updated PRO Annual Price ID
    },
  },
  // BUSINESS tier removed
};

/**
 * Get user's active subscription details from Supabase based on user ID.
 * Returns the active subscription record or null if not found or error occurs.
 */
export async function getUserSubscription(userId: string) {
  // Ensure Supabase client is initialized correctly for server-side use
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from('subscriptions') // Ensure 'subscriptions' is your table name
    .select('*') // Select all columns for the subscription record
    .eq('user_id', userId) // Filter by the provided user ID
    .eq('status', 'active') // Only fetch subscriptions with an 'active' status
    .maybeSingle(); // Expect at most one active subscription per user

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null; // Return null on error
  }

  return data; // Return the subscription data object or null if none found
}

/**
 * Determines a user's subscription tier (e.g., 'FREE', 'PRO').
 * Defaults to 'FREE' if no active subscription is found.
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await getUserSubscription(userId);

  // Default to FREE tier if no active subscription exists
  if (!subscription || !subscription.plan_id) { // Also check if plan_id exists
    return 'FREE';
  }

  // Map from Stripe Price ID (stored in subscription.plan_id) to our internal SubscriptionTier enum/type
  // It's crucial that subscription.plan_id stores the *Stripe Price ID*
  const stripePriceIdMap: { [key: string]: SubscriptionTier } = {};

  // Populate the map dynamically from SUBSCRIPTION_PLANS
  for (const tierKey in SUBSCRIPTION_PLANS) {
      const tier = tierKey as SubscriptionTier;
      const plan = SUBSCRIPTION_PLANS[tier];
      if (plan.stripePriceIds.monthly) {
          stripePriceIdMap[plan.stripePriceIds.monthly] = tier;
      }
      if (plan.stripePriceIds.annually) {
          stripePriceIdMap[plan.stripePriceIds.annually] = tier;
      }
      // Add quarterly if used
      // if (plan.stripePriceIds.quarterly) {
      //     stripePriceIdMap[plan.stripePriceIds.quarterly] = tier;
      // }
  }


  // Look up the tier based on the stored Stripe Price ID
  const foundTier = stripePriceIdMap[subscription.plan_id];

  // Return the found tier, or default to 'FREE' if the price ID doesn't match any known plan
  return foundTier || 'FREE';
}


/**
 * Checks if a user has access to a specific feature based on their subscription tier.
 * feature: The key of the limit to check (e.g., 'coverLetters', 'resumes').
 * requiredCount: The minimum count needed for the feature (defaults to 1).
 * Returns true if the user has access, false otherwise.
 */
export async function hasSubscriptionAccess(
  userId: string,
  feature: keyof SubscriptionPlan['limits'],
  requiredCount = 1
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const plan = SUBSCRIPTION_PLANS[tier]; // Get the plan details for the user's tier

  // If the tier doesn't correspond to a defined plan (shouldn't happen with FREE default), deny access
  if (!plan) return false;

  const limit = plan.limits[feature]; // Get the specific limit for the feature

  // Handle unlimited access (-1 signifies unlimited)
  if (limit === -1) return true;

  // Handle numeric limits (e.g., number of resumes)
  if (typeof limit === 'number') {
    // Check if the user's limit meets or exceeds the required count
    return limit >= requiredCount;
  }

  // Handle string-based limits (e.g., 'basic', 'all' templates)
  // Assumes any string value other than 'none' (or similar) grants access
  // Adjust this logic based on how you define string-based feature access
  if (typeof limit === 'string') {
      return limit !== 'none'; // Example: Allow access if limit is 'basic' or 'all'
  }

  // Default to no access if limit type is unexpected
  return false;
}

/**
 * Creates a Stripe Checkout Session for initiating a subscription.
 * Redirects the user to Stripe to complete the payment.
 */
export async function createCheckoutSession({
  userId,
  tier,
  interval,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  tier: SubscriptionTier; // The target tier (e.g., 'PRO')
  interval: 'monthly' | 'annually'; // Billing interval ('quarterly' removed)
  successUrl: string; // URL to redirect to on successful payment
  cancelUrl: string; // URL to redirect to if the user cancels
}) {
  // Retrieve or create the Stripe Customer ID associated with the user
  const { stripeCustomerId } = await getOrCreateStripeCustomer(userId);

  // Validate the tier exists in our plans
  if (!SUBSCRIPTION_PLANS[tier]) {
      throw new Error(`Invalid subscription tier specified: ${tier}`);
  }

  // Get the corresponding Stripe Price ID for the selected tier and interval
  const priceId = SUBSCRIPTION_PLANS[tier].stripePriceIds[interval];

  // Ensure a valid Price ID was found
  if (!priceId) {
    throw new Error(`No Stripe Price ID found for tier '${tier}' and interval '${interval}'. Check SUBSCRIPTION_PLANS configuration.`);
  }

  console.log(`Creating checkout for user ${userId}, customer ${stripeCustomerId}, price ${priceId}`);

  // Create the Stripe Checkout Session with no trial period
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,        // Pre-associate with the Stripe customer
    payment_method_types: ['card'],  // Allow card payments
    line_items: [
      {
        price: priceId,              // The specific Price ID for the plan/interval
        quantity: 1,                 // Always 1 for standard subscriptions
      },
    ],
    mode: 'subscription',            // Indicate this is for a recurring subscription
    success_url: successUrl,         // Redirect URL on success
    cancel_url: cancelUrl,           // Redirect URL on cancellation
    metadata: {                      // Store useful information linked to the session
      userId, // Link back to your internal user ID
      tier,
      interval,
    },
    allow_promotion_codes: true,     // Allow users to enter discount codes at checkout
  });

  // Return the created session object (contains the URL for redirection)
  return checkoutSession;
}

/**
 * Retrieves the Stripe Customer ID for a given user ID.
 * If the user doesn't have one, it creates a new Stripe Customer
 * and saves the ID back to the user's profile in Supabase.
 */
async function getOrCreateStripeCustomer(userId: string): Promise<{ stripeCustomerId: string }> {
  const supabase = await getServerClient();

  // Attempt to fetch the user's profile including their Stripe Customer ID
  const { data: profile, error: fetchError } = await supabase
    .from('profiles') // Ensure 'profiles' is your table name
    .select('stripe_customer_id, email, full_name') // Select needed fields
    .eq('id', userId)
    .single(); // Expect exactly one profile

  // Handle potential errors during profile fetch
  if (fetchError || !profile) {
      console.error(`Error fetching profile or profile not found for user ${userId}:`, fetchError);
      throw new Error(`Could not retrieve or find profile for user ${userId}.`);
  }

  // If a Stripe Customer ID already exists, return it
  if (profile.stripe_customer_id) {
    return { stripeCustomerId: profile.stripe_customer_id };
  }

  // If no Stripe Customer ID exists, create a new customer in Stripe
  console.log(`Creating new Stripe customer for user ${userId}`);
  try {
    const customer = await stripe.customers.create({
      email: profile.email, // Use the user's email from the profile
      name: profile.full_name || undefined, // Use the user's name if available
      metadata: {
        userId: userId, // Link the Stripe customer to your internal user ID
      },
    });

    // Save the newly created Stripe Customer ID back to the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      // Log the error but proceed - the customer was created in Stripe
      console.error(`Failed to update profile for user ${userId} with Stripe customer ID ${customer.id}:`, updateError);
    }

    // Return the new Stripe Customer ID
    return { stripeCustomerId: customer.id };

  } catch (stripeError) {
      console.error(`Error creating Stripe customer for user ${userId}:`, stripeError);
      throw new Error('Failed to create Stripe customer.');
  }
}

/**
 * Creates a Stripe Billing Portal Session for a user to manage their subscription
 * (e.g., update payment methods, cancel subscription).
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<stripe.BillingPortal.Session> {
  // Get the user's Stripe Customer ID (ensures customer exists)
  const { stripeCustomerId } = await getOrCreateStripeCustomer(userId);

  console.log(`Creating portal session for customer ${stripeCustomerId}`);

  // Create the Billing Portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId, // The customer who will access the portal
    return_url: returnUrl,      // The URL to redirect the user back to after they exit the portal
    // Optional: Configure allowed actions in the portal
    // configuration: 'YOUR_PORTAL_CONFIGURATION_ID' // If using a specific configuration
    // flow_data: { ... } // For specific flows like subscription cancellation
  });

  return portalSession; // Return the session object (contains the URL)
}