import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
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
  } catch (err: any) {
    console.error('Server error fetching subscriptions:', err);
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