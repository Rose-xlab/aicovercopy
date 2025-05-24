// app/api/stripe/create-checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { SubscriptionTier } from '@/types/subscription'; // Ensure this type path is correct
import { stripe } from '@/lib/stripe'; // Ensure this path to your Stripe initialization is correct

// Define expected environment variables for clarity
const STRIPE_PRO_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID;
const STRIPE_PRO_ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID;
// Add variables for BUSINESS tier if applicable
// const STRIPE_BUSINESS_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID;
// const STRIPE_BUSINESS_ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tier = searchParams.get('tier') as SubscriptionTier; // Cast to your defined type
    const interval = searchParams.get('interval') || 'monthly';
    const redirect = searchParams.get('redirect') || '/dashboard/billing'; // Default redirect path

    // --- Input Validation ---
    // Validate the subscription tier
    if (!tier || !['PRO', 'BUSINESS'].includes(tier)) { // Adjust tiers as needed
      console.warn(`Invalid subscription tier received: ${tier}`);
      return NextResponse.json(
        { error: 'Invalid subscription tier provided.' },
        { status: 400 }
      );
    }

    // Validate the billing interval
    if (!['monthly', 'annually'].includes(interval)) {
      console.warn(`Invalid billing interval received: ${interval}`);
      return NextResponse.json(
        { error: 'Invalid billing interval provided.' },
        { status: 400 }
      );
    }

    // --- Authentication ---
    const cookieStore = cookies(); // Get cookie store instance
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Supabase session error:', sessionError);
        return NextResponse.json({ error: 'Failed to retrieve user session.' }, { status: 500 });
    }

    if (!session) {
      // If user is not authenticated, redirect to login, preserving the original checkout request
      console.log('User not authenticated, redirecting to login.');
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`; // Redirect back to this API route after login
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    // --- Determine Stripe Price ID ---
    let priceId: string | undefined;

    if (tier === 'PRO') {
      if (interval === 'monthly') {
        priceId = STRIPE_PRO_MONTHLY_PRICE_ID;
      } else if (interval === 'annually') {
        priceId = STRIPE_PRO_ANNUAL_PRICE_ID;
      }
    }
    // Add logic for 'BUSINESS' tier if applicable
    /* else if (tier === 'BUSINESS') {
        if (interval === 'monthly') {
            priceId = STRIPE_BUSINESS_MONTHLY_PRICE_ID;
        } else if (interval === 'annually') {
            priceId = STRIPE_BUSINESS_ANNUAL_PRICE_ID;
        }
    } */

    // Check if a valid Price ID was found based on tier/interval and environment variables
    if (!priceId) {
      console.error(`Configuration Error: Stripe Price ID not found for tier '${tier}' and interval '${interval}'. Check environment variables.`);
      const errorUrl = `/error?message=${encodeURIComponent(`Configuration error: Price ID missing for ${tier}/${interval}`)}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // --- Stripe Customer Management ---
    // Get user profile to find or create Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles') // Ensure 'profiles' is your correct table name
      .select('stripe_customer_id, email, full_name') // Select necessary fields
      .eq('id', session.user.id)
      .single(); // Expecting only one profile per user ID

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile.' },
        { status: 500 }
      );
    }

    if (!profile) {
        console.error(`No profile found for user ID: ${session.user.id}`);
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // If the user doesn't have a Stripe customer ID yet, create one
    if (!customerId) {
      console.log(`No Stripe customer ID found for user ${session.user.id}. Creating new customer.`);
      try {
        const customer = await stripe.customers.create({
          email: profile.email || session.user.email, // Use profile email first, fallback to auth email
          name: profile.full_name || undefined, // Optional: provide user's full name
          metadata: {
            userId: session.user.id, // Link Stripe customer to your internal user ID
          },
        });

        customerId = customer.id;
        console.log(`Created Stripe customer ${customerId} for user ${session.user.id}`);

        // Save the new Stripe customer ID back to the user's profile in Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', session.user.id);

        if (updateError) {
          console.error(`Failed to update profile with Stripe customer ID ${customerId} for user ${session.user.id}:`, updateError);
          // Non-critical error, proceed with checkout but log the issue
        }

      } catch (error: any) {
        console.error('Error creating Stripe customer:', error);
        // Redirect to an error page if customer creation fails
        const errorUrl = `/error?message=${encodeURIComponent('Failed to set up billing customer.')}`;
        return NextResponse.redirect(new URL(errorUrl, request.url));
      }
    }

    // --- Stripe Checkout Session Creation ---
    // Define success and cancel URLs
    const origin = request.headers.get('origin') || request.nextUrl.origin; // Get the base URL
    const successUrl = `${origin}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`; // Stripe replaces {CHECKOUT_SESSION_ID}
    const cancelUrl = `${origin}${redirect}`; // Redirect back to the page specified or the default

    try {
      console.log(`Creating Stripe checkout session for customer ${customerId} with price ${priceId}`);
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,             // Associate session with the Stripe customer
        payment_method_types: ['card'],   // Accepted payment methods
        line_items: [
          {
            price: priceId,               // The selected Price ID
            quantity: 1,                  // Typically 1 for subscriptions
          },
        ],
        mode: 'subscription',             // Set mode to 'subscription' for recurring payments
        success_url: successUrl,          // URL on successful payment
        cancel_url: cancelUrl,            // URL if the user cancels
        metadata: {                       // Optional: Store useful info, retrievable via webhooks/API
          userId: session.user.id,
          tier: tier,
          interval: interval,
        },
        allow_promotion_codes: true,      // Allow users to enter discount codes
        // subscription_data: {           // Optional: Add trial period, etc.
        //   trial_period_days: 7
        // }
      });

      // Check if the session URL was created
      if (!checkoutSession.url) {
        console.error('Stripe checkout session creation failed: No URL returned.');
        throw new Error('Failed to generate checkout session URL.');
      }

      console.log(`Redirecting user ${session.user.id} to Stripe Checkout URL.`);
      // Redirect the user to Stripe Checkout
      return NextResponse.redirect(checkoutSession.url);

    } catch (error: any) {
      console.error('Stripe checkout session creation error:', error);
      // Redirect to a generic error page, passing the specific Stripe error message if available
      const errorMessage = error.raw?.message || error.message || 'Could not create payment session.';
      const errorUrl = `/error?message=${encodeURIComponent(errorMessage)}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

  } catch (error: any) {
    // Catch any unexpected errors during the process
    console.error('Unexpected error in /api/stripe/create-checkout:', error);
    const errorUrl = `/error?message=${encodeURIComponent('An unexpected error occurred.')}`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}
