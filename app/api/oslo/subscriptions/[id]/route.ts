import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const subscriptionId = params.id;
  
  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify admin privileges
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }
  
  try {
    // Get subscription with user details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name,
          first_name,
          last_name,
          created_at,
          updated_at,
          job_title,
          location,
          status
        )
      `)
      .eq('id', subscriptionId)
      .single();
    
    if (subscriptionError) {
      if (subscriptionError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }
    
    // Check if we have a Stripe subscription ID
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        // Fetch additional details from Stripe if available
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id,
          { expand: ['customer', 'latest_invoice'] }
        );
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
        // Continue without Stripe data
      }
    }
    
    // Get invoices for this subscription
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('stripe_subscription_id', subscription.stripe_subscription_id)
      .order('created_at', { ascending: false });
      
    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      // Continue without invoices
    }
    
    return NextResponse.json({
      subscription,
      stripeData: stripeSubscription,
      invoices: invoices || []
    });
  } catch (err: any) {
    console.error('Server error fetching subscription details:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const subscriptionId = params.id;
  
  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify admin privileges
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { 
      status,
      cancelAtPeriodEnd,
      updateStripe,
      extendPeriod,
      extendDays
    } = body;
    
    // Get current subscription
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Add fields to update
    if (status !== undefined) updateData.status = status;
    if (cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = cancelAtPeriodEnd;
    
    // Handle period extension if requested
    if (extendPeriod && extendDays && typeof extendDays === 'number') {
      const currentPeriodEnd = new Date(currentSubscription.current_period_end);
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + extendDays);
      updateData.current_period_end = currentPeriodEnd.toISOString();
    }
    
    // Update subscription in database
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Update Stripe subscription if requested and we have a Stripe subscription ID
    if (updateStripe && currentSubscription.stripe_subscription_id) {
      try {
        // Handle cancellation at period end
        if (cancelAtPeriodEnd !== undefined) {
          if (cancelAtPeriodEnd) {
            await stripe.subscriptions.update(
              currentSubscription.stripe_subscription_id,
              { cancel_at_period_end: true }
            );
          } else {
            // Resume subscription
            await stripe.subscriptions.update(
              currentSubscription.stripe_subscription_id,
              { cancel_at_period_end: false }
            );
          }
        }
        
        // Handle status changes
        if (status === 'canceled' && currentSubscription.status !== 'canceled') {
          // Cancel subscription immediately
          await stripe.subscriptions.cancel(currentSubscription.stripe_subscription_id);
        }
        
      } catch (stripeError) {
        console.error('Error updating Stripe subscription:', stripeError);
        // Continue with the database update even if Stripe update fails
        return NextResponse.json({ 
          subscription: updatedSubscription,
          error: 'Subscription updated in database but Stripe update failed'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ subscription: updatedSubscription });
  } catch (err: any) {
    console.error('Server error updating subscription:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}