import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Service for handling resume-related operations
 */
class ResumeService {
    private supabase: SupabaseClient<Database>;

    constructor() {
        this.supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
    }

    /**
     * Save parsed resume data to the database
     */
    async saveParsedResume(
        userId: string,
        parsedResume: any,
        options: {
            sourceType?: string;
            cvId?: string | null;
            fileName: string;
            fileType: string;
        }
    ) {
        try {
            const { sourceType, cvId, fileName, fileType } = options;

            // Add import metadata
            const resumeData = {
                ...parsedResume,
                sourceFileName: fileName,
                sourceFileType: fileType,
                importedAt: new Date().toISOString(),
                source: sourceType || 'manual',
                sourceCV: cvId || null,
                userId
            };

            // Save to resume_extractions table
            const { data, error } = await this.supabase
                .from('resume_extractions')
                .insert({
                    user_id: userId,
                    filename: fileName,
                    file_type: fileType,
                    extracted_data: resumeData,
                    created_at: new Date().toISOString(),
                    source_type: sourceType || 'manual',
                    source_cv: cvId || null
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error saving parsed resume:', error);
            throw error;
        }
    }

    /**
     * Create a CV record for a directly uploaded resume
     */
    async createCVFromResume(
        userId: string,
        resumeData: any,
        fileBuffer: ArrayBuffer,
        fileType: string
    ) {
        try {
            // Upload the file to storage
            const fileExt = fileType.split('/').pop();
            const filePath = `user_${userId}/cv_${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('cvs')
                .upload(filePath, fileBuffer, {
                    contentType: fileType,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('cvs')
                .getPublicUrl(filePath);

            // Create CV record
            const { data: cvData, error: cvError } = await this.supabase
                .from('user_cvs')
                .insert({
                    user_id: userId,
                    filename: resumeData.sourceFileName || 'resume',
                    filetype: fileType,
                    file_url: publicUrl,
                    storage_path: filePath,
                    is_parsed: true,
                    parsed_data: resumeData,
                    source: 'resume_import'
                })
                .select()
                .single();

            if (cvError) throw cvError;

            return cvData;
        } catch (error) {
            console.error('Error creating CV from resume:', error);
            throw error;
        }
    }
}

export const resumeService = new ResumeService();