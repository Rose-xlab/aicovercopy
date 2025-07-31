import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
// Ensure you have STRIPE_SECRET_KEY in your .env.local file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // FIX: Updated the API version to match the one required by your installed Stripe library.
  apiVersion: '2025-03-31.basil',
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the user's profile to get their Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const stripeCustomerId = profile.stripe_customer_id;

    if (!stripeCustomerId) {
        return NextResponse.json({ error: 'Stripe customer ID not found for this user.' }, { status: 400 });
    }

    // Parse the request body to get the return URL
    const { returnUrl } = await request.json();
    
    // Default return URL is the dashboard billing page
    const defaultReturnUrl = `${request.nextUrl.origin}/dashboard/billing`;
    
    // Create the portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    });
    
    // Return the URL to redirect the user to the portal
    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' }, 
      { status: 500 }
    );
  }
}
