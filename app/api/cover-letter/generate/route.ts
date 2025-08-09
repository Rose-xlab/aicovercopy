// app/api/cover-letter/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { enforceSubscriptionLimit } from '@/lib/subscription-enforcement';
import { generateCoverLetter } from '@/lib/coverLetterGenerator';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' }, 
        { status: 401 }
      );
    }
    
    // ENFORCE SUBSCRIPTION LIMIT
    const { success, error } = await enforceSubscriptionLimit(session.user.id, 'coverLetters');
    if (!success) {
      return NextResponse.json(
        { 
          error,
          upgradeUrl: '/pricing',
          feature: 'coverLetters'
        }, 
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { jobDescription, tone, resumeData, dataSource } = body;
    
    // Validate required fields
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' }, 
        { status: 400 }
      );
    }
    
    // Generate cover letter using your existing logic
    const result = await generateCoverLetter({
      jobDescription,
      tone: tone || 'professional',
      resumeData,
      dataSource: dataSource || 'none'
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}