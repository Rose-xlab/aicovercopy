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
    // console.log('the session', session)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: SaveCoverLetterPayload = await request.json();

    // Basic server-side validation
    if (!payload.content || !payload.jobDescription) {
      return NextResponse.json({ error: 'Missing required fields (content, jobDescription)' }, { status: 400 });
    }

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
      data_source: payload.dataSource || 'unknown',
      resume_id: payload.resume_id || null,
      template_id: payload.template_id || null,
      status: 'draft',
      updated_at: new Date().toISOString()
    };
    
    console.log('Sender type:', typeof payload.sender, 'Recipient type:', typeof payload.recipient);

    let data, error;

    // Check if ID exists - if so, update the existing record
    if (payload.id) {
      console.log(`API Save Route: Attempting to update cover letter with ID: ${payload.id}`);

      // First, verify the user owns this cover letter and log the exact ID format
      console.log('Checking for existing letter with ID:', payload.id, 'Type:', typeof payload.id);
      
      const { data: existingLetter, error: fetchError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', payload.id)
        .maybeSingle();

      console.log('Existing letter query result:', { data: existingLetter, error: fetchError });
      
      // If we found the letter but user_id doesn't match, it's a permission issue
      if (existingLetter && existingLetter.user_id !== session.user.id) {
        console.log('Permission issue: Letter exists but belongs to user', existingLetter.user_id, 'not', session.user.id);
        return NextResponse.json({ error: 'You do not have permission to update this cover letter' }, { status: 403 });
      }

      if (fetchError || !existingLetter) {
        // Cover letter not found or doesn't belong to this user
        const status = fetchError?.code === 'PGRST116' ? 404 : 403;
        const message = fetchError?.code === 'PGRST116' 
          ? 'Cover letter not found' 
          : 'You do not have permission to update this cover letter';

        return NextResponse.json({ error: message }, { status });
      }

      // Perform the update operation

      // Log the exact structure of coverLetterData for debugging
      console.log('coverLetterData to update:', JSON.stringify(coverLetterData, null, 2));
      
      // console.log('the payload', payload, 'session user id', session.user.id)
      // Try updating without the JSON columns first to isolate the issue
      const basicData = { ...coverLetterData };
      delete basicData.sender;
      delete basicData.recipient;
      
      // Log the exact ID we're using for the update
      console.log('Attempting update with ID:', payload.id, 'Type:', typeof payload.id);
      
      // Try a direct update with the exact same query that worked for select
      console.log('Attempting update with the same query that worked for select');
      const basicResult = await supabase
        .from('cover_letters')
        .update(basicData)
        .eq('id', payload.id)
        .select('id')
        .maybeSingle();
      
      console.log('Basic update result:', basicResult);
      
      // Declare result variable outside the conditional blocks
      let result;
      
      // If basic update works, then update JSON columns separately
      if (basicResult.data && !basicResult.error) {
        console.log('Basic update successful, now updating JSON columns...');
        const jsonResult = await supabase
          .from('cover_letters')
          .update({
            sender: coverLetterData.sender,
            recipient: coverLetterData.recipient
          })
          .eq('id', payload.id)
          .select('*')
          .maybeSingle();
          
        console.log('JSON fields update result:', jsonResult);
        result = jsonResult;
      } else {
        // If basic update fails, use the result from that attempt
        result = basicResult;
      }

 

      data = result.data;
      error = result.error;

      console.log('the result', result)
      
      // If the update failed, try updating just a single field as a fallback
      if (!data && !error) {
        console.log('Full update returned no data, trying minimal update...');
        const minimalResult = await supabase
          .from('cover_letters')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', payload.id)
          .select('*')
          .maybeSingle();
          
        console.log('Minimal update result:', minimalResult);
        
        // If all else fails, try a raw SQL query as a last resort
        if (!minimalResult.data && !minimalResult.error) {
          console.log('Trying raw SQL update as last resort...');
          const rawResult = await supabase.rpc('update_cover_letter_content', { 
            p_id: payload.id,
            p_content: payload.content || ''
          });
          
          console.log('Raw SQL update result:', rawResult);
        }
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
      if (error.code === '22P02') { // invalid_text_representation (e.g., bad UUID format somehow got through)
        return NextResponse.json({ error: `Database type error: ${error.message}. Ensure IDs are correct UUID format.` }, { status: 400 });
      }
      // Generic database error
      return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
    }

    // Check if data or id is missing after operation (should not happen with .single() if no error)
    if (!data?.id) {
      console.error('API Save Route: Operation completed but no ID returned');
      return NextResponse.json({ error: 'Failed to save cover letter (no ID retrieved after operation)' }, { status: 500 });
    }

    // This code should not be reached if the earlier returns work properly
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