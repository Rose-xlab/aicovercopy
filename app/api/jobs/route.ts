import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getJob, convertNavJobToJob } from '@/lib/nav-api';
import openai from '@/lib/openai';
import { Job } from '@/types/jobs';

export async function GET(request: NextRequest) {
  try {
    // Extract job ID from search params instead of route params
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('id');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get user auth status
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Fetch job details from NAV API
    const navJob = await getJob(jobId);

    // Convert to our Job format
    let job = convertNavJobToJob(navJob);

    // Enhance job details with additional information
    job = await enhanceJobDetails(job);

    // If user is authenticated, personalize the job match
    if (userId) {
      job = await personalizeJobMatch(job, userId, supabase);
    } else {
      // For demo or anonymous users, add mock scores and matching
      job = addMockPersonalization(job);
    }

    // Save job view to user history if authenticated
    if (userId) {
      await saveJobViewToHistory(userId, jobId, supabase);
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error(`Error fetching job:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

/**
 * Enhance job details with additional information
 */
async function enhanceJobDetails(job: Job): Promise<Job> {
  try {
    // Use OpenAI to analyze the job description and extract additional details
    const systemPrompt = `
      You are an expert job analyst. Analyze the job description and extract key information.
      Extract the following information:
      1. Requirements (skills, education, experience)
      2. Responsibilities/duties
      3. Skills required for the position

      Return a JSON object with the following structure:
      {
        "requirements": "Bullet list of requirements",
        "duties": "Bullet list of responsibilities",
        "skills": ["Skill1", "Skill2", ...]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: job.description }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      return job; // Return original job if analysis fails
    }

    const analysis = JSON.parse(analysisText);

    // Update job with enhanced details
    return {
      ...job,
      requirements: analysis.requirements || job.requirements,
      duties: analysis.duties || job.duties,
      skills: analysis.skills || job.skills || [],
    };
  } catch (error) {
    console.error('Error enhancing job details:', error);
    return job; // Return original job if enhancement fails
  }
}

/**
 * Personalize job match based on user profile
 */
async function personalizeJobMatch(
  job: Job,
  userId: string,
  supabase: any
): Promise<Job> {
  try {
    // Step 1: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return addMockPersonalization(job); // Fallback to mock data
    }

    // Step 2: Get user CV and LinkedIn data
    // This would be implemented in a real app

    // Step 3: Use OpenAI to generate personalized match information
    // For demo purposes, use mock data

    return addMockPersonalization(job);
  } catch (error) {
    console.error('Error personalizing job match:', error);
    return addMockPersonalization(job); // Fallback to mock data
  }
}

/**
 * Add mock personalization data to job
 */
function addMockPersonalization(job: Job): Job {
  // Generate a mock score between 65% and 95%
  const score = 0.65 + (Math.random() * 0.3);

  // Extract or generate skills if not present
  const skills = job.skills || generateMockSkills();

  // Create a mock match reason
  const matchReason = `Your profile shows strong experience with ${skills[0]} and ${skills[1]}, which are key requirements for this role. Your previous work as a ${job.title.includes('Senior') ? 'senior professional' : 'professional'} aligns well with this ${job.employmentType || 'full-time'} position.`;

  // Create mock highlights
  const highlights = [
    "Matches your skill profile",
    `Located in ${job.location.split(',')[0].trim()}`,
    `${job.employmentType || 'Full-time'} position`,
    job.salary?.min ? "Competitive salary" : "Professional growth opportunity"
  ];

  // Mock salary if not present
  const salary = job.salary || {
    min: 500000 + Math.floor(Math.random() * 200000),
    max: 700000 + Math.floor(Math.random() * 300000),
    currency: "NOK"
  };

  return {
    ...job,
    score,
    skills,
    matchReason,
    highlights,
    salary
  };
}

/**
 * Generate mock skills for demo purposes
 */
function generateMockSkills(): string[] {
  const commonSkills = [
    "Python", "JavaScript", "React", "Node.js", "SQL", "Java", "C#", ".NET",
    "Communication", "Project Management", "Microsoft Office", "Marketing",
    "Customer Service", "Leadership", "Sales", "Teamwork", "Design",
    "UX/UI", "Research", "Analysis", "Accounting", "Finance", "Healthcare",
    "Education", "Engineering", "Problem Solving"
  ];

  // Generate 4-7 random skills
  const numSkills = 4 + Math.floor(Math.random() * 4);
  // FIX: Explicitly type the array
  const skills: string[] = [];

  for (let i = 0; i < numSkills; i++) {
    const randomIndex = Math.floor(Math.random() * commonSkills.length);
    const skill = commonSkills[randomIndex];
    if (!skills.includes(skill)) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Save job view to user history
 */
async function saveJobViewToHistory(
  userId: string,
  jobId: string,
  supabase: any
) {
  try {
    await supabase.from('job_views').insert({
      user_id: userId,
      job_id: jobId,
      viewed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving job view to history:', error);
    // Non-critical error, don't throw
  }
}