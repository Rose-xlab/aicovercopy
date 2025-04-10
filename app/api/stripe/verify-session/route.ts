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
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify the session is completed and belongs to this user
    // Note: In a real app, you would verify the customer ID matches the user
    if (checkoutSession.status !== 'complete') {
      return NextResponse.json(
        { error: 'Checkout session is not complete' }, 
        { status: 400 }
      );
    }
    
    // Session is valid
    return NextResponse.json({ 
      success: true,
      session: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        customer: checkoutSession.customer,
        subscription: checkoutSession.subscription,
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