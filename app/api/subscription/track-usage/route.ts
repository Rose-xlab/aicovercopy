// app/api/subscription/track-usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { trackFeatureUsage, LimitedFeature } from '@/lib/subscription-enforcement';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature } = await request.json();
    
    if (!feature || !['coverLetters', 'resumes', 'atsScans', 'interviewSessions'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature specified' }, { status: 400 });
    }

    const result = await trackFeatureUsage(session.user.id, feature as LimitedFeature);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to track usage' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Usage tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}