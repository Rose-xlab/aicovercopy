// app/api/auth/callback/route.ts
import { getServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserProfile } from '@/utils/create-profile';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = getServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error.message)}`
      );
    }
    
    // If the user is new, create their profile
    if (data.user && data.user.app_metadata.provider !== 'email') {
      // For OAuth providers we need to manually create a profile
      await createUserProfile(data.user.id);
    }
    
    // Redirect to home page after successful authentication
    return NextResponse.redirect(requestUrl.origin);
  }
  
  // If no code in URL, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
}