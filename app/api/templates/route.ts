// File: app/api/templates/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { DEFAULT_TEMPLATES } from '@/lib/default-templates';
import { Database } from '@/types/supabase'; // Import Database type for Supabase client

// GET /api/templates - Get all templates
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    // Use Database type for stricter client typing
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // --- CORRECTED CHECK FOR TABLE EMPTINESS ---
    // Check if resume_templates table exists in the database or has data
    const { error: tableCheckError, count: templateCount } = await supabase
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .select('*', { count: 'exact', head: true }); // select('*') is fine with head:true

    // If the check fails OR the count is 0, consider returning defaults
    // WARNING: Ensure IDs in DEFAULT_TEMPLATES are valid UUIDs if you keep this fallback!
    if (tableCheckError || templateCount === 0) {
      // Log the reason for falling back
      if (tableCheckError) {
        console.error('Templates table check failed:', tableCheckError);
      } else {
        console.warn('Templates table (resume_templates) is empty.');
      }
      console.warn('Returning default templates. Ensure their IDs are valid UUIDs!');
      // If you only want DB templates, remove this block or return an empty array:
      // return NextResponse.json([]);
      return NextResponse.json(DEFAULT_TEMPLATES);
    }
    // --- END OF CORRECTED CHECK ---

    // Query for templates: public ones + user's own private templates (if authenticated)
    let query = supabase
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .select('*'); // Select all columns, including the UUID 'id'

    // Filter for public OR user's own templates if logged in
    if (userId) {
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
    } else {
      // Only public if not logged in
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates from DB:', error);
      // Decide on error handling: fallback to defaults or return error?
      // Option: Fallback on error (ensure default IDs are valid UUIDs)
      // console.warn('Error fetching templates from DB, returning defaults.');
      // return NextResponse.json(DEFAULT_TEMPLATES);
      // Option: Throw error to be caught below
      throw error;
    }

    // Return fetched database templates (or empty array if null/undefined)
    return NextResponse.json(data ?? []);

  } catch (error: any) {
    console.error('Error handling /api/templates GET request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required to create templates' },
        { status: 401 }
      );
    }

    // Parse the request body
    const templateData = await request.json();

    // Validate required fields
    if (!templateData.name || !templateData.html_content || !templateData.css_content) {
      return NextResponse.json(
        { error: 'Name, HTML content, and CSS content are required' },
        { status: 400 }
      );
    }

    // Prepare the template data
    const newTemplate = {
      ...templateData,
      user_id: session.user.id,
      is_public: templateData.is_public || false,
      // Let the database handle default for created_at
    };

    // Insert the template
    const { data, error } = await supabase
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .insert(newTemplate)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw error; // Let the catch block handle the response
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}