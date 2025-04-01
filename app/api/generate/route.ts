import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import openai from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data - now with support for jobId parameter
    const { jobDescription, jobId, userProfile, tone = 'professional' } = await request.json();

    // If jobId is provided, fetch the job details
    let finalJobDescription = jobDescription;
    let jobTitle, companyName;
    
    if (jobId) {
      try {
        // Fetch job details from our jobs API
        const response = await fetch(`${request.nextUrl.origin}/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const job = await response.json();
        finalJobDescription = job.description;
        jobTitle = job.title;
        companyName = job.employer;
        
        // Also get the job analysis if available
        try {
          const analysisResponse = await fetch(`${request.nextUrl.origin}/api/jobs/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobId }),
          });
          
          if (analysisResponse.ok) {
            const { analysis } = await analysisResponse.json();
            // Add job analysis to the prompt for better cover letter generation
            finalJobDescription += `\n\nAnalysis of job match:\n${JSON.stringify(analysis)}`;
          }
        } catch (analysisError) {
          // Non-critical, continue without analysis
          console.error('Error fetching job analysis:', analysisError);
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        // Continue with provided job description if available
        if (!finalJobDescription) {
          return NextResponse.json(
            { error: 'Failed to fetch job details and no job description provided' },
            { status: 400 }
          );
        }
      }
    }

    // Modified prompt construction to use English instead of Norwegian
    const prompt = `
      Write a professional cover letter in English with the following parameters:
      
      Job Description:
      ${finalJobDescription}
      
      ${jobTitle ? `Job Title: ${jobTitle}` : ''}
      ${companyName ? `Company: ${companyName}` : ''}
      
      Applicant Profile:
      ${JSON.stringify(userProfile)}
      
      Tone: ${tone}
      
      The cover letter should:
      1. Be formal and professional
      2. Highlight relevant experience and skills
      3. Show enthusiasm for the position
      4. Be written in proper English
      5. Follow standard business letter format
      ${jobId ? '6. Specifically address the requirements and skills mentioned in the job posting' : ''}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert cover letter writer with deep knowledge of the job market and business culture."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const coverLetter = completion.choices[0].message.content;

    // Store the generated cover letter in Supabase
    await supabase.from('cover_letters').insert({
      user_id: session.user.id,
      job_description: finalJobDescription,
      job_id: jobId, // Store reference to the job
      job_title: jobTitle,
      company_name: companyName,
      content: coverLetter,
      tone,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ coverLetter });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}