// File: app/api/cover-letters/save/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import type { SenderInfo, RecipientInfo } from '@/types/cover-letter'

export const dynamic = 'force-dynamic';

// Define the expected structure of the request body from the client
interface SaveCoverLetterPayload {
  id?: string;
  content?: string;
  jobDescription?: string;
  jobTitle?: string | null;
  sender?: SenderInfo,
  recipient?: RecipientInfo
  companyName?: string | null;
  tone?: string | null;
  dataSource?: 'cv' | 'linkedin' | 'both' | 'none' | string | null;
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

    // Validate data_source to ensure it's one of the allowed values
    const validDataSources = ['cv', 'linkedin', 'both', 'none'];
    const dataSource = (payload.dataSource && validDataSources.includes(payload.dataSource)) 
      ? payload.dataSource 
      : 'cv';

    // Prepare data for database operation
    const coverLetterData = {
      user_id: session.user.id,
      content: payload.content,
      job_description: payload.jobDescription,
      job_title: payload.jobTitle || null,
      // Ensure JSON columns are properly formatted
      sender: payload.sender ? JSON.parse(JSON.stringify(payload.sender)) : null,
      recipient: payload.recipient ? JSON.parse(JSON.stringify(payload.recipient)) : null,
      company_name: payload.companyName || null,
      tone: payload.tone || 'professional',
      data_source: dataSource,
      resume_id: payload.resume_id || null,
      template_id: payload.template_id || null,
      status: 'draft',
      updated_at: new Date().toISOString()
    };

    let data, error;

    // Check if ID exists - if so, update the existing record
    if (payload.id) {
      console.log(`API Save Route: Attempting to update cover letter with ID: ${payload.id}`);

      // First, verify the user owns this cover letter
      const { data: existingLetter, error: fetchError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', payload.id)
        .maybeSingle();

      if (fetchError || !existingLetter) {
        const status = fetchError?.code === 'PGRST116' ? 404 : 403;
        const message = fetchError?.code === 'PGRST116' 
          ? 'Cover letter not found' 
          : 'You do not have permission to update this cover letter';
        return NextResponse.json({ error: message }, { status });
      }

      // If we found the letter but user_id doesn't match, it's a permission issue
      if (existingLetter && existingLetter.user_id !== session.user.id) {
        return NextResponse.json({ error: 'You do not have permission to update this cover letter' }, { status: 403 });
      }

      // Use the update_cover_letter_without_logs function if complex update fails
      try {
        // Try a direct update first
        const updateResult = await supabase
          .from('cover_letters')
          .update(coverLetterData)
          .eq('id', payload.id)
          .eq('user_id', session.user.id) // Extra safety check
          .select()
          .single();

        data = updateResult.data;
        error = updateResult.error;

        // If direct update fails, try using the RPC function
        if (error) {
          console.log('Direct update failed, trying RPC function...');
          const rpcResult = await supabase.rpc('update_cover_letter_without_logs', {
            p_cover_letter_id: payload.id,
            p_update_data: coverLetterData as any
          });

          if (rpcResult.error) {
            throw rpcResult.error;
          }

          // Fetch the updated data
          const { data: updatedData, error: fetchError } = await supabase
            .from('cover_letters')
            .select('*')
            .eq('id', payload.id)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          data = updatedData;
          error = null;
        }
      } catch (updateError: any) {
        console.error('Update error:', updateError);
        error = updateError;
      }

      if (!error && data) {
        console.log(`API Save Route: Cover letter updated successfully with ID: ${data.id}`);
        return NextResponse.json({
          id: data.id,
          message: 'Cover letter updated successfully',
          updated: true
        });
      }
    } else {
      // No ID provided, create a new record
      console.log("API Save Route: Attempting to insert new cover letter");

      // Perform the insert operation
      const result = await supabase
        .from('cover_letters')
        .insert(coverLetterData)
        .select('id')
        .single();

      data = result.data;
      error = result.error;

      if (!error && data) {
        console.log(`API Save Route: New cover letter created with ID: ${data.id}`);
        return NextResponse.json({
          id: data.id,
          message: 'Cover letter created successfully',
          created: true
        });
      }
    }

    // Handle potential database errors
    if (error) {
      console.error('API Save Route: Error saving cover letter to DB:', error);
      // Check for specific common errors like foreign key violations
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json({ error: `Database constraint error: ${error.message}. Check if resume_id or template_id is valid and exists.` }, { status: 400 });
      }
      if (error.code === '22P02') { // invalid_text_representation
        return NextResponse.json({ error: `Database type error: ${error.message}. Ensure IDs are correct UUID format.` }, { status: 400 });
      }
      // Generic database error
      return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
    }

    // Check if data or id is missing after operation
    if (!data?.id) {
      console.error('API Save Route: Operation completed but no ID returned');
      return NextResponse.json({ error: 'Failed to save cover letter (no ID retrieved after operation)' }, { status: 500 });
    }

    // This code should not be reached if the earlier returns work properly
    return NextResponse.json({ id: data.id, message: 'Cover letter saved successfully' });

  } catch (error: any) {
    // Handle unexpected errors (e.g., JSON parsing errors, network issues)
    console.error('API Save Route: Unexpected error in POST handler:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body format.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to save cover letter due to an unexpected error' }, { status: 500 });
  }
}