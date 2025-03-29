// app/api/resumes/templates/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { DEFAULT_RESUME_TEMPLATES } from '@/lib/default-resume-templates';

export const dynamic = 'force-dynamic';

// GET /api/resumes/templates - Get all templates
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Check if templates table exists in the database
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('resume_templates')
      .select('id')
      .limit(1);
    
    // If the templates table doesn't exist or is empty, use default templates
    if (tableCheckError || !tableExists || tableExists.length === 0) {
      // Return the default templates
      return NextResponse.json(DEFAULT_RESUME_TEMPLATES);
    }
    
    // Query for templates: public ones + user's own private templates (if authenticated)
    let query = supabase
      .from('resume_templates')
      .select('*')
      .eq('is_public', true);
    
    if (userId) {
      // Add user's private templates
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching resume templates:', error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error handling resume templates request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume templates' },
      { status: 500 }
    );
  }
}

// POST /api/resumes/templates - Create a new template
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
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
      created_at: new Date().toISOString(),
    };
    
    // Insert the template
    const { data, error } = await supabase
      .from('resume_templates')
      .insert(newTemplate)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating resume template:', error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating resume template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create resume template' },
      { status: 500 }
    );
  }
}