/**
 * Types for the interview buddy feature
 */

export interface InterviewQuestion {
    id: string;
    question: string;
    suggestedAnswer: string;
    category: string;
    difficulty: string;
    notes?: string;
    isBookmarked?: boolean;
  }
  
  export type InterviewType = 'technical' | 'behavioral' | 'mixed';
  export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';
  
  export interface InterviewSession {
    id?: string;
    userId?: string;
    resumeId: string;
    resumeTitle?: string;
    jobTitle: string;
    jobDescription?: string;
    interviewType: InterviewType;
    difficulty: DifficultyLevel;
    questions: InterviewQuestion[];
    createdAt?: string;
    updatedAt?: string;
    notes?: string;
    tags?: string[];
  }
  
  export interface InterviewSessionResponse {
    id: string;
    user_id: string;
    resume_id: string;
    job_title: string;
    job_description: string | null;
    interview_type: InterviewType;
    difficulty: DifficultyLevel;
    questions_answers: InterviewQuestion[];
    created_at: string;
    updated_at: string | null;
    notes: string | null;
    tags: string[] | null;
    resumes?: {
      title: string;
    };
  }
  
  // For mapping between database format and application format
  export function mapDbToInterviewSession(dbSession: InterviewSessionResponse): InterviewSession {
    return {
      id: dbSession.id,
      userId: dbSession.user_id,
      resumeId: dbSession.resume_id,
      resumeTitle: dbSession.resumes?.title,
      jobTitle: dbSession.job_title,
      jobDescription: dbSession.job_description || undefined,
      interviewType: dbSession.interview_type,
      difficulty: dbSession.difficulty,
      questions: dbSession.questions_answers || [],
      createdAt: dbSession.created_at,
      updatedAt: dbSession.updated_at || undefined,
      notes: dbSession.notes || undefined,
      tags: dbSession.tags || undefined
    };
  }
  
  // For mapping from application format to database format
  export function mapInterviewSessionToDb(session: InterviewSession) {
    return {
      id: session.id,
      user_id: session.userId,
      resume_id: session.resumeId,
      job_title: session.jobTitle,
      job_description: session.jobDescription || null,
      interview_type: session.interviewType,
      difficulty: session.difficulty,
      questions_answers: session.questions,
      created_at: session.createdAt || new Date().toISOString(),
      updated_at: session.updatedAt || null,
      notes: session.notes || null,
      tags: session.tags || null
    };
  }