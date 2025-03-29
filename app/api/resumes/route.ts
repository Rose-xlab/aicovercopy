// app/api/resumes/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import resumeAIService from '@/lib/resume-ai-service';
import { ResumeData, PersonalInformation } from '@/types/resume';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all resumes for the user
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const { resumeData, generateFull, personalInfo, targetPosition, industry } = await request.json();
    
    let finalResumeData: ResumeData;
    
    if (generateFull && personalInfo) {
      // Generate a complete resume based on basic information
      finalResumeData = await resumeAIService.generateBasicResume(
        personalInfo as PersonalInformation,
        targetPosition,
        industry
      );
      
      // Set the user ID
      finalResumeData.userId = session.user.id;
      
      // Set a default template ID if not provided
      if (!finalResumeData.templateId) {
        // Get the first available template
        const { data: templates } = await supabase
          .from('resume_templates')
          .select('id')
          .eq('is_public', true)
          .limit(1);
        
        if (templates && templates.length > 0) {
          finalResumeData.templateId = templates[0].id;
        }
      }
    } else if (resumeData) {
      // Use the provided resume data
      finalResumeData = resumeData as ResumeData;
      finalResumeData.userId = session.user.id;
    } else {
      return NextResponse.json(
        { error: 'Either resumeData or personalInfo must be provided' },
        { status: 400 }
      );
    }
    
    // Insert the resume into the database
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: finalResumeData.userId,
        title: finalResumeData.title,
        personal_info: finalResumeData.personalInfo,
        work_experience: finalResumeData.workExperience,
        education: finalResumeData.education,
        skills: finalResumeData.skills,
        projects: finalResumeData.projects || null,
        languages: finalResumeData.languages || null,
        certifications: finalResumeData.certifications || null,
        interests: finalResumeData.interests || null,
        reference_text: finalResumeData.referenceText || null,
        template_id: finalResumeData.templateId,
        is_public: finalResumeData.isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resume' },
      { status: 500 }
    );
  }
}