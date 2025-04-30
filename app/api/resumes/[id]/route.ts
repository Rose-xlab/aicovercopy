// File: app/api/resumes/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { mapResumeToDatabase, mapDatabaseToResumeData } from '@/lib/resume-mappers'; // Import mappers
import { Database } from '@/types/supabase'; // Import Database type

export const dynamic = 'force-dynamic'; // Add if needed

// --- GET Handler ---
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();

    // Query for the resume, joining the template data
    let query = supabase
      .from('resumes')
      .select(`
        *,
        resume_templates(*)
      `) // Select template details
      .eq('id', resumeId);

    if (!session) {
      query = query.eq('is_public', true);
    } else {
      query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
    }

    const { data, error } = await query.single();

    if (error) {
       if (error.code === 'PGRST116') { // Not found
         return NextResponse.json(
           { error: 'Resume not found or you do not have access' },
           { status: 404 }
         );
       }
       console.error(`Error fetching resume ${resumeId}:`, error);
       throw error;
    }

     if (!data) {
         return NextResponse.json(
           { error: 'Resume not found or you do not have access' },
           { status: 404 }
         );
     }

    // Return raw DB data including joined template
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}


// --- UPDATED PUT Handler ---
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumeDataFromClient = await request.json();
    if (!resumeDataFromClient) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // Check ownership
    const { data: existingResume, error: fetchError } = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .eq('user_id', session.user.id) // Check ownership during fetch
      .single();

    if (fetchError || !existingResume) {
      // Differentiate between not found and permission denied
      const status = fetchError?.code === 'PGRST116' ? 404 : 403;
      const message = fetchError?.code === 'PGRST116' ? 'Resume not found' : 'Access denied';
      return NextResponse.json({ error: message }, { status });
    }

    // --- Map incoming camelCase data to snake_case for DB ---
    const dbDataToUpdate = mapResumeToDatabase(resumeDataFromClient);

    // --- FIX: Add null check after mapping ---
    if (!dbDataToUpdate) {
      console.error('Failed to map resume data for update. Input:', resumeDataFromClient);
      return NextResponse.json({ error: 'Invalid resume data provided for mapping.' }, { status: 400 });
    }
    // --- End Fix ---

    // Remove fields that shouldn't be updated directly
    delete dbDataToUpdate.id;
    delete dbDataToUpdate.user_id;
    delete dbDataToUpdate.created_at;
    dbDataToUpdate.updated_at = new Date().toISOString(); // Ensure updated_at is set

    console.log("API PUT: Data to update in DB:", dbDataToUpdate);

    // Update the resume using the mapped snake_case data
    const { data: updatedData, error: updateError } = await supabase
      .from('resumes')
      .update(dbDataToUpdate) // Now guaranteed non-null
      .eq('id', resumeId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating resume ${resumeId}:`, updateError);
      if (updateError.code === '23503') { return NextResponse.json({ error: `Database constraint error: ${updateError.message}. Check template_id or source_cv.` }, { status: 400 }); }
      if (updateError.code === '22P02') { return NextResponse.json({ error: `Database type error: ${updateError.message}. Ensure IDs are correct UUID format.` }, { status: 400 }); }
      throw updateError;
    }

     if (!updatedData) {
         console.error(`Update successful but no data returned for resume ${resumeId}`);
         return NextResponse.json({ error: 'Failed to retrieve updated resume data.' }, { status: 500 });
     }

    return NextResponse.json(updatedData);

  } catch (error: any) {
    console.error('Error updating resume:', error);
     // Handle JSON parsing errors specifically
     if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update resume' },
      { status: 500 }
    );
  }
}

// --- DELETE Handler ---
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params.id;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership before deleting
    const { data: existingResume, error: fetchError } = await supabase
      .from('resumes')
      .select('user_id', { count: 'exact', head: true }) // More efficient check
      .eq('id', resumeId)
      .eq('user_id', session.user.id);


    // If fetchError occurs OR count is 0 (resume doesn't exist or user doesn't own it)
     if (fetchError || existingResume?.count === 0) {
       const status = fetchError?.code === 'PGRST116' || existingResume?.count === 0 ? 404 : 403; // PGRST116 implies not found
       const message = status === 404 ? 'Resume not found' : 'Access denied';
       if(fetchError) console.error(`Error checking resume ownership for delete ${resumeId}:`, fetchError);
       return NextResponse.json({ error: message }, { status });
     }


    // Delete the resume
    const { error: deleteError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', session.user.id); // Belt-and-suspenders ownership check

    if (deleteError) {
      console.error(`Error deleting resume ${resumeId}:`, deleteError);
       // Handle potential FK issues if resumes are referenced elsewhere (unlikely based on schema)
       if (deleteError.code === '23503') {
           return NextResponse.json({ error: `Cannot delete resume: ${deleteError.message}` }, { status: 409 }); // Conflict
       }
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
