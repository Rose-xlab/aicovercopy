import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { DashboardStats } from '@/types/admin';

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
    // Fetch dashboard statistics
    const stats = await fetchDashboardStats(supabase);
    return NextResponse.json({ stats });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}

// Fetch dashboard statistics
async function fetchDashboardStats(supabase: any): Promise<DashboardStats> {
  // Initialize stats object
  const stats: DashboardStats = {
    userCount: 0,
    activeSubscriptions: 0,
    freeUsers: 0,
    proUsers: 0,
    businessUsers: 0,
    coverLettersCount: 0,
    resumesCount: 0,
    followUpEmailsCount: 0,
    atsScansCount: 0,
    interviewSessionsCount: 0
  };
  
  // Fetch user count
  const { count: userCount, error: userError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  if (userError) throw userError;
  stats.userCount = userCount || 0;
  
  // Fetch subscription stats
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('plan_id, status');
  
  if (subscriptionError) throw subscriptionError;
  
  // Process subscription data
  const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active');
  stats.activeSubscriptions = activeSubscriptions.length;
  
  // Count by plan
  activeSubscriptions.forEach((sub: any) => {
    if (sub.plan_id === 'pro') {
      stats.proUsers++;
    } else if (sub.plan_id === 'business') {
      stats.businessUsers++;
    }
  });
  
  // Free users = total users - users with active subscriptions
  stats.freeUsers = Math.max(0, stats.userCount - stats.activeSubscriptions);
  
  // Fetch cover letter count
  const { count: coverLettersCount, error: coverLettersError } = await supabase
    .from('cover_letters')
    .select('*', { count: 'exact', head: true });
    
  if (coverLettersError) throw coverLettersError;
  stats.coverLettersCount = coverLettersCount || 0;
  
  // Fetch resume count
  const { count: resumesCount, error: resumesError } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true });
    
  if (resumesError) throw resumesError;
  stats.resumesCount = resumesCount || 0;
  
  // Fetch follow-up emails count
  const { count: followUpEmailsCount, error: followUpEmailsError } = await supabase
    .from('follow_up_emails')
    .select('*', { count: 'exact', head: true });
    
  if (followUpEmailsError) throw followUpEmailsError;
  stats.followUpEmailsCount = followUpEmailsCount || 0;
  
  // Fetch ATS scans count
  const { count: atsScansCount, error: atsScansError } = await supabase
    .from('resume_ats_analyses')
    .select('*', { count: 'exact', head: true });
    
  if (atsScansError) throw atsScansError;
  stats.atsScansCount = atsScansCount || 0;
  
  // Fetch interview sessions count
  const { count: interviewSessionsCount, error: interviewSessionsError } = await supabase
    .from('interview_sessions')
    .select('*', { count: 'exact', head: true });
    
  if (interviewSessionsError) throw interviewSessionsError;
  stats.interviewSessionsCount = interviewSessionsCount || 0;
  
  return stats;
}