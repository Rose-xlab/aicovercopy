import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import { searchJobs, convertNavJobToJob } from '@/lib/nav-api';
import { Job, JobSearchAnalysis } from '@/types/jobs';

export async function POST(request: Request) {
  try {
    // Get the request body
    const { query, location } = await request.json();

    // Get user auth status
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Step 1: Use OpenAI to analyze the search query
    const analysis = await analyzeSearchQuery(query, location);
    
    // Step 2: Use the analysis to search for jobs
    const searchResults = await searchJobs(analysis.navSearchParams);
    
    // Step 3: Convert NAV results to our Job format
    let jobs: Job[] = searchResults.positions.map(convertNavJobToJob);
    
    // Step 4: If user is authenticated, enhance jobs with personalized matching
    if (userId) {
      jobs = await enhanceJobsWithUserProfile(jobs, userId, supabase);
    } else {
      // For demo or anonymous users, add mock scores
      jobs = addMockScores(jobs);
    }
    
    // Step 5: Save the search to user history if authenticated
    if (userId) {
      await saveSearchToHistory(userId, query, location, supabase);
    }
    
    return NextResponse.json({
      jobs,
      analysis,
      totalResults: searchResults.hits,
    });
  } catch (error: any) {
    console.error('Error in job search:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process job search' },
      { status: 500 }
    );
  }
}

/**
 * Use OpenAI to analyze the search query and extract structured parameters
 */
async function analyzeSearchQuery(query: string, location?: string): Promise<JobSearchAnalysis> {
  try {
    const systemPrompt = `
      You are an expert job search assistant. Analyze the user's job search query and extract key information.
      Return a JSON object with the following structure:
      {
        "query": "The original query",
        "parsedQuery": {
          "jobTitles": [],      // List of job titles mentioned or implied
          "skills": [],         // List of skills mentioned
          "locations": [],      // List of locations mentioned
          "industries": [],     // List of industries or sectors mentioned
          "keywords": [],       // Other important keywords for the search
          "experienceLevel": "", // Entry, Junior, Mid, Senior, etc.
          "employmentTypes": [] // Full-time, Part-time, etc.
        },
        "navSearchParams": {    // Parameters for the NAV API
          "q": "",             // The main search query for NAV API
          "place": "",         // Location parameter
          "positions": [],     // Job position titles
          "engagementTypes": [] // Employment types (HELTID, DELTID, etc.)
        }
      }
    `;

    const userPrompt = location 
      ? `Job search query: "${query}". Location preference: "${location}".` 
      : `Job search query: "${query}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Failed to analyze search query');
    }

    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing search query:', error);
    throw error;
  }
}

/**
 * Enhance jobs with user profile information for better matching
 */
async function enhanceJobsWithUserProfile(
  jobs: Job[], 
  userId: string, 
  supabase: any
): Promise<Job[]> {
  try {
    // Step 1: Get user profile and skills
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return addMockScores(jobs); // Fallback to mock data
    }
    
    // Step 2: Get user CV content and LinkedIn
    // This would be a more complex implementation in a real app
    
    // Step 3: Use OpenAI to score job matches based on user profile
    const jobsWithScores = await scoreJobsWithAI(jobs, profile);
    
    return jobsWithScores;
  } catch (error) {
    console.error('Error enhancing jobs with user profile:', error);
    return addMockScores(jobs); // Fallback to mock data
  }
}

/**
 * Use OpenAI to score job matches based on user profile
 */
async function scoreJobsWithAI(jobs: Job[], profile: any): Promise<Job[]> {
  // For demo purposes, we'll use mock scores
  // In a real implementation, this would call OpenAI to analyze each job
  return addMockScores(jobs);
}

/**
 * Add mock relevance scores to jobs for demo purposes
 */
function addMockScores(jobs: Job[]): Job[] {
  return jobs.map((job, index) => {
    // Create a pseudo-random score that looks realistic
    const baseScore = 0.6 + (0.4 * Math.random());
    const score = Math.min(0.99, Math.max(0.4, baseScore));
    
    // Add some skills for demo purposes
    const skills = extractSkillsFromJob(job);
    
    // Add a match reason
    const matchReason = `This ${job.title} position aligns with your experience in ${skills.slice(0, 2).join(' and ')}. The ${job.employmentType || 'full-time'} role at ${job.employer} matches your preferred work arrangement.`;
    
    return {
      ...job,
      score,
      skills,
      matchReason,
      highlights: [
        "Aligns with your experience",
        "Matches your location preferences",
        job.employmentType || "Full-time position",
        "Recently posted opportunity"
      ]
    };
  });
}

/**
 * Extract skills from job description for demo purposes
 */
function extractSkillsFromJob(job: Job): string[] {
  // This is a simplified mock implementation
  // In a real app, you would use NLP or OpenAI to extract skills
  const commonSkills = [
    "Python", "JavaScript", "React", "Node.js", "SQL", "Java", "C#", ".NET",
    "Communication", "Project Management", "Microsoft Office", "Marketing",
    "Customer Service", "Leadership", "Sales", "Teamwork", "Design",
    "UX/UI", "Research", "Analysis", "Accounting", "Finance", "Healthcare",
    "Education", "Engineering", "Problem Solving", "HTML/CSS", "TypeScript"
  ];
  
  // Generate 3-6 random skills
  const numSkills = 3 + Math.floor(Math.random() * 4);
  const skills = [];
  
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
 * Save search query to user history
 */
async function saveSearchToHistory(
  userId: string, 
  query: string, 
  location: string | undefined, 
  supabase: any
) {
  try {
    await supabase.from('job_searches').insert({
      user_id: userId,
      query,
      location: location || null,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving search to history:', error);
    // Non-critical error, don't throw
  }
}