// api/follow-up/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import followUpEmailService, { FollowUpEmailParams } from '@/lib/follow-up-email-service';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    // The endpoint can be accessed without authentication for demo purposes,
    // but we'll log the activity if the user is logged in
    
    // Get request body
    const params = await request.json() as FollowUpEmailParams;
    
    // Validate required fields
    if (!params.jobTitle || !params.companyName || !params.candidateName) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, companyName, and candidateName are required' },
        { status: 400 }
      );
    }
    
    // Generate the follow-up email
    const followUpEmail = await followUpEmailService.generateFollowUpEmail(params);
    
    // If user is authenticated, save to database
    if (session) {
      try {
        const { error } = await supabase
          .from('follow_up_emails')
          .insert({
            user_id: session.user.id,
            job_title: params.jobTitle,
            company_name: params.companyName,
            contact_name: params.contactName,
            application_date: params.applicationDate,
            subject: followUpEmail.subject,
            body: followUpEmail.body,
            greeting: followUpEmail.greeting,
            signature: followUpEmail.signature,
            style: params.followUpStyle,
            related_cover_letter_id: params.coverLetterId, // Optional field that wasn't in the params interface
            created_at: new Date().toISOString(),
          });
          
        if (error) {
          console.error('Error saving follow-up email:', error);
          // Continue even if saving fails - consider it a non-critical error
        }
      } catch (dbError) {
        console.error('Database error when saving follow-up email:', dbError);
        // Non-critical error - continue with response
      }
    }
    
    return NextResponse.json(followUpEmail);
  } catch (error: any) {
    console.error('Error generating follow-up email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate follow-up email' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Return a helpful message for GET requests
  return NextResponse.json({
    message: "This endpoint generates follow-up emails for job applications. Please use POST with the required parameters."
  });
}