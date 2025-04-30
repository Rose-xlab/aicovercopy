export interface CoverLetter {
    id: string;
    user_id: string;
    job_description: string;
    content: string | null;
    tone: string;
    created_at: Date | null;
    job_title: string | null;
    company_name: string | null;
    data_source: 'cv' | 'linkedin' | 'none' | 'both';
}