// app/api/resumes/tailor/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { mapDatabaseToResumeData, mapResumeToDatabase } from '@/lib/resume-mappers';
import { ResumeData } from '@/types/resume';
import { logResumeTailoring } from '@/lib/resume-tailoring-logger';
import { Queue,  QueueEvents, Job } from 'bullmq';
import redisConnection from '@/lib/redis';
import { openaiQueue } from '@/lib/queues/openaiQueue';

// Create queue instance
const queue = new Queue('openai-requests', { connection: redisConnection });

export async function POST(request: Request) {
  console.log("API Tailoring - POST request received");

  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log("API Tailoring - No authenticated session found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("API Tailoring - Authenticated user:", session.user.id);

    // Get request body
    const requestData = await request.json();
    const { resumeId, jobDescription } = requestData;

    console.log("API Tailoring - Request data:", {
      resumeId,
      jobDescriptionLength: jobDescription?.length || 0
    });

    if (!resumeId || !jobDescription) {
      console.log("API Tailoring - Missing required fields");
      return NextResponse.json(
        { error: 'Resume ID and job description are required' },
        { status: 400 }
      );
    }

    // Check if the resume exists and belongs to the user
    console.log("API Tailoring - Fetching resume from database");
    const { data: resumeData, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !resumeData) {
      console.error("API Tailoring - Error fetching resume:", fetchError);
      return NextResponse.json(
        { error: 'Resume not found or you do not have access' },
        { status: 404 }
      );
    }

    console.log("API Tailoring - Resume fetched successfully");

    // Transform resume data to the format expected by our AI services
    const resume = mapDatabaseToResumeData(resumeData);

    if (!resume) {
      console.error("API Tailoring - Failed to map resume data");
      return NextResponse.json(
        { error: 'Failed to process resume data' },
        { status: 500 }
      );
    }

    // Add job to the queue
    const job: Job = await openaiQueue.add(
      'openai-requests', 
      {
      name: 'tailor-resume',
      data:{
        resume,
        jobDescription,
        requestId: `tailor-${Date.now()}`
      }
    },
    {
      jobId: `tailor-${Date.now()}`, // Use the coverLetterId itself as the BullMQ Job ID for easier retrieval :contentReference[oaicite:12]{index=12}
      removeOnComplete: true,
      removeOnFail: 5 // Retain failed jobs for debugging :contentReference[oaicite:13]{index=13}
    }
  );

const queueEvents = new QueueEvents('openai-requests', { connection: redisConnection });

    // Wait for the job to complete
    const result = await job.waitUntilFinished(queueEvents);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to tailor resume');
    }

    const { tailoredResume, changedSections, keywordMatches } = result.data;

    // Log the tailoring event
    await logResumeTailoring(
      session.user.id,
      resumeId,
      jobDescription,
      changedSections,
      keywordMatches,
      true
    );

    // Ensure the tailored resume has all the required fields from the original resume
    const validatedTailoredResume = {
      ...resume, // Start with the original resume as base
      ...tailoredResume, // Override with tailored data
      // Ensure critical fields are preserved
      id: resume.id,
      userId: resume.userId,
      user_id: resume.userId, // Add both versions to be safe
      templateId: resume.templateId,
      template_id: resume.templateId, // Add both versions to be safe
      isPublic: resume.isPublic,
      is_public: resume.isPublic, // Add both versions to be safe
      created_at: resume.created_at,
      createdAt: resume.created_at, // Add both versions to be safe
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString() // Add both versions to be safe
    };

    // Return the tailored resume without saving it yet (user will review and decide)
    return NextResponse.json({
      tailoredResume: validatedTailoredResume,
      changedSections
    });

  } catch (error: any) {
    console.error('API Tailoring - Error handling resume tailoring:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}