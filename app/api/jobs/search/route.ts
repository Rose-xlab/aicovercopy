//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\jobs\search\route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import { searchJobsAcrossCompanies } from '@/lib/multi-company-greenhouse-api';
import { Job, JobSearchAnalysis } from '@/types/jobs';

export async function POST(request: Request) {
  try {
    // Get the request body
    const { query, location, industries, companies, isInitialLoad } = await request.json();

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Get user auth status
    const cookieStore = cookies(); // ✅ FIX: Removed 'await'
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    console.log(`${isInitialLoad ? 'Loading initial jobs' : 'Searching'} for: "${query}" across multiple companies...`);

    // Step 1: Use OpenAI to analyze and enhance the search query (skip for initial load to save API calls)
    let analysis: JobSearchAnalysis;
    if (!isInitialLoad) {
      analysis = await analyzeSearchQuery(query, location);
    } else {
      // Simple analysis for initial load
      analysis = {
        originalQuery: query,
        enhancedQuery: query,
        parsedQuery: {
          jobTitles: [query],
          skills: [],
          locations: location ? [location] : [],
          industries: [],
          keywords: [query],
          experienceLevel: "",
          employmentTypes: []
        },
        searchStrategy: {
          primaryTerms: [query],
          alternativeTerms: [],
          filters: {
            departments: [],
            industries: [],
            locations: location ? [location] : []
          }
        }
      };
    }

    // Step 2: Search across multiple companies
    const jobs = await searchJobsAcrossCompanies({
      query: analysis.enhancedQuery || query,
      location,
      industries,
      companies,
      limit: isInitialLoad ? 30 : 50 // Fewer jobs for initial load for faster response
    });

    console.log(`Found ${jobs.length} jobs total`);

    // Step 3: If user is authenticated, enhance jobs with personalized matching
    let enhancedJobs = jobs;
    if (userId && !isInitialLoad) {
      // Only do personalized matching for actual searches, not initial load
      enhancedJobs = await enhanceJobsWithUserProfile(jobs, userId, supabase);
    } else {
      // For anonymous users or initial load, add basic mock scores
      enhancedJobs = addBasicScores(jobs);
    }

    // Step 4: Save the search to user history if authenticated (but not for initial loads)
    if (userId && !isInitialLoad) {
      await saveSearchToHistory(userId, query, location, supabase);
    }

    return NextResponse.json({
      jobs: enhancedJobs,
      analysis,
      totalResults: enhancedJobs.length,
      companiesSearched: getUniqueCompanies(enhancedJobs),
      isInitialLoad: isInitialLoad || false,
    });
  } catch (error: any) {
    console.error('Error in multi-company job search:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process job search' },
      { status: 500 }
    );
  }
}

/**
 * Use OpenAI to analyze and enhance the search query
 */
