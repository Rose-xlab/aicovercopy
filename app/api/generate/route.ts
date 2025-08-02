//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\generate\route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { QueueEvents, Job } from 'bullmq';
import { openaiQueue } from '@/lib/queues/openaiQueue';
import { Database } from '@/types/supabase';
import redisConnection from '@/lib/redis';
export async function POST(request: Request) {
  try {
    const cookieStore = cookies(); // Await cookies() here
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      jobDescription,
      userProfile,
      tone = "professional",
      regenerate = false,
      dataSource = "none",
      coverLetterId = crypto.randomUUID(),
    } = await request.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const jobId = `cl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const job: Job = await openaiQueue.add(
        "openai-requests",
        {
          name: "generate-cover-letter",
          data: {
            jobId,
            // We no longer pass jobTitle and companyName here
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
              timestamp: new Date().toISOString(),
            },
          },
        },
        {
          jobId: `generate-coverLetter-${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: 5,
        }
      );

      const queueEvents = new QueueEvents("openai-requests", { connection: redisConnection });


      let result: any;
      try {
        result = await job.waitUntilFinished(queueEvents);
        console.log("generated coverleter result", result);

        // --- *** MODIFIED PART *** ---
        // Validate the new, richer response from the worker
        if (
          !result ||
          !result.success ||
          !result.data?.content ||
          !result.data?.jobTitle ||
          !result.data?.companyName
        ) {
          const errorMessage =
            result?.error?.message ||
            "Failed to generate cover letter: Incomplete data received from worker.";
          console.error(`Cover letter generation failed [${jobId}]:`, errorMessage);

          await queueEvents.close();
          return NextResponse.json(
            {
              error: "Cover letter generation failed",
              details: errorMessage,
              jobId,
              coverLetterId,
            },
            { status: 500 }
          );
        }

       console.log(`Successfully generated cover letter [${jobId}]`);

      // --- FIX ADDED HERE ---
      // Sanitize the AI's response to remove awkward whitespace and newlines.
      const rawContent = result.data.content;
      const cleanedContent = rawContent
        .trim() // Remove leading/trailing whitespace from the whole text
        .replace(/\n\s*\n/g, '\n\n'); // Normalize multiple newlines into a single paragraph break

      // Return the new object structure with the CLEANED data
      return NextResponse.json({
        success: true,
        data: {
          coverLetter: cleanedContent, // Use the cleaned version
          jobTitle: result.data.jobTitle,
          companyName: result.data.companyName,
          jobId,
          coverLetterId,
          metadata: result.data.metadata,
        },
      });
      } catch (err: any) {
        const failedReason =
          job.failedReason || err.message || "Unknown error occurred";
        console.error(`Cover letter job failed [${jobId}]:`, failedReason);

        await queueEvents.close();
        return NextResponse.json(
          {
            error: "Cover letter generation job failed",
            details: failedReason,
            jobId,
            coverLetterId,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
          { status: 500 }
        );
      } finally {
        await queueEvents.close().catch(console.error);
      }
    } catch (error: any) {
      console.error("Error in cover letter generation:", error);
      return NextResponse.json(
        {
          error: "Failed to generate cover letter",
          details: error.message || "Unknown error occurred",
          jobId,
          coverLetterId,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in /api/generate [POST]:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}