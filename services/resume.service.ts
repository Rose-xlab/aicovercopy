import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

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

            // Store all relevant metadata inside the JSON field
            const extractedDataWithMetadata = {
                ...parsedResume,
                sourceFileName: fileName,
                sourceFileType: fileType,
                importedAt: new Date().toISOString(),
                source: sourceType || 'manual',
                sourceCV: cvId || null, // This now gets saved inside the JSON
            };

            // This insert statement now matches your actual database schema
            const { data, error } = await this.supabase
                .from('resume_extractions')
                .insert({
                    user_id: userId,
                    filename: fileName,
                    file_type: fileType,
                    extracted_data: extractedDataWithMetadata, // All data goes here
                    created_at: new Date().toISOString()
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

    async createCVFromResume(
        userId: string,
        resumeData: any,
        fileBuffer: ArrayBuffer,
        fileType: string
    ) {
        try {
            const fileExt = fileType.split('/').pop() || 'pdf';
            const filePath = `user_${userId}/cv_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await this.supabase.storage
                .from('cvs')
                .upload(filePath, fileBuffer, {
                    contentType: fileType,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = this.supabase.storage
                .from('cvs')
                .getPublicUrl(filePath);

            // Assuming your 'user_cvs' table is correct.
            const { data: cvData, error: cvError } = await this.supabase
                .from('user_cvs')
                .insert({
                    user_id: userId,
                    filename: resumeData.sourceFileName || 'resume',
                    filetype: fileType,
                    file_url: publicUrl,
                    filepath: filePath,
                    filesize: fileBuffer.byteLength,
                    uploaded_at: new Date().toISOString(),
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