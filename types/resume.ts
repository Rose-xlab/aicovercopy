// types/resume.ts - Define the structure for resume data

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  achievements?: string[];
  isOngoing?: boolean;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  achievements: string[];
  isOngoing?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  url?: string;
}

export interface Contact {
  email: string;
  phone?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  location?: string;
}

export interface PersonalInformation {
  firstName: string;
  lastName: string;
  title: string;
  summary?: string;
  contact: Contact;
}

export interface Hobby {
  id: string;
  name: string;
  description?: string;
}

export interface Internship {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isOngoing?: boolean;
  achievements: string[];
}

export interface Reference {
  id: string;
  name: string;
  company: string;
  position: string;
  relationship: string;
  email: string;
  phone?: string;
  includeInResume: boolean;
}

export interface CustomContent {
  id: string;
  title: string;
  content: string;
  city?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  htmlContent: string;
  cssContent: string;
  category: 'Professional' | 'Creative' | 'Modern' | 'Simple' | 'Academic';
  isPublic: boolean;
  userId?: string;
  created_at?: string; // Changed from createdAt
  updated_at?: string; // Changed from updatedAt
}

export interface ResumeData {
  id: string;
  userId: string;
  title: string;
  personalInfo: PersonalInformation;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects?: Project[];
  languages?: Language[];
  certifications?: Certification[];
  interests?: string[] | Hobby[]; // Keep this as the primary field for hobbies/interests
  // Remove hobbies field since we're using interests
  internships?: Internship[];
  references?: Reference[];
  referenceText?: string;
  customSections?: CustomContent[];
  // Existing fields
  templateId: string;
  isPublic: boolean;
  created_at?: string; // Changed from createdAt
  updated_at?: string; // Changed from updatedAt
}

export interface ResumeGenerationParams {
  targetPosition?: string;
  industry?: string;
  experienceLevel?: 'Entry-level' | 'Junior' | 'Mid-level' | 'Senior' | 'Executive';
  targetCompany?: string;
  key?: string[];
  tone?: 'Professional' | 'Creative' | 'Technical' | 'Academic';
}

export interface AIResumeService {
  generateSummary: (personalInfo: PersonalInformation, workExperience: WorkExperience[], params?: ResumeGenerationParams) => Promise<string>;
  enhanceWorkExperience: (experience: WorkExperience, params?: ResumeGenerationParams) => Promise<WorkExperience>;
  suggestSkills: (personalInfo: PersonalInformation, workExperience: WorkExperience[], targetPosition?: string) => Promise<Skill[]>;
  generateAchievements: (experience: WorkExperience) => Promise<string[]>;
  optimizeResume: (resume: ResumeData, params: ResumeGenerationParams) => Promise<ResumeData>;
  // We won't add additional methods since you're using direct OpenAI calls in your route
}

// Database representation interfaces for mapping
export interface DatabaseResumeTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  html_content: string;
  css_content: string;
  category: 'Professional' | 'Creative' | 'Modern' | 'Simple' | 'Academic';
  is_public: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseResumeData {
  id: string;
  user_id: string;
  title: string;
  personal_info: PersonalInformation;
  work_experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects?: Project[];
  languages?: Language[];
  certifications?: Certification[];
  interests?: string[] | Hobby[]; // This matches the database schema
  reference_text?: string;
  // New fields
  internships?: Internship[];
  references?: Reference[];
  custom_sections?: CustomContent[];
  // Existing fields
  template_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Mapping functions
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
    // New fields
    internships: dbResume.internships,
    references: dbResume.references,
    customSections: dbResume.custom_sections,
    // Existing fields
    templateId: dbResume.template_id,
    isPublic: dbResume.is_public,
    created_at: dbResume.created_at, // Changed from createdAt
    updated_at: dbResume.updated_at  // Changed from updatedAt
  };
}

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
    // New fields
    internships: resume.internships,
    references: resume.references,
    custom_sections: resume.customSections,
    // Existing fields - provide default values for undefined timestamps
    template_id: resume.templateId,
    is_public: resume.isPublic,
    created_at: resume.created_at ?? new Date().toISOString(), // Default value for required field
    updated_at: resume.updated_at ?? new Date().toISOString()  // Default value for required field
  };
}

export function mapDatabaseToResumeTemplate(dbTemplate: DatabaseResumeTemplate): ResumeTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description,
    thumbnail: dbTemplate.thumbnail,
    htmlContent: dbTemplate.html_content,
    cssContent: dbTemplate.css_content,
    category: dbTemplate.category,
    isPublic: dbTemplate.is_public,
    userId: dbTemplate.user_id,
    created_at: dbTemplate.created_at, // Changed from createdAt
    updated_at: dbTemplate.updated_at  // Changed from updatedAt
  };
}