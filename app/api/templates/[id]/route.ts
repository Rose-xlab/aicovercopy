export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { DEFAULT_TEMPLATES } from '@/lib/default-templates';

// GET /api/templates/[id] - Get a specific template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    
    // Check if this is a default template
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (defaultTemplate) {
      return NextResponse.json(defaultTemplate);
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Query for the template
    let query = supabase
      .from('templates')
      .select('*')
      .eq('id', templateId);
    
    // If user is not authenticated, only fetch public templates
    if (!userId) {
      query = query.eq('is_public', true);
    } else {
      // If authenticated, fetch public templates or user's own templates
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error(`Error fetching template ${templateId}:`, error);
      return NextResponse.json(
        { error: 'Template not found or you do not have access' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error handling template request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    
    // Check if this is a default template (which cannot be modified)
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (defaultTemplate) {
      return NextResponse.json(
        { error: 'Default templates cannot be modified' },
        { status: 403 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required to update templates' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const templateData = await request.json();
    
    // Fetch the existing template to check ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('user_id')
      .eq('id', templateId)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Check if the user owns the template
    if (existingTemplate.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own templates' },
        { status: 403 }
      );
    }
    
    // Update the template
    const updateData = {
      ...templateData,
      updated_at: new Date().toISOString(),
      // Don't allow changing user_id or created_at
      user_id: session.user.id,
    };
    
    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating template ${templateId}:`, error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    
    // Check if this is a default template (which cannot be deleted)
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (defaultTemplate) {
      return NextResponse.json(
        { error: 'Default templates cannot be deleted' },
        { status: 403 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required to delete templates' },
        { status: 401 }
      );
    }
    
    // Fetch the existing template to check ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('user_id')
      .eq('id', templateId)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Check if the user owns the template
    if (existingTemplate.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      );
    }
    
    // Delete the template
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error(`Error deleting template ${templateId}:`, error);
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}