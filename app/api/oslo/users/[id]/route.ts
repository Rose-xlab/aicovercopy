import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  
  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify admin privileges
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }
  
  try {
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    // Get user's subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      // Continue anyway, just without subscription data
    }
    
    // Get user's activity statistics
    const { data: stats, error: statsError } = await getUserStats(supabase, userId);
    
    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      // Continue anyway, just without stats
    }
    
    return NextResponse.json({
      user: userData,
      subscription: subscriptionData || null,
      stats: stats || null
    });
  } catch (err: any) {
    console.error('Server error fetching user details:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  
  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify admin privileges
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      fullName,
      jobTitle,
      location,
      isAdmin,
      status,
      // Any other fields to update
    } = body;
    
    // Prepare update data for profile
    const profileData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only add defined fields to the update
    if (firstName !== undefined) profileData.first_name = firstName;
    if (lastName !== undefined) profileData.last_name = lastName;
    if (fullName !== undefined) profileData.full_name = fullName;
    if (jobTitle !== undefined) profileData.job_title = jobTitle;
    if (location !== undefined) profileData.location = location;
    if (isAdmin !== undefined) profileData.is_admin = isAdmin;
    if (status !== undefined) profileData.status = status;
    
    // Update email in auth if provided
    if (email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(
        userId,
        { email: email, email_confirm: true }
      );
      
      if (emailError) {
        console.error('Error updating email:', emailError);
        return NextResponse.json({ error: emailError.message }, { status: 500 });
      }
    }
    
    // Update profile data
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    
    return NextResponse.json({ user: updatedProfile });
  } catch (err: any) {
    console.error('Server error updating user:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  
  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify admin privileges
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }
  
  try {
    // First check if this is not the user making the request
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }
    
    // Mark user as deleted in profile first (soft delete)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error soft deleting profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    
    // Delete user from auth system (or you might just want to disable them)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Server error deleting user:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Helper function to get user statistics
async function getUserStats(supabase: any, userId: string) {
  try {
    // Get count of cover letters
    const { count: coverLettersCount, error: coverLettersError } = await supabase
      .from('cover_letters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (coverLettersError) throw coverLettersError;
    
    // Get count of resumes
    const { count: resumesCount, error: resumesError } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (resumesError) throw resumesError;
    
    // Get count of ATS scans
    const { count: atsScansCount, error: atsScansError } = await supabase
      .from('resume_ats_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (atsScansError) throw atsScansError;
    
    // Get count of follow-up emails
    const { count: followUpEmailsCount, error: followUpEmailsError } = await supabase
      .from('follow_up_emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (followUpEmailsError) throw followUpEmailsError;
    
    // Get count of interview sessions
    const { count: interviewSessionsCount, error: interviewSessionsError } = await supabase
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (interviewSessionsError) throw interviewSessionsError;
    
    // Return statistics
    return {
      data: {
        coverLettersCount: coverLettersCount || 0,
        resumesCount: resumesCount || 0,
        atsScansCount: atsScansCount || 0,
        followUpEmailsCount: followUpEmailsCount || 0,
        interviewSessionsCount: interviewSessionsCount || 0,
        totalDocuments: (coverLettersCount || 0) + (resumesCount || 0),
        totalActivities: (atsScansCount || 0) + (followUpEmailsCount || 0) + (interviewSessionsCount || 0)
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { data: null, error };
  }
}