import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  try {
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
    
    // Parse request body
    const body = await request.json();
    const { 
      resumeId, 
      jobTitle, 
      jobDescription, 
      interviewType, 
      difficulty,
      questions 
    } = body;
    
    // Validate required fields
    if (!resumeId || !jobTitle || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Check if the resume belongs to the user
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error('Error validating resume ownership:', resumeError);
      return NextResponse.json(
        { error: 'Failed to validate resume ownership' }, 
        { status: 500 }
      );
    }
    
    if (resume.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to use this resume' }, 
        { status: 403 }
      );
    }
    
    // Insert the interview session
    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: session.user.id,
        resume_id: resumeId,
        job_title: jobTitle,
        job_description: jobDescription,
        interview_type: interviewType,
        difficulty,
        questions_answers: questions,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving interview session:', error);
      return NextResponse.json(
        { error: 'Failed to save interview session' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving interview session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save interview session' },
      { status: 500 }
    );
  }
}