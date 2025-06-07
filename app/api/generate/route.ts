// app/api/generateCoverLetter/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { QueueEvents, Job } from 'bullmq'; // Import QueueEvents and Job :contentReference[oaicite:10]{index=10}
import openaiQueue from '@/lib/queues/openaiQueue'; // Ensure this is your BullMQ Queue instance
import { Database } from '@/lib/database.types'; // Your Supabase types

// (Assume `redisConnection` is exported from a shared Redis config file)
import { redisConnection } from '@/lib/redis'; 

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const {
      jobDescription,
      jobTitle,
      companyName,
      userProfile,
      tone = 'professional',
      regenerate = false,
      dataSource = 'none',
      coverLetterId = crypto.randomUUID()
    } = await request.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    // 3. Generate a human‐readable jobId for logging/tracking
    const jobId = `cl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
         // Ensure this matches your queue name
        
      // 4. Enqueue the cover‐letter generation job
      const job: Job = await openaiQueue.add(
        'openai-requests',
        {
            name: 'generateCoverLetter',
            data:  {
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
          },
          {
            jobId: `generate-coverLetter-${Date.now()}`, // Use the coverLetterId itself as the BullMQ Job ID for easier retrieval :contentReference[oaicite:12]{index=12}
            removeOnComplete: true,
            removeOnFail: 5 // Retain failed jobs for debugging :contentReference[oaicite:13]{index=13}
          }
        , // Queue name key (worker must listen on same) :contentReference[oaicite:11]{index=11}
      );

      // 5. Create a QueueEvents listener for the same queue name.
      //    This subscribes to Redis keyspace notifications for 'completed'/'failed' :contentReference[oaicite:14]{index=14}
      const queueEvents = new QueueEvents('generateCoverLetter'); // Must match the queue key in openaiQueue :contentReference[oaicite:15]{index=15}

      // 6. Wait for the job to finish (resolve with return value or reject if failed)
      let result: any;
      try {
        result = await job.waitUntilFinished(queueEvents);
        
        // Check if the job was successful and has the expected data
        if (!result || !result.success || !result.data?.content) {
          const errorMessage = result?.error?.message || 'Failed to generate cover letter: No content was generated';
          console.error(`Cover letter generation failed [${jobId}]:`, errorMessage);
          
          await queueEvents.close();
          return NextResponse.json(
            {
              error: 'Cover letter generation failed',
              details: errorMessage,
              jobId,
              coverLetterId
            },
            { status: 500 }
          );
        }

        // If we reach here, the job was successful
        console.log(`Successfully generated cover letter [${jobId}]`);
        
        // Return the generated content
        return NextResponse.json({
          success: true,
          data: {
            coverLetter: result.data.content,
            jobId,
            coverLetterId,
            metadata: result.data.metadata
          }
        });

      } catch (err) {
        // Handle any errors that occur during job execution
        const failedReason = job.failedReason || err.message || 'Unknown error occurred';
        console.error(`Cover letter job failed [${jobId}]:`, failedReason);

        await queueEvents.close();
        return NextResponse.json(
          {
            error: 'Cover letter generation job failed',
            details: failedReason,
            jobId,
            coverLetterId,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
          },
          { status: 500 }
        );
      } finally {
        // Ensure we always close the queue events listener
        await queueEvents.close().catch(console.error);
      }
    } catch (error: any) {
      // 10. Handle unexpected errors during queuing or waiting
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
    // 11. Handle errors parsing the request or authenticating
    console.error('Error in /api/generateCoverLetter [POST]:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
