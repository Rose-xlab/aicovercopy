// app/api/resumes/ats-scanner/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import { enforceSubscriptionLimit } from '@/lib/subscription-enforcement';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // ENFORCE SUBSCRIPTION LIMIT if user is authenticated
    if (userId) {
      const { success, error } = await enforceSubscriptionLimit(userId, 'atsScans');
      if (!success) {
        return NextResponse.json(
          { 
            error,
            upgradeUrl: '/pricing',
            feature: 'atsScans'
          }, 
          { status: 403 }
        );
      }
    }
    
    // Parse request body
    const { resumeId, jobDescription } = await request.json();
    
    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: 'Both resume ID and job description are required' },
        { status: 400 }
      );
    }
    
    // Validate job description length
    if (jobDescription.length < 50) {
      return NextResponse.json(
        { error: 'Job description is too short for meaningful analysis. Please provide more details.' },
        { status: 400 }
      );
    }
    
    if (jobDescription.length > 10000) {
      return NextResponse.json(
        { error: 'Job description is too long. Please keep it under 10,000 characters.' },
        { status: 400 }
      );
    }
    
    // Get resume data - only request fields we need for analysis
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .select(`
        id, 
        title, 
        personal_info, 
        work_experience, 
        education, 
        skills, 
        certifications,
        languages,
        user_id,
        is_public
      `)
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error('Error fetching resume:', resumeError);
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership or public access
    if (!resumeData.is_public && resumeData.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this resume' },
        { status: 403 }
      );
    }
    
    // Analyze resume against job description
    try {
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
        } catch (logError: any) {
          console.error('Error logging ATS analysis:', logError);
          // Non-critical error, continue
        }
      }
      
      return NextResponse.json({ analysis });
    } catch (analysisError: any) {
      console.error('Error analyzing resume for ATS:', analysisError);
      
      // Handle specific errors
      if (analysisError.message && analysisError.message.includes('maximum context length')) {
        return NextResponse.json({ 
          error: 'Resume or job description is too detailed for analysis. Try focusing on key information only.' 
        }, { status: 413 });
      }
      
      // Rate limit errors
      if (analysisError.status === 429) {
        return NextResponse.json({ 
          error: 'Analysis service is currently busy. Please try again in a few minutes.' 
        }, { status: 429 });
      }
      
      return NextResponse.json(
        { error: analysisError.message || 'Failed to analyze resume' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error in ATS analysis route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Prepare resume data for ATS analysis by extracting relevant information
 */
function prepareResumeForATSAnalysis(resumeData: any) {
  // Extract personal info
  const personalInfo = {
    name: resumeData.personal_info?.name || '',
    email: resumeData.personal_info?.email || '',
    phone: resumeData.personal_info?.phone || '',
    location: resumeData.personal_info?.location || '',
    title: resumeData.personal_info?.title || '',
  };
  
  // Extract skills
  // Handle different possible formats of skills data
  let skills: string[] = [];
  if (Array.isArray(resumeData.skills)) {
    skills = resumeData.skills;
  } else if (typeof resumeData.skills === 'object' && resumeData.skills !== null) {
    if (Array.isArray(resumeData.skills.items)) {
      skills = resumeData.skills.items;
    } else {
      // Extract skills from object if it has a different structure
      skills = Object.values(resumeData.skills)
        .filter(skill => typeof skill === 'string')
        .map(skill => skill as string);
    }
  }
  
  // Extract work experience
  const workExperience = Array.isArray(resumeData.work_experience) 
    ? resumeData.work_experience.map((job: any) => ({
        title: job.title || '',
        company: job.company || '',
        startDate: job.start_date || job.startDate || '',
        endDate: job.end_date || job.endDate || '',
        description: job.description || '',
        // Include key bullet points, but limit length
        bullets: Array.isArray(job.bullets) ? job.bullets.slice(0, 5) : []
      }))
    : [];
  
  // Extract education
  const education = Array.isArray(resumeData.education)
    ? resumeData.education.map((edu: any) => ({
        degree: edu.degree || '',
        field: edu.field || '',
        institution: edu.institution || '',
        startDate: edu.start_date || edu.startDate || '',
        endDate: edu.end_date || edu.endDate || '',
        description: edu.description || ''
      }))
    : [];
  
  // Extract certifications
  const certifications = Array.isArray(resumeData.certifications)
    ? resumeData.certifications.map((cert: any) => ({
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || ''
      }))
    : [];
  
  // Extract languages
  const languages = Array.isArray(resumeData.languages)
    ? resumeData.languages.map((lang: any) => ({
        language: lang.language || '',
        proficiency: lang.proficiency || ''
      }))
    : [];
  
  return {
    title: resumeData.title || '',
    personalInfo,
    skills,
    workExperience,
    education,
    certifications,
    languages
  };
}

/**
 * Estimate the number of tokens in a text
 * This is a rough approximation as token count varies by model
 */
function estimateTokens(text: string): number {
  // Approximation: 1 token ≈ 4 characters in English
  return Math.ceil(text.length / 4);
}

/**
 * Analyze resume for ATS compatibility against a job description
 */
async function analyzeResumeForATS(resumeData: any, jobDescription: string) {
  try {
    // Prepare resume data by extracting relevant information
    const processedResume = prepareResumeForATSAnalysis(resumeData);
    
    const systemPrompt = `
      You are an expert ATS (Applicant Tracking System) analysis tool.
      Your task is to evaluate a resume against a job description to determine:
      
      1. How well the resume will perform in automated ATS screening
      2. Key missing keywords and skills from the job description
      3. Formatting issues that might cause problems with ATS
      4. Specific recommendations to improve the resume
      
      Be extremely specific, actionable and concise in your feedback.
      For keywords, focus on exact matches and important semantic matches.
      
      Return a JSON object with the following structure:
      {
        "overall": {
          "score": 0.85,           // 0.0 to 1.0 compatibility score
          "summary": "string"      // Brief overall assessment (1-2 sentences)
        },
        "keywords": {
          "found": ["string"],     // Keywords found in the resume (maximum 15)
          "missing": ["string"],   // Important keywords missing from the resume (maximum 10)
          "recommended": ["string"] // Recommended keywords to add (maximum 8)
        },
        "formatting": {
          "issues": ["string"],    // Formatting issues that might affect ATS (maximum 5)
          "suggestions": ["string"] // Suggestions to fix formatting (maximum 5)
        },
        "sections": {
          "missing": ["string"],   // Important sections missing from the resume (maximum 3)
          "suggestions": ["string"] // Suggestions for section improvements (maximum 5)
        },
        "improvements": ["string"]  // Overall improvement recommendations (maximum 5)
      }
    `;

    const userPrompt = `
      Job Description:
      ${jobDescription}
      
      Resume Data:
      ${JSON.stringify(processedResume, null, 2)}
    `;
    
    // Check token count
    const estimatedSystemTokens = estimateTokens(systemPrompt);
    const estimatedUserTokens = estimateTokens(userPrompt);
    const totalEstimatedTokens = estimatedSystemTokens + estimatedUserTokens;
    
    console.log(`Estimated tokens: ${totalEstimatedTokens} (System: ${estimatedSystemTokens}, User: ${estimatedUserTokens})`);
    
    // If too many tokens, reduce the content
    let finalUserPrompt = userPrompt;
    let finalProcessedResume = processedResume;
    
    if (totalEstimatedTokens > 3500) {
      console.log('Token count too high, reducing content...');
      
      // Strategies to reduce token count:
      // 1. Limit work experience descriptions
      finalProcessedResume = {
        ...processedResume,
        workExperience: processedResume.workExperience.map((job: any) => ({
          ...job,
          description: job.description.substring(0, 200) + (job.description.length > 200 ? '...' : ''),
          bullets: job.bullets.slice(0, 3)
        })).slice(0, 3) // Only keep the 3 most recent jobs
      };
      
      // 2. Summarize job description if it's very long
      let trimmedJobDescription = jobDescription;
      if (jobDescription.length > 2000) {
        trimmedJobDescription = jobDescription.substring(0, 2000) + '...';
      }
      
      finalUserPrompt = `
        Job Description:
        ${trimmedJobDescription}
        
        Resume Data:
        ${JSON.stringify(finalProcessedResume, null, 2)}
      `;
      
      console.log(`Reduced estimated tokens: ${estimateTokens(systemPrompt) + estimateTokens(finalUserPrompt)}`);
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Consider using a faster model like "gpt-3.5-turbo" if cost/speed is a concern
      messages: [
        { role: "system", content: systemPrompt + "\n\nYou must respond with a JSON object only, no explanatory text." },
        { role: "user", content: finalUserPrompt }
      ],
      temperature: 0.3
      // Removed response_format parameter which was causing the error
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Failed to generate analysis');
    }

    try {
      // Parse the response as JSON
      const analysis = JSON.parse(analysisText);
      return analysis;
    } catch (jsonError) {
      console.error('Error parsing OpenAI response as JSON:', jsonError, analysisText);
      throw new Error('Failed to parse analysis result');
    }
  } catch (error: any) {
    console.error('Error in analyzeResumeForATS:', error);
    throw error;
  }
}