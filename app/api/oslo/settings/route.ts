import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
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
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Build query
    let query = supabase.from('admin_settings').select('*');
    
    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    // Execute query
    const { data, error } = await query.order('category', { ascending: true });
    
    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform into a more usable format for the frontend
    const transformedSettings = data.reduce((acc: any, setting: any) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      
      acc[setting.category][setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updated_at,
        updatedBy: setting.updated_by
      };
      
      return acc;
    }, {});
    
    return NextResponse.json({ settings: transformedSettings });
  } catch (err: any) {
    console.error('Server error fetching settings:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { category, key, value, description } = body;
    
    if (!category || !key || value === undefined) {
      return NextResponse.json({ error: 'Category, key, and value are required' }, { status: 400 });
    }
    
    // Check if setting exists
    const { data: existingSetting, error: checkError } = await supabase
      .from('admin_settings')
      .select('id')
      .eq('category', category)
      .eq('key', key)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing setting:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    // Log this admin action
    await supabase.rpc('fn_log_admin_action', {
      action: existingSetting ? 'setting.update' : 'setting.create',
      entity_type: 'admin_settings',
      entity_id: existingSetting?.id || null,
      details: {
        category,
        key,
        old_value: existingSetting ? 'Existing' : 'N/A',
        new_value: 'Updated'
      }
    });
    
    // Update or insert the setting
    if (existingSetting) {
      // Update existing setting
      const updateData: any = {
        value,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      };
      
      // Only update description if provided
      if (description !== undefined) {
        updateData.description = description;
      }
      
      const { data, error } = await supabase
        .from('admin_settings')
        .update(updateData)
        .eq('category', category)
        .eq('key', key)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ setting: data, success: true });
    } else {
      // Insert new setting
      const { data, error } = await supabase
        .from('admin_settings')
        .insert({
          category,
          key,
          value,
          description: description || null,
          updated_by: session.user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ setting: data, success: true }, { status: 201 });
    }
  } catch (err: any) {
    console.error('Server error updating setting:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}