// File: app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { openaiQueue } from '@/lib/queues/openaiQueue';
import openai from '@/lib/openai';
import { LinkedInCoverLetterData } from '@/lib/linkedInCoverLetterTransformer';
import { CvFile } from '@/types/CvFile'; // Assuming this type exists

export const dynamic = 'force-dynamic'; // Keep if needed

// Define expected structures for payload (ensure consistency)
type DbResume = Database['public']['Tables']['resumes']['Row'];
interface CvFile { id?: string; name?: string; content?: string; }
type ResumeDataFromFrontend = DbResume | CvFile | null;

// This interface should match the output of 'prepareUserProfilePayload'
interface UserProfilePayload {
    name?: string; title?: string; summary?: string; currentRole?: string;
    currentCompany?: string; yearsOfExperience?: number; skills?: string[];
    experience?: { role?: string; company?: string; highlights?: string[] }[];
    education?: { degree?: string; school?: string; fieldOfStudy?: string }[];
    accomplishments?: string[]; cvFilename?: string; linkedInProfileUrl?: string | null;
    // Add any other fields prepareUserProfilePayload might include
    // Based on previous context, it might also include these top-level keys:
    linkedin?: LinkedInCoverLetterData | null;
    resume?: ResumeDataFromFrontend | null; // DbResume | CvFile | null
    cv?: CvFile | null;
    keyAttributes?: any; // Use a more specific type if possible
    id?: string; // From LinkedInCoverLetterData or CvFile?
}

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            jobDescription,
            jobTitle,
            companyName,
            userProfile,
            tone = 'professional',
            regenerate = false,
            dataSource = 'none',
            coverLetterId = crypto.randomUUID() // Generate a unique ID for tracking
        } = await request.json();

        if (!jobDescription) {
            return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
        }

        // Generate a unique job ID for tracking
        const jobId = `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Add job to the queue
            const job = await openaiQueue.add(
                'generateCoverLetter',
                {
                    jobId,
                    jobTitle,
                    companyName,
                    jobDescription,
                    userProfile,
                    tone,
                    userId: session.user.id,
                    coverLetterId,
                    webhookUrl: process.env.WEBHOOK_URL,
                    webhookToken: process.env.WEBHOOK_TOKEN,
                    metadata: {
                        regenerate,
                        dataSource,
                        timestamp: new Date().toISOString()
                    }
                },
                {
                    jobId: coverLetterId, // Use coverLetterId as the job ID for better tracking
                    removeOnComplete: true,
                    removeOnFail: 1000 // Keep failed jobs for a while for debugging
                }
            );

            // Wait for the job to complete
            const result = await job.waitUntilFinished(redisConnection);

            // If there was an error in the worker, throw it
            if (result.error) {
                throw new Error(result.message || 'Failed to generate cover letter');
            }

            // Return the generated cover letter
            return NextResponse.json({
                coverLetter: result.coverLetter,
                jobId,
                coverLetterId
            });

        } catch (error: any) {
            console.error('Error in cover letter generation:', error);
            return NextResponse.json(
                {
                    error: 'Failed to generate cover letter',
                    details: error.message || 'Unknown error occurred',
                    jobId,
                    coverLetterId
                },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Error in /api/generate:', error);
        return NextResponse.json(
            {
                error: 'Failed to process request',
                details: error.message || 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}