import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId'); // Optional filter by resume
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' }, 
        { status: 401 }
      );
    }
    
    // Build query
    let query = supabase
      .from('interview_sessions')
      .select(`
        id,
        job_title,
        job_description,
        interview_type,
        difficulty,
        created_at,
        resume_id,
        resumes(title)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    // Add resume filter if provided
    if (resumeId) {
      query = query.eq('resume_id', resumeId);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching interview history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interview history' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ sessions: data || [] });
  } catch (error: any) {
    console.error('Error fetching interview history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interview history' },
      { status: 500 }
    );
  }
}