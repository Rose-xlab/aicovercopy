import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { stripe } from '@/lib/stripe';
// We only need the main Stripe import.
import Stripe from 'stripe';

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
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      sessionId, 
      { expand: ['subscription'] }
    );
    
    if (checkoutSession.status !== 'complete') {
      return NextResponse.json(
        { error: 'Checkout session is not complete' }, 
        { status: 400 }
      );
    }
    
    if (checkoutSession.metadata?.userId !== session.user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', session.user.id)
        .single();
      
      if (!profile || profile.stripe_customer_id !== checkoutSession.customer) {
        return NextResponse.json(
          { error: 'Unauthorized - session does not belong to this user' }, 
          { status: 403 }
        );
      }
    }
    
    // FINAL FIX: This block is rewritten to manually check properties,
    // bypassing the TypeScript type collision issue entirely.
    const subscription = checkoutSession.subscription as any; // Treat as 'any' to avoid type errors
    let subscriptionDetails = null;
    let subscriptionId = null;

    // Check if subscription is an object and has the properties we need.
    // This is a manual, robust check that doesn't rely on TypeScript's confused type system.
    if (
      subscription && 
      typeof subscription === 'object' &&
      'id' in subscription &&
      'status' in subscription &&
      'current_period_end' in subscription &&
      'cancel_at_period_end' in subscription
    ) {
      subscriptionId = subscription.id;
      subscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } else if (typeof subscription === 'string') {
      // Handle the case where the subscription is just an ID string
      subscriptionId = subscription;
    }

    return NextResponse.json({ 
      success: true,
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        customer: checkoutSession.customer,
        subscription: subscriptionId,
        tier: checkoutSession.metadata?.tier,
        interval: checkoutSession.metadata?.interval,
        paymentIntent: checkoutSession.payment_intent,
        subscriptionData: subscriptionDetails,
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
