import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSubscriptionTier, SUBSCRIPTION_PLANS } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
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
    
    const userId = session.user.id;
    
    // Get user's subscription tier to determine limits
    const tier = await getUserSubscriptionTier(userId);
    const planLimits = SUBSCRIPTION_PLANS[tier].limits;
    
    // Get usage counts from database
    const usageStats = await getUsageStats(supabase, userId);
    
    // Format the response
    const response = {
      coverLetters: {
        used: usageStats.coverLettersCount,
        limit: planLimits.coverLetters,
        percentage: calculatePercentage(usageStats.coverLettersCount, planLimits.coverLetters),
      },
      resumes: {
        used: usageStats.resumesCount,
        limit: planLimits.resumes,
        percentage: calculatePercentage(usageStats.resumesCount, planLimits.resumes),
      },
      atsScans: {
        used: usageStats.atsScanCount,
        limit: planLimits.atsScans,
        percentage: calculatePercentage(usageStats.atsScanCount, planLimits.atsScans),
      },
      interviewSessions: {
        used: usageStats.interviewSessionsCount,
        limit: planLimits.interviewSessions,
        percentage: calculatePercentage(usageStats.interviewSessionsCount, planLimits.interviewSessions),
      },
      // Add additional subscription details
      subscription: {
        tier,
        intervalEndsAt: await getSubscriptionEndDate(supabase, userId),
        isUnlimited: tier === 'BUSINESS',
      }
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching user usage:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage information' }, 
      { status: 500 }
    );
  }
}

/**
 * Get usage statistics for a user
 */
async function getUsageStats(supabase: any, userId: string) {
  // Get current billing period
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayStr = firstDayOfMonth.toISOString();
  
  // Count cover letters
  const { count: coverLettersCount, error: coverLettersError } = await supabase
    .from('cover_letters')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstDayStr);
  
  if (coverLettersError) {
    console.error('Error counting cover letters:', coverLettersError);
  }
  
  // Count resumes
  const { count: resumesCount, error: resumesError } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (resumesError) {
    console.error('Error counting resumes:', resumesError);
  }
  
  // Count ATS scans
  const { count: atsScanCount, error: atsScanError } = await supabase
    .from('resume_ats_analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstDayStr);
  
  if (atsScanError) {
    console.error('Error counting ATS scans:', atsScanError);
  }
  
  // Count interview sessions
  const { count: interviewSessionsCount, error: interviewSessionsError } = await supabase
    .from('interview_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstDayStr);
  
  if (interviewSessionsError) {
    console.error('Error counting interview sessions:', interviewSessionsError);
  }
  
  return {
    coverLettersCount: coverLettersCount || 0,
    resumesCount: resumesCount || 0,
    atsScanCount: atsScanCount || 0,
    interviewSessionsCount: interviewSessionsCount || 0,
  };
}

/**
 * Calculate percentage of usage (helper function)
 */
function calculatePercentage(used: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Get subscription end date for the user
 */
async function getSubscriptionEndDate(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.current_period_end;
}