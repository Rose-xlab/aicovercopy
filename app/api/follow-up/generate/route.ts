// api/follow-up/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import followUpEmailService, { FollowUpEmailParams } from '@/lib/follow-up-email-service';
import { enforceSubscriptionLimit, trackFeatureUsage } from '@/lib/subscription-enforcement';

// Extend the FollowUpEmailParams type to include optional coverLetterId
interface ExtendedFollowUpEmailParams extends FollowUpEmailParams {
  coverLetterId?: string;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get request body
    const params = await request.json() as ExtendedFollowUpEmailParams;
    
    // Validate required fields
    if (!params.jobTitle || !params.companyName || !params.candidateName) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, companyName, and candidateName are required' },
        { status: 400 }
      );
    }
    
    // If user is authenticated, check their limits
    if (session) {
      // Follow-up emails count as cover letters for limit purposes
      const { success, error: limitError, usage } = await enforceSubscriptionLimit(
        session.user.id, 
        'coverLetters'
      );
      
      if (!success) {
        return NextResponse.json(
          { 
            error: limitError || 'Cover letter limit reached (follow-up emails count towards this limit)',
            upgradeUrl: '/pricing',
            feature: 'coverLetters',
            usage
          }, 
          { status: 403 }
        );
      }
    }
    
    // Generate the follow-up email
    const followUpEmail = await followUpEmailService.generateFollowUpEmail(params);
    
    // If user is authenticated, save to database and track usage
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
            related_cover_letter_id: params.coverLetterId || null,
            created_at: new Date().toISOString(),
          });
        
        if (error) {
          console.error('Error saving follow-up email:', error);
          // Continue even if saving fails - consider it a non-critical error
        } else {
          // Track usage only after successful save
          await trackFeatureUsage(session.user.id, 'coverLetters');
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