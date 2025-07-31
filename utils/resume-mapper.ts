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
    projects: dbResume.projects || undefined,
    languages: dbResume.languages || undefined,
    certifications: dbResume.certifications || undefined,
    interests: dbResume.interests || undefined,
    referenceText: dbResume.reference_text || undefined,
    templateId: dbResume.template_id,
    isPublic: dbResume.is_public,
    created_at: dbResume.created_at,
    updated_at: dbResume.updated_at
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
    created_at: resume.created_at ?? new Date().toISOString(),
    updated_at: resume.updated_at ?? new Date().toISOString()
  };
}