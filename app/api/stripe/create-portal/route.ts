import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createPortalSession } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body to get the return URL
    const { returnUrl } = await request.json();
    
    // Default return URL is the dashboard billing page
    const defaultReturnUrl = `${request.nextUrl.origin}/dashboard/billing`;
    
    // Create the portal session
    const portalSession = await createPortalSession(
      session.user.id, 
      returnUrl || defaultReturnUrl
    );
    
    // Return the URL to redirect to
    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' }, 
      { status: 500 }
    );
  }
}