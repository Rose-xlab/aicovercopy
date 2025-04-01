// types/follow-up.ts

// Follow-up email style options
export type FollowUpStyle = 'gentle' | 'direct' | 'value-add';

// Tone options for the email
export type FollowUpTone = 'formal' | 'conversational' | 'enthusiastic';

// Database representation of a follow-up email
export interface FollowUpEmailRecord {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  contact_name?: string | null;
  application_date: string;
  subject: string;
  greeting: string;
  body: string;
  signature: string;
  style: FollowUpStyle;
  tone?: FollowUpTone | null;
  related_cover_letter_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  sent_at?: string | null;
  sent_to?: string | null;
  response_received?: boolean;
}

// Application-side representation with camelCase properties
export interface FollowUpEmail {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  contactName?: string;
  applicationDate: string;
  subject: string;
  greeting: string;
  body: string;
  signature: string;
  style: FollowUpStyle;
  tone?: FollowUpTone;
  relatedCoverLetterId?: string;
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
  sentTo?: string;
  responseReceived?: boolean;
}

// Form data for creating a follow-up email
export interface FollowUpEmailFormData {
  jobTitle: string;
  companyName: string;
  contactName?: string;
  applicationDate: string;
  followUpStyle: FollowUpStyle;
  tone?: FollowUpTone;
  additionalInfo?: string;
  intentToCall?: boolean;
  relatedCoverLetterId?: string;
}

// Parameters for generating a follow-up email
export interface FollowUpEmailGenerationParams {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  contactName?: string;
  applicationDate: string;
  followUpStyle: FollowUpStyle;
  tone?: FollowUpTone;
  additionalInfo?: string;
  intentToCall?: boolean;
  originalCoverLetterContent?: string;
  resumeHighlights?: string[];
  coverLetterId?: string;
}

// Response from the follow-up email generation API
export interface FollowUpEmailGenerationResult {
  subject: string;
  greeting: string;
  body: string;
  signature: string;
  suggestions?: string[];
}

// Utility functions to convert between formats
export function mapDbToAppFollowUp(dbRecord: FollowUpEmailRecord): FollowUpEmail {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    jobTitle: dbRecord.job_title,
    companyName: dbRecord.company_name,
    contactName: dbRecord.contact_name || undefined,
    applicationDate: dbRecord.application_date,
    subject: dbRecord.subject,
    greeting: dbRecord.greeting,
    body: dbRecord.body,
    signature: dbRecord.signature,
    style: dbRecord.style,
    tone: dbRecord.tone || undefined,
    relatedCoverLetterId: dbRecord.related_cover_letter_id || undefined,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at || undefined,
    sentAt: dbRecord.sent_at || undefined,
    sentTo: dbRecord.sent_to || undefined,
    responseReceived: dbRecord.response_received
  };
}

export function mapAppToDbFollowUp(appRecord: FollowUpEmail): FollowUpEmailRecord {
  return {
    id: appRecord.id,
    user_id: appRecord.userId,
    job_title: appRecord.jobTitle,
    company_name: appRecord.companyName,
    contact_name: appRecord.contactName || null,
    application_date: appRecord.applicationDate,
    subject: appRecord.subject,
    greeting: appRecord.greeting,
    body: appRecord.body,
    signature: appRecord.signature,
    style: appRecord.style,
    tone: appRecord.tone || null,
    related_cover_letter_id: appRecord.relatedCoverLetterId || null,
    created_at: appRecord.createdAt,
    updated_at: appRecord.updatedAt || null,
    sent_at: appRecord.sentAt || null,
    sent_to: appRecord.sentTo || null,
    response_received: appRecord.responseReceived || false
  };
}