import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { ActivityEvent } from '@/types/admin';

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
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Fetch recent activities
    const activities = await fetchRecentActivities(supabase, limit);
    return NextResponse.json({ activities });
  } catch (err: any) {
    console.error('Error fetching activities:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch recent activities' }, { status: 500 });
  }
}

// Fetch recent activities
async function fetchRecentActivities(supabase: any, limit: number): Promise<ActivityEvent[]> {
  try {
    // Fetch from activity_logs table
    const { data: logData, error: logError } = await supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        details,
        created_at,
        profiles:user_id (email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (logError) throw logError;
    
    // Transform data into ActivityEvent format
    const activities: ActivityEvent[] = (logData || []).map((log: any) => {
      // Determine activity type based on event_type
      let type: ActivityEvent['type'] = 'user_created';
      
      if (log.event_type.includes('cover_letters')) {
        type = 'cover_letter_created';
      } else if (log.event_type.includes('resumes')) {
        type = 'resume_created';
      } else if (log.event_type.includes('subscriptions')) {
        type = 'subscription_updated';
      } else if (log.event_type.includes('resume_ats_analyses')) {
        type = 'ats_scan';
      } else if (log.event_type.includes('interview_sessions')) {
        type = 'interview_session';
      } else if (log.event_type.includes('follow_up_emails')) {
        type = 'follow_up_email';
      } else if (log.event_type.includes('profiles')) {
        type = 'user_created';
      }
      
      return {
        id: log.id,
        type,
        user_id: log.user_id,
        user_email: log.profiles?.email,
        details: log.details,
        timestamp: log.created_at
      };
    });
    
    return activities;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}