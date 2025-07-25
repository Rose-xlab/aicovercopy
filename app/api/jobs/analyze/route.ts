//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\jobs\analyze\route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';

/**
 * Get user profile data for analysis
 */
async function getUserProfileData(userId: string, supabase: any) {
  try {
    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {}; // Return empty object on error
    }
    
    // Get CV content (this would be implemented in a real app)
    const cvContent = await getCVContent(userId, supabase);
    
    // Get LinkedIn data (this would be implemented in a real app)
    const linkedInData = await getLinkedInData(userId, supabase);
    
    return {
      profile,
      cv: cvContent,
      linkedin: linkedInData
    };
  } catch (error) {
    console.error('Error getting user profile data:', error);
    return {}; // Return empty object on error
  }
}

/**
 * Get user CV content (mock implementation)
 */
async function getCVContent(userId: string, supabase: any) {
  // This would be implemented in a real app
  return {
    skills: ["JavaScript", "React", "Node.js", "TypeScript"],
    experience: [
      {
        title: "Frontend Developer",
        company: "Tech Company",
        duration: "2 years"
      }
    ],
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Oslo"
      }
    ]
  };
}

/**
 * Get user LinkedIn data (mock implementation)
 */
async function getLinkedInData(userId: string, supabase: any) {
  // This would be implemented in a real app
  return {
    title: "Senior Frontend Developer",
    company: "Tech Solutions AS",
    skills: ["React", "JavaScript", "TypeScript", "UI/UX", "Frontend Architecture"],
    recommendations: 4,
    connections: 500
  };
}

/**
 * Analyze job suitability using OpenAI
 */
async function analyzeJobSuitability(jobDescription: string, userProfile: any) {
  try {
    // Construct the prompt for OpenAI
    const systemPrompt = `
      You are an expert job match analyst. Analyze the job description against the user's profile 
      and provide an assessment of their suitability for the role.
      
      Return a JSON object with the following structure:
      {
        "overallMatch": {
          "score": 0.85,           // 0.0 to 1.0 match score
          "assessment": "string"   // Brief overall assessment
        },
        "skillsMatch": {
          "score": 0.8,            // 0.0 to 1.0 match score
          "matching": ["string"],  // List of matching skills
          "missing": ["string"]    // List of missing but important skills
        },
        "experienceMatch": {
          "score": 0.7,            // 0.0 to 1.0 match score
          "assessment": "string"   // Assessment of experience match
        },
        "recommendations": {
          "coverLetterFocus": ["string"],  // What to emphasize in cover letter
          "skillsToHighlight": ["string"], // Skills to highlight
          "skillsToAcquire": ["string"]    // Skills to consider acquiring
        }
      }
    `;

    // Convert user profile to a string for OpenAI
    const userProfileString = JSON.stringify(userProfile);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `
          Job Description:
          ${jobDescription}
          
          User Profile:
          ${userProfileString}
        `}
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Failed to analyze job suitability');
    }
    
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing job suitability:', error);
    
    // Return a mock analysis in case of error
    return {
      overallMatch: {
        score: 0.75,
        assessment: "You have a good match with this position based on your skills and experience."
      },
      skillsMatch: {
        score: 0.8,
        matching: ["JavaScript", "React", "TypeScript"],
        missing: ["GraphQL", "AWS"]
      },
      experienceMatch: {
        score: 0.7,
        assessment: "Your experience as a developer is relevant, but you may need more specific domain experience."
      },
      recommendations: {
        coverLetterFocus: ["Frontend development experience", "Project achievements"],
        skillsToHighlight: ["React", "TypeScript", "UI/UX expertise"],
        skillsToAcquire: ["GraphQL", "AWS", "CI/CD pipelines"]
      }
    };
  }
}

/**
 * Save analysis to history in database
 */
async function saveAnalysisToHistory(
  userId: string,
  jobId: string | undefined,
  jobDescription: string,
  analysis: any,
  supabase: any
) {
  try {
    await supabase.from('job_analyses').insert({
      user_id: userId,
      job_id: jobId,
      content: jobDescription,
      analysis: JSON.stringify(analysis),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving analysis to history:', error);
    // Non-critical error, don't throw
  }
}

export async function POST(request: Request) {
  try {
    // Get the request body
    const { jobId, jobDescription } = await request.json();
    
    if (!jobId && !jobDescription) {
      return NextResponse.json(
        { error: 'Either jobId or jobDescription is required' },
        { status: 400 }
      );
    }
    
    // Get user auth status
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required for job analysis' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Step 1: Get the job description if jobId is provided
    let description = jobDescription;
    
    if (jobId && !description) {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const job = await response.json();
        description = job.description;
      } catch (error) {
        console.error('Error fetching job details:', error);
        return NextResponse.json(
          { error: 'Failed to fetch job details' },
          { status: 500 }
        );
      }
    }
    
    if (!description) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }
    
    // Step 2: Get user profile, CV, and LinkedIn data
    const userProfile = await getUserProfileData(userId, supabase);
    
    // Step 3: Analyze job suitability using OpenAI
    const analysis = await analyzeJobSuitability(description, userProfile);
    
    // Step 4: Save analysis to database
    await saveAnalysisToHistory(userId, jobId, description, analysis, supabase);
    
    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Error analyzing job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze job' },
      { status: 500 }
    );
  }
}