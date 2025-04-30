// lib/cv-helpers.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// CV file interfaces - based on your actual database schema
export interface CvFile {
  id: string;
  name: string;            // Maps to filename in database
  size: number;            // Maps to filesize in database
  type: string;            // Maps to filetype in database
  uploadDate: string;      // Maps to uploaded_at in database
  isSelected?: boolean;    // Maps to is_selected in database (can be undefined or boolean)
  fileUrl?: string;        // Maps to file_url in database
  filePath?: string;       // Maps to filepath in database
  cvText?: string;         // Maps to cv_text in database
  // We'll handle resume linking through a separate mechanism
  // since resume_id doesn't exist in the database yet
}

// Type for database user_cvs table
type DbCvFile = Database['public']['Tables']['user_cvs']['Row'];

/**
 * Maps a database CV record to the application CV interface
 */
export function mapDbCvToAppCv(dbCv: DbCvFile): CvFile {
  return {
    id: dbCv.id,
    name: dbCv.filename,
    size: dbCv.filesize,
    type: dbCv.filetype,
    uploadDate: dbCv.uploaded_at,
    isSelected: dbCv.is_selected === null ? false : dbCv.is_selected,
    fileUrl: dbCv.file_url,
    filePath: dbCv.filepath,
    cvText: dbCv.cv_text || undefined
  };
}

/**
 * Maps an application CV object to the database schema
 */
export function mapAppCvToDb(cv: CvFile, userId: string): Partial<DbCvFile> {
  return {
    id: cv.id,
    user_id: userId,
    filename: cv.name,
    filesize: cv.size,
    filetype: cv.type,
    uploaded_at: cv.uploadDate,
    is_selected: cv.isSelected === undefined ? null : cv.isSelected,
    file_url: cv.fileUrl,
    filepath: cv.filePath,
    cv_text: cv.cvText || null
  };
}

/**
 * Finds the corresponding resume for a CV by checking the source_cv field in resumes
 * This is a workaround since we don't have resume_id in the user_cvs table yet
 */
export async function findResumeForCv(
  supabase: SupabaseClient<any>,
  cvId: string,
  userId: string
): Promise<string | null> {
  try {
    // Check if there's a resume with this CV as the source
    const { data, error } = await supabase
      .from('resumes')
      .select('id')
      .eq('source_cv', cvId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error finding resume for CV:', error);
      return null;
    }
      
    return data?.id || null;
  } catch (error) {
    console.error('Error in findResumeForCv:', error);
    return null;
  }
}

/**
 * Links a CV to a resume (only updates the resume side since user_cvs doesn't have resume_id)
 */
export async function linkCvToResume(
  supabase: SupabaseClient<any>,
  cvId: string,
  resumeId: string,
  userId: string
): Promise<boolean> {
  try {
    // Update the resume with the CV ID
    const { error } = await supabase
      .from('resumes')
      .update({
        source_cv: cvId,
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error linking CV to resume:', error);
      return false;
    }
      
    return true;
  } catch (error) {
    console.error('Error in linkCvToResume:', error);
    return false;
  }
}

/**
 * Format a file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}