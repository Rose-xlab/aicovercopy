import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Create authenticated Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Parse URL to get query parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const searchTerm = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  
  // Calculate pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

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
    // Build query for users data
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    // Apply filters if provided
    if (searchTerm) {
      query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination and ordering
    const { data: userData, count, error: userError } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (userError) throw userError;
    
    return NextResponse.json({
      users: userData,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 });
  }
}