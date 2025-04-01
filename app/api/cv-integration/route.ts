// app/api/cv-integration/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * API route to link an existing CV to a resume or vice versa
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { cvId, resumeId, operation } = await request.json();
    
    if (!cvId && !resumeId) {
      return NextResponse.json({ error: 'CV ID or Resume ID is required' }, { status: 400 });
    }
    
    // Link CV to Resume
    if (operation === 'link' && cvId && resumeId) {
      // Check if both CV and resume exist and belong to the user
      const { data: cv, error: cvError } = await supabase
        .from('user_cvs')
        .select('*')
        .eq('id', cvId)
        .eq('user_id', session.user.id)
        .single();
      
      if (cvError) {
        return NextResponse.json({ error: 'CV not found or access denied' }, { status: 404 });
      }
      
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', session.user.id)
        .single();
      
      if (resumeError) {
        return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
      }
      
      // Update the CV with the resume ID
      const { error: updateError } = await supabase
        .from('user_cvs')
        .update({ resume_id: resumeId })
        .eq('id', cvId);
      
      if (updateError) {
        return NextResponse.json({ error: 'Failed to link CV to resume' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'CV linked to resume successfully' 
      });
    }
    
    // Get related CV from a resume
    if (operation === 'get_cv' && resumeId) {
      const { data, error } = await supabase
        .from('user_cvs')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', session.user.id);
      
      if (error) {
        return NextResponse.json({ error: 'Failed to fetch related CV' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        cv: data && data.length > 0 ? data[0] : null
      });
    }
    
    // Get related resume from a CV
    if (operation === 'get_resume' && cvId) {
      // First get the CV to find the resume_id
      const { data: cv, error: cvError } = await supabase
        .from('user_cvs')
        .select('resume_id')
        .eq('id', cvId)
        .eq('user_id', session.user.id)
        .single();
      
      if (cvError) {
        return NextResponse.json({ error: 'CV not found or access denied' }, { status: 404 });
      }
      
      if (!cv.resume_id) {
        return NextResponse.json({ 
          success: false, 
          message: 'No resume linked to this CV' 
        });
      }
      
      // Get the resume
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', cv.resume_id)
        .eq('user_id', session.user.id)
        .single();
      
      if (resumeError) {
        return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        resume
      });
    }
    
    // Unlink a CV from a resume
    if (operation === 'unlink' && cvId) {
      const { error } = await supabase
        .from('user_cvs')
        .update({ resume_id: null })
        .eq('id', cvId)
        .eq('user_id', session.user.id);
      
      if (error) {
        return NextResponse.json({ error: 'Failed to unlink CV from resume' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'CV unlinked from resume successfully' 
      });
    }
    
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in CV integration API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}