// app/api/resumes/ats-scanner/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Parse request body
    const { resumeId, jobDescription } = await request.json();
    
    if (!resumeId && !jobDescription) {
      return NextResponse.json(
        { error: 'Resume ID or job description is required' },
        { status: 400 }
      );
    }
    
    // Get resume data
    let resumeData;
    if (resumeId) {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Resume not found' },
          { status: 404 }
        );
      }
      
      // Verify ownership or public access
      if (!data.is_public && data.user_id !== userId) {
        return NextResponse.json(
          { error: 'You do not have access to this resume' },
          { status: 403 }
        );
      }
      
      resumeData = data;
    }
    
    // Analyze resume against job description
    const analysis = await analyzeResumeForATS(resumeData, jobDescription);
    
    // Log the analysis if user is authenticated
    if (userId) {
      try {
        await supabase
          .from('resume_ats_analyses')
          .insert({
            user_id: userId,
            resume_id: resumeId,
            job_description: jobDescription,
            analysis_result: analysis,
            created_at: new Date().toISOString(),
          });
      } catch (error: unknown) {
        console.error('Error logging ATS analysis:', error);
        // Non-critical error, continue
      }
    }
    
    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Error analyzing resume for ATS:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}

/**
 * Analyze resume for ATS compatibility against a job description
 */
async function analyzeResumeForATS(resumeData: any, jobDescription: string) {
  try {
    const systemPrompt = `
      You are an expert ATS (Applicant Tracking System) analysis tool.
      Your task is to evaluate a resume against a job description to determine:
      
      1. How well the resume will perform in automated ATS screening
      2. Key missing keywords and skills from the job description
      3. Formatting issues that might cause problems with ATS
      4. Specific recommendations to improve the resume
      
      Return a JSON object with the following structure:
      {
        "overall": {
          "score": 0.85,           // 0.0 to 1.0 compatibility score
          "summary": "string"      // Brief overall assessment
        },
        "keywords": {
          "found": ["string"],     // Keywords found in the resume
          "missing": ["string"],   // Important keywords missing from the resume
          "recommended": ["string"] // Recommended keywords to add
        },
        "formatting": {
          "issues": ["string"],    // Formatting issues that might affect ATS
          "suggestions": ["string"] // Suggestions to fix formatting
        },
        "sections": {
          "missing": ["string"],   // Important sections missing from the resume
          "suggestions": ["string"] // Suggestions for section improvements
        },
        "improvements": ["string"]  // Overall improvement recommendations
      }
    `;

    const userPrompt = `
      Job Description:
      ${jobDescription}
      
      Resume Data:
      ${JSON.stringify(resumeData, null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Failed to analyze resume');
    }

    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing resume for ATS:', error);
    
    // Provide a fallback analysis with default values
    return {
      "overall": {
        "score": 0.5,
        "summary": "Unable to complete thorough analysis. Please try again later."
      },
      "keywords": {
        "found": [],
        "missing": [],
        "recommended": ["Review job description carefully and include relevant keywords"]
      },
      "formatting": {
        "issues": ["Unable to analyze formatting issues"],
        "suggestions": ["Ensure resume uses a clean, simple format compatible with ATS systems"]
      },
      "sections": {
        "missing": [],
        "suggestions": ["Include all standard resume sections: contact info, summary, experience, education, skills"]
      },
      "improvements": ["Use a standard ATS-friendly format", "Include relevant keywords from the job description"]
    };
  }
}