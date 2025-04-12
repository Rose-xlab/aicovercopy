import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Special admin email that will bypass checks - MUST match the one in useOsloAuth.ts
const TEMP_ADMIN_EMAIL = 'jennifernanyombi1@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    // Special case for admin bypass email
    if (data.user.email === TEMP_ADMIN_EMAIL) {
      // Skip the admin check for this special email
      return NextResponse.json({
        user: data.user,
        session: data.session,
      });
    }
    
    // For all other users, check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
    }
    
    // If not an admin, return error
    if (!profile?.is_admin) {
      // Sign out since they're not allowed
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }
    
    // Success
    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    console.error('Server error during login:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}