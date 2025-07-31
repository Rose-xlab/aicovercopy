//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\jobs\initial\route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { searchJobsAcrossCompanies } from '@/lib/multi-company-greenhouse-api';
import { Job } from '@/types/jobs';

/**
 * GET /api/jobs/initial - Get initial jobs for homepage
 */
export async function GET() {
  try {
    // Get user auth status
    const cookieStore = cookies(); // ✅ FIX: Removed 'await'
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    console.log('Loading initial trending jobs...');

    // Define trending/popular job queries to mix results
    const trendingQueries = [
      "Software Engineer",
      "Product Manager",
      "Data Scientist",
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "DevOps Engineer",
      "UX Designer",
      "Marketing Manager",
      "Sales"
    ];

    // Pick 2-3 random queries to get diverse results
    const selectedQueries = trendingQueries
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    console.log(`Fetching jobs for trending queries: ${selectedQueries.join(', ')}`);

    // Search for multiple job types in parallel
    const searchPromises = selectedQueries.map(query =>
      searchJobsAcrossCompanies({
        query,
        limit: 15, // Get 15 jobs per query
        industries: [], // All industries
        companies: [] // All companies
      })
    );

    const results = await Promise.allSettled(searchPromises);

    // Combine all results
    let allJobs: Job[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Query "${selectedQueries[index]}" returned ${result.value.length} jobs`);
        allJobs.push(...result.value);
      } else {
        console.warn(`Query "${selectedQueries[index]}" failed:`, result.reason);
      }
    });

    // Remove duplicates based on job ID
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    // Shuffle and limit to 30 jobs
    const shuffledJobs = uniqueJobs
      .sort(() => 0.5 - Math.random())
      .slice(0, 30);

    // Add basic scores and highlights for display
    const enhancedJobs = shuffledJobs.map((job, index) => ({
      ...job,
      score: 0.65 + (Math.random() * 0.25), // 65-90% range
      matchReason: `Trending ${job.title} position at ${job.employer}`,
      highlights: [
        "Trending opportunity",
        `${job.employmentType || 'Full-time'} position`,
        `Located in ${job.location}`,
        "High demand role"
      ]
    }));

    // Get unique companies for stats
    const companiesSearched = Array.from(new Set(enhancedJobs.map(job => job.employer)));

    console.log(`Loaded ${enhancedJobs.length} initial jobs from ${companiesSearched.length} companies`);

    return NextResponse.json({
      jobs: enhancedJobs,
      totalResults: enhancedJobs.length,
      companiesSearched,
      selectedQueries,
      isInitialLoad: true
    });

  } catch (error: any) {
    console.error('Error loading initial jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load initial jobs' },
      { status: 500 }
    );
  }
}
