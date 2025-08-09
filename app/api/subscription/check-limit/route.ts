// app/api/subscription/check-limit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { canAccessFeature, LimitedFeature } from '@/lib/subscription-enforcement';

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

    const result = await canAccessFeature(session.user.id, feature as LimitedFeature);
    
    return NextResponse.json({ 
      allowed: result.allowed,
      reason: result.reason,
      usage: result.usage
    });

  } catch (error) {
    console.error('Error checking limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}