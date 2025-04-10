import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Sign out
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Success
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Server error during logout:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}