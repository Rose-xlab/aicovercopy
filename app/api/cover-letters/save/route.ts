// File: app/api/cover-letters/save/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

// Define the expected structure of the request body from the client
interface SaveCoverLetterPayload {
    content: string;
    jobDescription: string;
    jobTitle?: string | null;
    companyName?: string | null;
    tone?: string | null;
    dataSource?: string | null;
    resume_id?: string | null; // Expecting UUID string or null from a DbResume source
    template_id?: string | null; // Expecting UUID string or null
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Authenticate user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: SaveCoverLetterPayload = await request.json();

    // Basic server-side validation
    if (!payload.content || !payload.jobDescription) {
       return NextResponse.json({ error: 'Missing required fields (content, jobDescription)' }, { status: 400 });
    }

    // Optional: Add more robust validation here if needed (e.g., UUID format checks)
    // Note: Relying on the client sending null for invalid UUIDs might be sufficient for now
    // const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    // if (payload.template_id && !uuidRegex.test(payload.template_id)) payload.template_id = null;
    // if (payload.resume_id && !uuidRegex.test(payload.resume_id)) payload.resume_id = null;


    // Prepare data for insertion into the database table
    const insertData: Database['public']['Tables']['cover_letters']['Insert'] = {
      user_id: session.user.id,
      content: payload.content,
      job_description: payload.jobDescription,
      job_title: payload.jobTitle || null,
      company_name: payload.companyName || null,
      tone: payload.tone || 'professional',
      data_source: payload.dataSource || 'unknown',
      resume_id: payload.resume_id || null,       // Use validated ID or null
      template_id: payload.template_id || null,   // Use validated ID or null
      status: 'draft', // Set an initial status (e.g., 'draft' or 'saved')
      // Let database handle default values for created_at, updated_at, id
    };

    console.log("API Save Route: Attempting to insert into cover_letters:", insertData);

    // Perform the insert operation
    const { data, error } = await supabase
      .from('cover_letters')
      .insert(insertData)
      .select('id') // Select the ID of the newly created letter
      .single();

    // Handle potential database errors
    if (error) {
      console.error('API Save Route: Error saving cover letter to DB:', error);
      // Check for specific common errors like foreign key violations
      if (error.code === '23503') { // foreign_key_violation
         return NextResponse.json({ error: `Database constraint error: ${error.message}. Check if resume_id or template_id is valid and exists.` }, { status: 400 });
      }
       if (error.code === '22P02') { // invalid_text_representation (e.g., bad UUID format somehow got through)
           return NextResponse.json({ error: `Database type error: ${error.message}. Ensure IDs are correct UUID format.` }, { status: 400 });
       }
      // Generic database error
      return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
    }

     // Check if data or id is missing after insert (should not happen with .single() if no error)
     if (!data?.id) {
       console.error('API Save Route: Cover letter inserted but no ID returned');
       return NextResponse.json({ error: 'Failed to save cover letter (no ID retrieved after insert)' }, { status: 500 });
    }

    console.log('API Save Route: Cover letter saved successfully with ID:', data.id);

    // Return a success response including the new cover letter's ID
    return NextResponse.json({ id: data.id, message: 'Cover letter saved successfully' });

  } catch (error: any) {
    // Handle unexpected errors (e.g., JSON parsing errors, network issues)
    console.error('API Save Route: Unexpected error in POST handler:', error);
    if (error instanceof SyntaxError) { // Check specifically for JSON parsing errors
        return NextResponse.json({ error: 'Invalid request body format.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to save cover letter due to an unexpected error' }, { status: 500 });
  }
}