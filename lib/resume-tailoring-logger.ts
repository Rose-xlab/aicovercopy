// lib/resume-tailoring-logger.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Logs resume tailoring events to track usage and improve the feature
 */
export async function logResumeTailoring(
  userId: string,
  resumeId: string,
  jobDescription: string,
  changes: string[],
  keywordMatches: number,
  success: boolean
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Insert the log entry
    await supabase
      .from('resume_tailoring_logs')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        job_description_length: jobDescription.length,
        sections_changed: changes,
        keyword_matches: keywordMatches,
        is_successful: success,
        created_at: new Date().toISOString()
      });
      
    console.log(`Resume tailoring logged for user ${userId}, resume ${resumeId}`);
  } catch (error) {
    // Non-critical, just log the error
    console.error('Error logging resume tailoring:', error);
  }
}

/**
 * Creates the necessary database table for resume tailoring logs if it doesn't exist
 * This can be called during app initialization
 */
export async function ensureResumeTailoringLogsTable(supabase: any) {
  try {
    // Check if the table exists
    const { data, error } = await supabase
      .from('resume_tailoring_logs')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') { // Relation does not exist
      // Table doesn't exist, let's create it using raw SQL
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS resume_tailoring_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
          job_description_length INTEGER NOT NULL,
          sections_changed TEXT[] NOT NULL,
          keyword_matches INTEGER NOT NULL,
          is_successful BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          feedback TEXT
        );
        
        CREATE INDEX IF NOT EXISTS resume_tailoring_logs_user_id_idx ON resume_tailoring_logs(user_id);
        CREATE INDEX IF NOT EXISTS resume_tailoring_logs_resume_id_idx ON resume_tailoring_logs(resume_id);
        CREATE INDEX IF NOT EXISTS resume_tailoring_logs_created_at_idx ON resume_tailoring_logs(created_at);
      `;
      
      await supabase.rpc('exec_sql', { query: createTableQuery });
      console.log('Resume tailoring logs table created successfully');
    }
  } catch (error) {
    console.error('Error ensuring resume tailoring logs table:', error);
  }
}