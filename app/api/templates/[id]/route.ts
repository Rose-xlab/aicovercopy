// File: app/api/templates/[id]/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { DEFAULT_TEMPLATES } from '@/lib/default-templates';
import { Database } from '@/types/supabase'; // Import Database type if needed

// GET /api/templates/[id] - Get a specific template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // Check if ID matches a default template.
    // WARNING: Check if IDs in DEFAULT_TEMPLATES are valid UUIDs if using this logic
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (defaultTemplate) {
      // Consider if returning a default template like this is always desired,
      // especially if DB interaction is expected. This might bypass ownership checks.
      console.warn(`Returning default template for ID: ${templateId}`);
      return NextResponse.json(defaultTemplate);
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Query for the template
    let query = supabase
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .select('*')
      .eq('id', templateId);

    // Apply access control: public or owned by user
    if (!userId) {
      // If not logged in, can only get public templates
      query = query.eq('is_public', true);
    } else {
      // If logged in, can get public templates OR their own templates
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
    }

    const { data, error } = await query.single(); // Use .single() as ID should be unique

    if (error) {
      // Differentiate between not found and other errors
      if (error.code === 'PGRST116') { // Code for "No rows found"
         return NextResponse.json(
          { error: 'Template not found or access denied' },
          { status: 404 }
        );
      }
      console.error(`Error fetching template ${templateId} from DB:`, error);
      throw error; // Rethrow other errors
    }

    // If data is null even without error (shouldn't happen with .single() unless query logic error)
    if (!data) {
       return NextResponse.json(
          { error: 'Template not found or access denied' },
          { status: 404 }
        );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error handling GET /api/templates/${params.id}:`, error);
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

    // Check if this is a default template (cannot be modified via API)
    // WARNING: Check if IDs in DEFAULT_TEMPLATES are valid UUIDs if using this logic
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (defaultTemplate) {
      return NextResponse.json(
        { error: 'Default templates cannot be modified' },
        { status: 403 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

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
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .select('user_id')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
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

    // Prepare update data - prevent changing ownership or creation date
    const { id, user_id, created_at, ...updatePayload } = templateData;
    const finalUpdateData = {
      ...updatePayload,
      updated_at: new Date().toISOString(), // Update the timestamp
    };

    // Update the template
    const { data, error } = await supabase
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .update(finalUpdateData)
      .eq('id', templateId)
      .eq('user_id', session.user.id) // Ensure user owns it during update
      .select()
      .single();

    if (error) {
      console.error(`Error updating template ${templateId}:`, error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error handling PUT /api/templates/${params.id}:`, error);
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

    // Check if this is a default template (cannot be deleted via API)
    // WARNING: Check if IDs in DEFAULT_TEMPLATES are valid UUIDs if using this logic
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (defaultTemplate) {
      return NextResponse.json(
        { error: 'Default templates cannot be deleted' },
        { status: 403 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required to delete templates' },
        { status: 401 }
      );
    }

    // Fetch the existing template to check ownership before deleting
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .select('user_id')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
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
      .from('resume_templates') // <<< CHANGED TABLE NAME (VERIFY!)
      .delete()
      .eq('id', templateId)
      .eq('user_id', session.user.id); // Ensure user owns it during delete

    if (error) {
      console.error(`Error deleting template ${templateId}:`, error);
      // Handle potential foreign key constraint errors if templates are linked elsewhere
      if (error.code === '23503') { // foreign_key_violation
           return NextResponse.json(
            { error: 'Cannot delete template as it might be in use.' },
            { status: 409 } // Conflict
          );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error handling DELETE /api/templates/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}