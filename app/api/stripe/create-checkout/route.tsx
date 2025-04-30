import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createCheckoutSession } from '@/lib/subscription';
import { SubscriptionTier } from '@/types/subscription';

export async function GET(request: NextRequest) {
  try {
    // Get the subscription tier and interval from query params
    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get('tier') as SubscriptionTier;
    const interval = searchParams.get('interval') || 'monthly';
    
    if (!tier) {
      return NextResponse.json({ error: 'Subscription tier is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to login if not authenticated
      const redirectUrl = `/auth/login?redirect=/pricing&tier=${tier}&interval=${interval}`;
      return NextResponse.redirect(new URL(redirectUrl, request.nextUrl.origin));
    }
    
    // Set up success and cancel URLs
    const successUrl = `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${request.nextUrl.origin}/checkout/canceled`;
    
    // Create the checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      tier,
      interval: interval as 'monthly' | 'quarterly' | 'annually',
      successUrl,
      cancelUrl,
    });
    
    // Redirect to Stripe Checkout
    return NextResponse.redirect(checkoutSession.url as string);
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Handle errors gracefully
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
}