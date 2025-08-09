// app/api/resumes/[id]/ats-scanner/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { enforceSubscriptionLimit, trackFeatureUsage } from '@/lib/subscription-enforcement';
import openai from '@/lib/openai';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resumeId } = await params;
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
    
    // ENFORCE SUBSCRIPTION LIMIT
    const { success, error: limitError, usage } = await enforceSubscriptionLimit(
      session.user.id, 
      'atsScans'
    );
    
    if (!success) {
      return NextResponse.json(
        { 
          error: limitError || 'ATS scan limit reached',
          upgradeUrl: '/pricing',
          feature: 'atsScans',
          usage
        }, 
        { status: 403 }
      );
    }
    
    // Get request body
    const { jobDescription } = await request.json();
    
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' }, 
        { status: 400 }
      );
    }
    
    // Fetch the resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', session.user.id)
      .single();
    
    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Perform ATS analysis using OpenAI
    const systemPrompt = `You are an ATS (Applicant Tracking System) analyzer. Analyze the resume against the job description and provide:
    1. Overall compatibility score (0-100)
    2. Keyword matches found
    3. Missing important keywords
    4. Formatting issues
    5. Suggestions for improvement
    
    Return a JSON object with these fields:
    {
      "overall": {
        "score": number,
        "summary": string
      },
      "keywords": {
        "found": string[],
        "missing": string[],
        "score": number
      },
      "formatting": {
        "issues": string[],
        "score": number
      },
      "suggestions": string[]
    }`;
    
    const userPrompt = `
    Job Description:
    ${jobDescription}
    
    Resume Content:
    ${JSON.stringify(resume, null, 2)}
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    
    const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Save analysis to database
    const { error: saveError } = await supabase
      .from('resume_ats_analyses')
      .insert({
        user_id: session.user.id,
        resume_id: resumeId,
        job_description: jobDescription,
        analysis_result: analysisResult,
        created_at: new Date().toISOString()
      });
    
    if (saveError) {
      console.error('Error saving ATS analysis:', saveError);
      // Continue - saving is non-critical
    } else {
      // Track usage only after successful analysis
      await trackFeatureUsage(session.user.id, 'atsScans');
    }
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
    
  } catch (error: any) {
    console.error('Error performing ATS scan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform ATS scan' },
      { status: 500 }
    );
  }
}

// GET recent analyses for a resume
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resumeId } = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Fetch recent analyses
    const { data, error } = await supabase
      .from('resume_ats_analyses')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ analyses: data || [] });
    
  } catch (error: any) {
    console.error('Error fetching ATS analyses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}