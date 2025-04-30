// app/api/resumes/ats-scanner/history/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');
    
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get previous analyses for this resume
    const { data, error } = await supabase
      .from('resume_ats_analyses')
      .select('job_description, analysis_result, created_at')
      .eq('resume_id', resumeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching ATS analyses history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis history' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ analyses: data || [] });
  } catch (error: any) {
    console.error('Error in ATS analysis history route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}