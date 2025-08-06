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
    const tier = searchParams.get('tier') as SubscriptionTier;
    const interval = searchParams.get('interval') || 'monthly';
    const redirect = searchParams.get('redirect') || '/dashboard/billing';

    // --- Input Validation ---
    if (!tier || !['PRO', 'BUSINESS'].includes(tier)) {
      console.warn(`Invalid subscription tier received: ${tier}`);
      return NextResponse.json(
        { error: 'Invalid subscription tier provided.' },
        { status: 400 }
      );
    }

    if (!['monthly', 'annually'].includes(interval)) {
      console.warn(`Invalid billing interval received: ${interval}`);
      return NextResponse.json(
        { error: 'Invalid billing interval provided.' },
        { status: 400 }
      );
    }

    // --- Authentication ---
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase session error:', sessionError);
      return NextResponse.json({ error: 'Failed to retrieve user session.' }, { status: 500 });
    }

    if (!session) {
      console.log('User not authenticated, redirecting to login.');
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    // --- Determine Stripe Price ID ---
    let priceId: string | undefined;

    if (tier === 'PRO') {
      priceId = interval === 'monthly' ? STRIPE_PRO_MONTHLY_PRICE_ID : STRIPE_PRO_ANNUAL_PRICE_ID;
    }
    // Add logic for 'BUSINESS' tier if applicable
    /* else if (tier === 'BUSINESS') {
        priceId = interval === 'monthly' ? STRIPE_BUSINESS_MONTHLY_PRICE_ID : STRIPE_BUSINESS_ANNUAL_PRICE_ID;
    } */

    if (!priceId) {
      console.error(`Configuration Error: Stripe Price ID not found for tier '${tier}' and interval '${interval}'. Check environment variables.`);
      const errorUrl = `/error?message=${encodeURIComponent(`Configuration error: Price ID missing for ${tier}/${interval}`)}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // --- Stripe Customer Management ---
    // Get user profile to find or create Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_customer_id_test, email, full_name') // Fetch both live and test customer IDs
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 });
    }

    if (!profile) {
      console.error(`No profile found for user ID: ${session.user.id}`);
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    // **MODIFIED LOGIC: Determine which customer ID to use based on the environment**
    const isProduction = process.env.NODE_ENV === 'production';
    let customerId = isProduction ? profile.stripe_customer_id : profile.stripe_customer_id_test;
    const mode = isProduction ? 'live' : 'test';

    // If the user doesn't have a Stripe customer ID for the current mode, create one
    if (!customerId) {
      console.log(`No Stripe customer ID found for user ${session.user.id} in ${mode} mode. Creating new customer.`);
      try {
        const customer = await stripe.customers.create({
          email: profile.email || session.user.email,
          name: profile.full_name || undefined,
          metadata: {
            userId: session.user.id,
          },
        });

        customerId = customer.id;
        console.log(`Created Stripe customer ${customerId} for user ${session.user.id} in ${mode} mode.`);

        // **MODIFIED LOGIC: Save the new ID to the correct column in Supabase**
        const updateData = isProduction
            ? { stripe_customer_id: customerId }
            : { stripe_customer_id_test: customerId };

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', session.user.id);

        if (updateError) {
          console.error(`Failed to update profile with Stripe customer ID ${customerId} for user ${session.user.id}:`, updateError);
          // Non-critical error, proceed with checkout but log the issue
        }

      } catch (error: any) {
        console.error(`Error creating Stripe customer in ${mode} mode:`, error);
        const errorUrl = `/error?message=${encodeURIComponent('Failed to set up billing customer.')}`;
        return NextResponse.redirect(new URL(errorUrl, request.url));
      }
    }

    // --- Stripe Checkout Session Creation ---
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const successUrl = `${origin}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${redirect}`;

    try {
      console.log(`Creating Stripe checkout session for customer ${customerId} with price ${priceId} in ${mode} mode.`);
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
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
          userId: session.user.id,
          tier: tier,
          interval: interval,
        },
        allow_promotion_codes: true,
      });

      if (!checkoutSession.url) {
        console.error('Stripe checkout session creation failed: No URL returned.');
        throw new Error('Failed to generate checkout session URL.');
      }

      console.log(`Redirecting user ${session.user.id} to Stripe Checkout URL.`);
      return NextResponse.redirect(checkoutSession.url);

    } catch (error: any) {
      console.error('Stripe checkout session creation error:', error);
      const errorMessage = error.raw?.message || error.message || 'Could not create payment session.';
      const errorUrl = `/error?message=${encodeURIComponent(errorMessage)}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

  } catch (error: any) {
    console.error('Unexpected error in /api/stripe/create-checkout:', error);
    const errorUrl = `/error?message=${encodeURIComponent('An unexpected error occurred.')}`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}
