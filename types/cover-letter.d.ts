//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\types\cover-letter.d.ts

export interface CoverLetter {
    id?: string;
    userId: string;
    templateId?: string;
    jobDescription: string;
    content: string | null;
    sender?:SenderInfo
    recipient?:RecipientInfo
    tone: string;
    created_at: Date | null;
    jobTitle: string | null;
    companyName: string | null;
    data_source: 'cv' | 'linkedin' | 'none' | 'both';
}

export interface SenderInfo {
    name?: string
    address?: string
    email?: string
    phone?: string

}

export interface RecipientInfo{
    company?:string
    name?: string
    title?: string
    address?: string
}