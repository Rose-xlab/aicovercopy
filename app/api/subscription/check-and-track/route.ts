// app/api/subscription/check-and-track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { trackFeatureUsage, LimitedFeature } from '@/lib/subscription-enforcement';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get feature from request body
    const { feature } = await request.json();
    
    if (!feature || !['coverLetters', 'resumes', 'atsScans', 'interviewSessions'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature specified' }, { status: 400 });
    }

    // Check and track usage
    const result = await trackFeatureUsage(session.user.id, feature as LimitedFeature);
    
    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: result.reason || 'Feature limit exceeded',
          allowed: false,
          upgradeUrl: '/pricing'
        }, 
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      allowed: true,
      message: 'Feature access granted and usage tracked' 
    });

  } catch (error) {
    console.error('Error in check-and-track:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// app/api/user/usage/route.ts
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import the function
    const { getAllFeatureUsage } = await import('@/lib/subscription-enforcement');
    
    // Get all feature usage
    const usage = await getAllFeatureUsage(session.user.id);
    
    return NextResponse.json(usage);

  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' }, 
      { status: 500 }
    );
  }
}