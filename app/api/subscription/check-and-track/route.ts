// app/api/subscription/check-and-track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { 
  canAccessFeature, 
  trackFeatureUsage, 
  LimitedFeature 
} from '@/lib/subscription-enforcement';

// POST /api/subscription/check-and-track - Combined check and track
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get feature from request body
    const { feature, action } = await request.json();
    
    if (!feature || !['coverLetters', 'resumes', 'atsScans', 'interviewSessions'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature specified' }, { status: 400 });
    }

    // If action is 'check', only check without tracking
    if (action === 'check') {
      const result = await canAccessFeature(session.user.id, feature as LimitedFeature);
      
      if (!result.allowed) {
        return NextResponse.json(
          { 
            error: result.reason || 'Feature limit exceeded',
            allowed: false,
            usage: result.usage,
            upgradeUrl: '/pricing'
          }, 
          { status: 403 }
        );
      }

      return NextResponse.json({ 
        allowed: true,
        usage: result.usage,
        message: 'Feature access allowed' 
      });
    }

    // If action is 'track', track usage
    if (action === 'track') {
      const trackResult = await trackFeatureUsage(session.user.id, feature as LimitedFeature);
      
      if (!trackResult.success) {
        return NextResponse.json(
          { error: trackResult.error || 'Failed to track usage' }, 
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Usage tracked successfully' 
      });
    }

    // Default: check and track in one call (legacy support)
    const checkResult = await canAccessFeature(session.user.id, feature as LimitedFeature);
    
    if (!checkResult.allowed) {
      return NextResponse.json(
        { 
          error: checkResult.reason || 'Feature limit exceeded',
          allowed: false,
          usage: checkResult.usage,
          upgradeUrl: '/pricing'
        }, 
        { status: 403 }
      );
    }

    // Track usage
    const trackResult = await trackFeatureUsage(session.user.id, feature as LimitedFeature);
    
    if (!trackResult.success) {
      console.error('Failed to track usage:', trackResult.error);
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({ 
      allowed: true,
      usage: checkResult.usage,
      message: 'Feature access granted and usage tracked' 
    });

  } catch (error) {
    console.error('Error in check-and-track:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}