import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';

// Combined route handler that handles both list and individual subscription requests
export async function GET(request: NextRequest) {
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
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    
    // If we have an ID parameter, fetch a single subscription
    if (subscriptionId) {
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
    } 
    
    // If no ID parameter, this is a list request
    else {
      const page = searchParams.get('page') || '1';
      const limit = searchParams.get('limit') || '10';
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || 'all';
      const plan = searchParams.get('plan') || 'all';
      const interval = searchParams.get('interval') || 'all';
      
      // Start building the query with a join to the profiles table
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          user:user_id (
            id,
            email,
            full_name,
            first_name,
            last_name
          )
        `, { count: 'exact' });
      
      // Apply filters
      if (status && status !== 'all') {
        if (status === 'expiring_soon') {
          // Filter for subscriptions expiring in the next 7 days
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          
          query = query
            .eq('status', 'active')
            .lt('current_period_end', sevenDaysFromNow.toISOString());
        } else {
          query = query.eq('status', status);
        }
      }
      
      if (plan && plan !== 'all') {
        query = query.eq('plan_id', plan);
      }
      
      if (interval && interval !== 'all') {
        query = query.eq('interval', interval);
      }
      
      // Pagination
      const pageInt = parseInt(page, 10);
      const limitInt = parseInt(limit, 10);
      const offset = (pageInt - 1) * limitInt;
      
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitInt - 1);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      // Post-process for search (since we can't easily search across the joined table in Supabase)
      let filteredData = data;
      if (search && search.trim() !== '') {
        const lowerSearch = search.toLowerCase();
        filteredData = data.filter((sub: any) => 
          (sub.user?.email?.toLowerCase().includes(lowerSearch)) || 
          (sub.user?.full_name?.toLowerCase().includes(lowerSearch)) ||
          (sub.stripe_subscription_id.toLowerCase().includes(lowerSearch))
        );
      }
      
      // Calculate subscription stats
      const stats = calculateSubscriptionStats(data);
      
      // Return paginated results
      return NextResponse.json({
        subscriptions: filteredData,
        total: count || 0,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil((count || 0) / limitInt),
        stats
      });
    }
  } catch (err: any) {
    console.error('Server error fetching subscriptions:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Also implement the PATCH method for updating a subscription
export async function PATCH(request: NextRequest) {
  // Extract the subscription ID from the query parameter
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('id');
  
  if (!subscriptionId) {
    return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
  }
  
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

// Helper function to calculate subscription statistics
function calculateSubscriptionStats(subscriptions: any[]) {
  const stats = {
    total: subscriptions.length,
    active: 0,
    canceled: 0,
    pastDue: 0,
    incomplete: 0,
    pro: 0,
    business: 0,
    monthly: 0,
    quarterly: 0,
    annually: 0,
    cancelAtPeriodEnd: 0,
    expiringNext7Days: 0,
    expiringNext30Days: 0,
    monthlyRevenue: 0,
    quarterlyRevenue: 0,
    annualRevenue: 0
  };
  
  // Set up date thresholds for expiry calculations
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);
  const next30Days = new Date();
  next30Days.setDate(now.getDate() + 30);
  
  // Price constants (simplified)
  const proPriceMonthly = 9.99;
  const businessPriceMonthly = 19.99;
  
  // Calculate stats
  subscriptions.forEach(sub => {
    // Status counts
    if (sub.status === 'active') stats.active++;
    else if (sub.status === 'canceled') stats.canceled++;
    else if (sub.status === 'past_due') stats.pastDue++;
    else if (sub.status === 'incomplete') stats.incomplete++;
    
    // Plan counts
    if (sub.plan_id === 'pro') stats.pro++;
    else if (sub.plan_id === 'business') stats.business++;
    
    // Interval counts
    if (sub.interval === 'monthly') stats.monthly++;
    else if (sub.interval === 'quarterly') stats.quarterly++;
    else if (sub.interval === 'annually') stats.annually++;
    
    // Cancellation counts
    if (sub.cancel_at_period_end) stats.cancelAtPeriodEnd++;
    
    // Expiry counts
    const periodEndDate = new Date(sub.current_period_end);
    if (periodEndDate <= next7Days) stats.expiringNext7Days++;
    if (periodEndDate <= next30Days) stats.expiringNext30Days++;
    
    // Revenue calculations (for active subscriptions only)
    if (sub.status === 'active') {
      const monthlyPrice = sub.plan_id === 'pro' ? proPriceMonthly : 
                           sub.plan_id === 'business' ? businessPriceMonthly : 0;
                           
      // Add to monthly revenue
      stats.monthlyRevenue += monthlyPrice;
      
      // Add to quarterly revenue (3 months)
      stats.quarterlyRevenue += monthlyPrice * 3;
      
      // Add to annual revenue (12 months)
      stats.annualRevenue += monthlyPrice * 12;
    }
  });
  
  // Round revenue to 2 decimal places
  stats.monthlyRevenue = Math.round(stats.monthlyRevenue * 100) / 100;
  stats.quarterlyRevenue = Math.round(stats.quarterlyRevenue * 100) / 100;
  stats.annualRevenue = Math.round(stats.annualRevenue * 100) / 100;
  
  return stats;
}