async function analyzeSearchQuery(query: string, location?: string): Promise<JobSearchAnalysis> {
  try {
    const systemPrompt = `
      You are an expert job search assistant. Analyze the user's job search query and enhance it for better results.
      Extract and return the following information in JSON format:
      {
        "originalQuery": "The original query",
        "enhancedQuery": "An improved version of the query with relevant keywords",
        "parsedQuery": {
          "jobTitles": [],       // List of job titles mentioned or implied
          "skills": [],          // List of skills mentioned or implied
          "locations": [],       // List of locations mentioned
          "industries": [],      // List of industries or sectors mentioned
          "keywords": [],        // Other important keywords for the search
          "experienceLevel": "", // Entry, Junior, Mid, Senior, etc.
          "employmentTypes": []  // Full-time, Part-time, etc.
        },
        "searchStrategy": {
          "primaryTerms": [],    // Most important search terms
          "alternativeTerms": [], // Alternative terms to try
          "filters": {           // Suggested filters
            "departments": [],
            "industries": [],
            "locations": []
          }
        }
      }
    `;

    const userPrompt = location
      ? `Job search query: "${query}". Location preference: "${location}".`
      : `Job search query: "${query}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Failed to analyze search query');
    }

    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing search query:', error);
    // Return a fallback analysis
    return {
      originalQuery: query,
      enhancedQuery: query,
      parsedQuery: {
        jobTitles: [query],
        skills: [],
        locations: location ? [location] : [],
        industries: [],
        keywords: [query],
        experienceLevel: "",
        employmentTypes: []
      },
      searchStrategy: {
        primaryTerms: [query],
        alternativeTerms: [],
        filters: {
          departments: [],
          industries: [],
          locations: location ? [location] : []
        }
      }
    };
  }
}

/**
 * Enhance jobs with user profile information
 */
async function enhanceJobsWithUserProfile(
  jobs: Job[],
  userId: string,
  supabase: any
): Promise<Job[]> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return addBasicScores(jobs);
    }

    // For now, use basic scoring with profile consideration
    // In a real implementation, you'd use OpenAI to score each job against the profile
    return jobs.map(job => ({
      ...job,
      score: calculateProfileMatch(job, profile),
      matchReason: generateMatchReason(job, profile)
    }));

  } catch (error) {
    console.error('Error enhancing jobs with user profile:', error);
    return addBasicScores(jobs);
  }
}

/**
 * Calculate match score based on user profile
 */
function calculateProfileMatch(job: Job, profile: any): number {
  let score = 0.6; // Base score

  // Boost score based on profile matches
  if (profile.job_title && job.title.toLowerCase().includes(profile.job_title.toLowerCase())) {
    score += 0.2;
  }

  if (profile.preferred_industries && profile.preferred_industries.includes(job.sector)) {
    score += 0.15;
  }

  if (profile.location && job.location.toLowerCase().includes(profile.location.toLowerCase())) {
    score += 0.1;
  }

  // Add some randomness for demo purposes
  score += (Math.random() * 0.1) - 0.05;

  return Math.min(0.98, Math.max(0.4, score));
}

/**
 * Generate match reason
 */
function generateMatchReason(job: Job, profile: any): string {
  const reasons = [];

  if (profile.job_title && job.title.toLowerCase().includes(profile.job_title.toLowerCase())) {
    reasons.push(`matches your current role as ${profile.job_title}`);
  }

  if (profile.preferred_industries && profile.preferred_industries.includes(job.sector)) {
    reasons.push(`aligns with your preferred ${job.sector} industry`);
  }

  if (profile.location && job.location.toLowerCase().includes(profile.location.toLowerCase())) {
    reasons.push(`matches your location preference`);
  }

  if (reasons.length === 0) {
    reasons.push(`offers relevant experience in ${job.sector}`);
  }

  return `This ${job.title} position ${reasons.join(' and ')}.`;
}

/**
 * Add basic scores for anonymous users or initial loads
 */
function addBasicScores(jobs: Job[]): Job[] {
  return jobs.map((job, index) => ({
    ...job,
    score: 0.6 + (Math.random() * 0.3), // 60-90% range
    matchReason: `This ${job.title} position at ${job.employer} offers relevant experience in ${job.sector}.`,
    highlights: [
      "Matches your search criteria",
      `${job.employmentType || 'Full-time'} position`,
      `Located in ${job.location}`,
      "Recently posted opportunity"
    ]
  }));
}

/**
 * Get unique companies from job results
 */
function getUniqueCompanies(jobs: Job[]): string[] {
  const companies = new Set(jobs.map(job => job.employer));
  return Array.from(companies);
}

/**
 * Save search to history
 */
async function saveSearchToHistory(
  userId: string,
  query: string,
  location: string | undefined,
  supabase: any
) {
  try {
    const { error } = await supabase.from('job_searches').insert({
      user_id: userId,
      query,
      location: location || null,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error saving search to history:', error);
    }
  } catch (error) {
    console.error('Error saving search to history:', error);
  }
}
