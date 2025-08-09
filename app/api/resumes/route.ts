// app/api/resumes/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { mapResumeToDatabase, mapDatabaseToResumeData } from '@/lib/resume-mappers';
import { ResumeData } from '@/types/resume';
import { v4 as uuidv4 } from 'uuid';
import { enforceSubscriptionLimit, trackFeatureUsage } from '@/lib/subscription-enforcement';

// GET all resumes for the authenticated user
export async function GET(request: Request) {
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
    
    // Get all resumes for the user
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching resumes:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch resumes' }, 
        { status: 500 }
      );
    }
    
    // Map database format to application format
    const resumesData = data.map(resume => mapDatabaseToResumeData(resume));
    
    return NextResponse.json(resumesData);
  } catch (error: any) {
    console.error('Error in GET /api/resumes:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Create a new resume
export async function POST(request: Request) {
  try {
    console.log('Creating new resume');
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
    
    // ENFORCE SUBSCRIPTION LIMIT - Check BEFORE creating
    const { success, error: limitError, usage } = await enforceSubscriptionLimit(
      session.user.id, 
      'resumes'
    );
    
    if (!success) {
      return NextResponse.json(
        { 
          error: limitError || 'Resume limit reached',
          upgradeUrl: '/pricing',
          feature: 'resumes',
          usage
        }, 
        { status: 403 }
      );
    }
    
    // Get request body - only expect resumeData field
    const { resumeData } = await request.json();
    
    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' }, 
        { status: 400 }
      );
    }
    
    // Add user ID and generate new resume ID if not provided
    const completeResumeData: ResumeData = {
      ...resumeData,
      id: resumeData.id || uuidv4(),
      userId: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Convert to database format
    const dbResumeData = mapResumeToDatabase(completeResumeData);
    
    if (dbResumeData) {
      const typedDbData = dbResumeData as Record<string, any>;
      
      // Ensure template_id is either a valid UUID or null
      if (!typedDbData.template_id || typedDbData.template_id === "") {
        typedDbData.template_id = null;
      }
      
      // If source_cv is empty, set it to null
      if (typedDbData.source_cv === "") {
        typedDbData.source_cv = null;
      }
      
      // Ensure all UUID fields that might be empty strings are converted to null
      const uuidFields = ['id', 'template_id', 'source_cv'];
      for (const field of uuidFields) {
        if (typedDbData[field] === "") {
          typedDbData[field] = null;
        }
      }
    }
    
    // Insert into database
    const { data, error } = await supabase
      .from('resumes')
      .insert(dbResumeData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating resume:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create resume' }, 
        { status: 500 }
      );
    }
    
    // TRACK USAGE - Only track after successful creation
    await trackFeatureUsage(session.user.id, 'resumes');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in POST /api/resumes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resume' },
      { status: 500 }
    );
  }
}