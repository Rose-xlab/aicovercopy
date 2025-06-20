import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      sessionId, 
      { expand: ['subscription', 'customer'] } // Expand related objects
    );
    
    // Verify the session is completed and belongs to this user
    if (checkoutSession.status !== 'complete') {
      return NextResponse.json(
        { error: 'Checkout session is not complete' }, 
        { status: 400 }
      );
    }
    
    // Check if the customer matches (for security)
    if (checkoutSession.metadata?.userId !== session.user.id) {
      // Get the customer from the database as fallback check
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', session.user.id)
        .single();
      
      // If the customer ID doesn't match either, reject
      if (!profile || profile.stripe_customer_id !== checkoutSession.customer) {
        return NextResponse.json(
          { error: 'Unauthorized - session does not belong to this user' }, 
          { status: 403 }
        );
      }
    }
    
    // Get subscription details
    let subscriptionData = null;
    if (checkoutSession.subscription) {
      try {
        subscriptionData = await stripe.subscriptions.retrieve(
          checkoutSession.subscription as string
        );
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }
    
    // Session is valid
    return NextResponse.json({ 
      success: true,
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        customer: checkoutSession.customer,
        subscription: checkoutSession.subscription,
        tier: checkoutSession.metadata?.tier,
        interval: checkoutSession.metadata?.interval,
        paymentIntent: checkoutSession.payment_intent,
        // Include expanded subscription data if available
        subscriptionData: subscriptionData ? {
          status: subscriptionData.status,
          currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
        } : null,
      }
    });
  } catch (error: any) {
    console.error('Error verifying checkout session:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout session' }, 
      { status: 500 }
    );
  }
}