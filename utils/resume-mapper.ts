// utils/resume-mapper.ts
import { ResumeData, DatabaseResumeData } from '@/types/resume';

/**
 * Converts database snake_case object to application camelCase
 */
export function mapDatabaseToResumeData(dbResume: DatabaseResumeData): ResumeData {
  return {
    id: dbResume.id,
    userId: dbResume.user_id,
    title: dbResume.title,
    personalInfo: dbResume.personal_info,
    workExperience: dbResume.work_experience,
    education: dbResume.education,
    skills: dbResume.skills,
    projects: dbResume.projects,
    languages: dbResume.languages,
    certifications: dbResume.certifications,
    interests: dbResume.interests,
    referenceText: dbResume.reference_text,
    templateId: dbResume.template_id,
    isPublic: dbResume.is_public,
    createdAt: dbResume.created_at,
    updatedAt: dbResume.updated_at
  };
}

/**
 * Converts application camelCase object to database snake_case
 */
export function mapResumeToDatabase(resume: ResumeData): DatabaseResumeData {
  return {
    id: resume.id,
    user_id: resume.userId,
    title: resume.title,
    personal_info: resume.personalInfo,
    work_experience: resume.workExperience,
    education: resume.education,
    skills: resume.skills,
    projects: resume.projects,
    languages: resume.languages,
    certifications: resume.certifications,
    interests: resume.interests,
    reference_text: resume.referenceText,
    template_id: resume.templateId,
    is_public: resume.isPublic,
    created_at: resume.createdAt,
    updated_at: resume.updatedAt
  };
}