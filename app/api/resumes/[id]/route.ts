// app/api/resumes/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Query for the resume
    let query = supabase
      .from('resumes')
      .select(`
        *,
        resume_templates(*)
      `)
      .eq('id', resumeId);
    
    // If user is not authenticated, only fetch public resumes
    if (!session) {
      query = query.eq('is_public', true);
    } else {
      // If authenticated, fetch public resumes or user's own resumes
      query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Resume not found or you do not have access' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const resumeData = await request.json();
    
    // Check if the resume exists and belongs to the user
    const { data: existingResume, error: fetchError } = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();
    
    if (fetchError || !existingResume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    
    if (existingResume.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own resumes' },
        { status: 403 }
      );
    }
    
    // Update the resume
    const { data, error } = await supabase
      .from('resumes')
      .update({
        title: resumeData.title,
        personal_info: resumeData.personalInfo,
        work_experience: resumeData.workExperience,
        education: resumeData.education,
        skills: resumeData.skills,
        projects: resumeData.projects || null,
        languages: resumeData.languages || null,
        certifications: resumeData.certifications || null,
        interests: resumeData.interests || null,
        references: resumeData.references || null,
        template_id: resumeData.templateId,
        is_public: resumeData.isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the resume exists and belongs to the user
    const { data: existingResume, error: fetchError } = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();
    
    if (fetchError || !existingResume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    
    if (existingResume.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own resumes' },
        { status: 403 }
      );
    }
    
    // Delete the resume
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete resume' },
      { status: 500 }
    );
  }
}