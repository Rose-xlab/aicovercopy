// app/api/webhooks/cover-letter-complete/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client for webhook access (using service role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhooks need to be public endpoints without authentication
export async function POST(request: Request) {
  try {
    // Parse webhook payload
    const payload = await request.json();
    
    // Verify required fields
    if (!payload.coverLetterId || !payload.webhookToken || !payload.status) {
      console.error('Invalid webhook payload:', payload);
      return NextResponse.json(
        { error: 'Invalid webhook payload - missing required fields' },
        { status: 400 }
      );
    }
    
    // Find the cover letter record
    const { data: coverLetter, error: fetchError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', payload.coverLetterId)
      .single();
      
    if (fetchError) {
      console.error('Error finding cover letter:', fetchError, 'for ID:', payload.coverLetterId);
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }
    
    // Verify the webhook token to ensure the call is legitimate
    if (coverLetter.webhook_token !== payload.webhookToken) {
      console.error('Invalid webhook token provided:', payload.webhookToken, 'expected:', coverLetter.webhook_token);
      return NextResponse.json(
        { error: 'Unauthorized webhook call - invalid token' },
        { status: 401 }
      );
    }
    
    // Update the cover letter record with the results
    const updateData: any = {
      status: payload.status,
      updated_at: new Date().toISOString(),
    };
    
    // Add content if available (for completed status)
    if (payload.status === 'completed' && payload.content) {
      updateData.content = payload.content;
    }
    
    // Add error message if failed
    if (payload.status === 'failed' && payload.error) {
      updateData.error_message = payload.error;
    }
    
    console.log('Updating cover letter with data:', updateData);
    
    // Update the database
    const { error: updateError } = await supabase
      .from('cover_letters')
      .update(updateData)
      .eq('id', payload.coverLetterId);
      
    if (updateError) {
      console.error('Error updating cover letter:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cover letter' },
        { status: 500 }
      );
    }
    
    // Emit a real-time event for clients to pick up
    // This inserts a record into cover_letter_updates table
    const { error: insertError } = await supabase
      .from('cover_letter_updates')
      .insert({
        cover_letter_id: payload.coverLetterId,
        status: payload.status,
        user_id: coverLetter.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting real-time update:', insertError);
      // Don't fail the webhook - the cover letter was updated successfully
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cover letter status updated successfully'
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook: ' + error.message },
      { status: 500 }
    );
  }
}



