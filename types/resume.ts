// types/resume.ts 

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

// UI/Application focused Resume Data structure (camelCase)
export interface ResumeData {
  id: string;
  userId: string; // camelCase
  title: string;
  personalInfo: PersonalInformation; // Use specific type
  workExperience: WorkExperience[]; // Use specific type
  education: Education[]; // Use specific type
  skills: Skill[]; // Use specific type
  projects?: Project[]; // Optional
  languages?: Language[]; // Optional
  certifications?: Certification[]; // Optional
  interests?: string[] | Hobby[]; // Optional
  internships?: Internship[]; // Optional
  references?: Reference[]; // Optional
  referenceText?: string; // Optional
  customSections?: CustomContent[]; // Optional
  templateId: string; // Required string
  isPublic: boolean; // Required boolean
  created_at?: string; // Optional (DB sets on insert)
  updated_at?: string; // Optional (DB sets on update)

  // CV integration fields (camelCase)
  sourceCV?: string;      // Optional
  source?: string;        // Optional
  sourceFileName?: string;// Optional
  sourceFileType?: string;// Optional
  importedAt?: string;    // Optional
  is_imported?: boolean;  // Optional (keep snake_case if DB uses it and mapper handles)
}

// Database focused Resume Data structure (snake_case)
// Matches supabase.ts more closely
export interface DatabaseResumeData {
  id: string;
  user_id: string; // snake_case
  title: string;
  personal_info: PersonalInformation; // Assuming JSON maps directly
  work_experience: WorkExperience[]; // Assuming JSON maps directly
  education: Education[]; // Assuming JSON maps directly
  skills: Skill[]; // Assuming JSON maps directly
  projects?: Project[] | null; // Optional + Nullable
  languages?: Language[] | null; // Optional + Nullable
  certifications?: Certification[] | null; // Optional + Nullable
  interests?: string[] | Hobby[] | null; // Optional + Nullable
  reference_text?: string | null; // Optional + Nullable
  internships?: Internship[] | null; // Optional + Nullable
  references?: Reference[] | null; // Optional + Nullable
  custom_sections?: CustomContent[] | null; // Optional + Nullable
  template_id: string; // Required string
  is_public: boolean; // Required boolean
  created_at: string; // Required string (DB default)
  updated_at: string; // Required string (DB default)

  // CV integration fields (snake_case)
  source_cv?: string | null;      // Optional + Nullable
  source?: string | null;         // Optional + Nullable
  source_file_name?: string | null;// Optional + Nullable
  source_file_type?: string | null;// Optional + Nullable
  imported_at?: string | null;    // Optional + Nullable
  is_imported?: boolean | null;   // Optional + Nullable
}


// Template Types (Combine ResumeTemplate and DatabaseResumeTemplate from other file)

export interface ResumeTemplate {
  id: string;
  name: string;
  description?: string | null; // Optional in UI type
  thumbnail?: string | null; // Optional in UI type
  htmlContent: string; // Required
  cssContent: string; // Required
  category?: 'Professional' | 'Creative' | 'Modern' | 'Simple' | 'Academic' | string | null; // Allow specific + general string, optional
  isPublic?: boolean | null; // Optional
  // userId?: string | null; // Usually not needed in UI model
  created_at?: string | null; // Optional
  updated_at?: string | null; // Optional
}

export interface DatabaseResumeTemplate {
  id: string;
  name: string;
  description: string | null; // Nullable in DB
  thumbnail: string | null; // Nullable in DB
  html_content: string; // Required
  css_content: string; // Required
  category: 'Professional' | 'Creative' | 'Modern' | 'Simple' | 'Academic' | string | null; // Nullable in DB
  is_public: boolean | null; // Nullable in DB
  user_id: string | null; // Nullable in DB
  created_at: string | null; // Nullable in DB
  updated_at: string | null; // Nullable in DB
}


// --- Mapping Functions ---

// Function to map database format (snake_case) to UI format (camelCase)
export function mapDatabaseToResumeData(dbResume: DatabaseResumeData | null | undefined): ResumeData | null {
  if (!dbResume) {
    console.warn("mapDatabaseToResumeData received null or undefined input.");
    return null;
  }

  try {
    const mappedData: ResumeData = {
      id: dbResume.id,
      userId: dbResume.user_id,
      title: dbResume.title || 'Untitled Resume',
      personalInfo: dbResume.personal_info || { firstName: '', lastName: '', title: '', summary: '', contact: { email: '', phone: '', location: '' } }, // Provide default
      workExperience: (Array.isArray(dbResume.work_experience) ? dbResume.work_experience : []) as WorkExperience[],
      education: (Array.isArray(dbResume.education) ? dbResume.education : []) as Education[],
      skills: (Array.isArray(dbResume.skills) ? dbResume.skills : []) as Skill[],
      projects: Array.isArray(dbResume.projects) ? dbResume.projects as Project[] : undefined,
      languages: Array.isArray(dbResume.languages) ? dbResume.languages as Language[] : undefined,
      certifications: Array.isArray(dbResume.certifications) ? dbResume.certifications as Certification[] : undefined,
      interests: Array.isArray(dbResume.interests) ? dbResume.interests : undefined,
      internships: Array.isArray(dbResume.internships) ? dbResume.internships as Internship[] : undefined,
      references: Array.isArray(dbResume.references) ? dbResume.references as Reference[] : undefined,
      customSections: Array.isArray(dbResume.custom_sections) ? dbResume.custom_sections as CustomContent[] : undefined,
      referenceText: dbResume.reference_text || undefined, // Map null to undefined
      templateId: dbResume.template_id || '', // Map null/undefined DB value to '' for required string UI type
      isPublic: dbResume.is_public ?? false,
      sourceCV: dbResume.source_cv || undefined, // Map null to undefined
      created_at: dbResume.created_at || undefined,
      updated_at: dbResume.updated_at || undefined,
      is_imported: dbResume.is_imported ?? undefined, // Use undefined for optional boolean
      source: dbResume.source || undefined,
      sourceFileName: dbResume.source_file_name || undefined,
      sourceFileType: dbResume.source_file_type || undefined,
      importedAt: dbResume.imported_at || undefined,
    };
    return mappedData;
  } catch (error) {
    console.error("Error in mapDatabaseToResumeData:", error, "Input data:", dbResume);
    return null;
  }
}

// Function to map UI format (camelCase) to database format (snake_case)
export function mapResumeToDatabase(uiData: ResumeData | null | undefined): Partial<DatabaseResumeData> | null {
   if (!uiData) {
       console.warn("mapResumeToDatabase received null or undefined input.");
       return null;
   }

   try {
       const mappedData: Partial<DatabaseResumeData> = {
           id: uiData.id,
           user_id: uiData.userId,
           title: uiData.title,
           personal_info: uiData.personalInfo,
           work_experience: uiData.workExperience,
           education: uiData.education,
           skills: uiData.skills,
           projects: (Array.isArray(uiData.projects) && uiData.projects.length > 0) ? uiData.projects : null, // Map empty/undefined to null for DB
           languages: (Array.isArray(uiData.languages) && uiData.languages.length > 0) ? uiData.languages : null,
           certifications: (Array.isArray(uiData.certifications) && uiData.certifications.length > 0) ? uiData.certifications : null,
           interests: (Array.isArray(uiData.interests) && uiData.interests.length > 0) ? uiData.interests : null,
           internships: (Array.isArray(uiData.internships) && uiData.internships.length > 0) ? uiData.internships : null,
           references: (Array.isArray(uiData.references) && uiData.references.length > 0) ? uiData.references : null,
           custom_sections: (Array.isArray(uiData.customSections) && uiData.customSections.length > 0) ? uiData.customSections : null,
           reference_text: uiData.referenceText || null, // Map empty/undefined to null
           template_id: uiData.templateId, // Pass directly, assuming valid string from UI
           is_public: uiData.isPublic ?? false,
           source_cv: uiData.sourceCV || null, // Map empty/undefined to null
           updated_at: uiData.updated_at || new Date().toISOString(),
           is_imported: uiData.is_imported ?? null, // Map undefined to null for DB
           source: uiData.source || null,
           source_file_name: uiData.sourceFileName || null,
           source_file_type: uiData.sourceFileType || null,
           imported_at: uiData.importedAt || null,
           // created_at is handled by DB on insert
       };

       // Remove cleanup logic for template_id as it's required
       // if (mappedData.template_id === '') mappedData.template_id = null;

       // Cleanup for optional source_cv (map empty string to null)
       if (mappedData.source_cv === '') mappedData.source_cv = null;

       return mappedData;

   } catch (error) {
       console.error("Error in mapResumeToDatabase:", error, "Input data:", uiData);
       return null;
   }
 }

// Mapper for Resume Templates
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
    // userId: dbTemplate.user_id, // Usually not needed in UI model
    created_at: dbTemplate.created_at,
    updated_at: dbTemplate.updated_at
  };
}

// Mapper for UI Template to DB Template (Example, adjust as needed)
export function mapResumeTemplateToDatabase(template: ResumeTemplate): Partial<DatabaseResumeTemplate> {
  return {
    id: template.id, // Include ID if updating
    name: template.name,
    description: template.description || null,
    category: template.category || null,
    html_content: template.htmlContent,
    css_content: template.cssContent,
    thumbnail: template.thumbnail || null,
    is_public: template.isPublic ?? false,
    // user_id: template.userId || null, // Set user_id if needed
    // created_at handled by DB
    updated_at: new Date().toISOString() // Set on update
  };
}


/**
 * @deprecated This function might be redundant if mapping is handled correctly at API/component boundaries.
 * Review usage before removing. It attempts to ensure both camelCase and snake_case versions
 * of key fields exist on an object, which can lead to bloated data structures.
 */
export function ensureDualFormatFields(data: any): any | null {
   if (!data) return null;
   console.warn("Usage of ensureDualFormatFields is deprecated. Review mapping logic.");
   const dualFormatData = { ...data };
   const fieldMappings = [
       { camel: 'personalInfo', snake: 'personal_info' },
       { camel: 'workExperience', snake: 'work_experience' },
       { camel: 'customSections', snake: 'custom_sections' },
       { camel: 'userId', snake: 'user_id' },
       { camel: 'referenceText', snake: 'reference_text' },
       { camel: 'templateId', snake: 'template_id' },
       { camel: 'isPublic', snake: 'is_public' },
       { camel: 'createdAt', snake: 'created_at' },
       { camel: 'updatedAt', snake: 'updated_at' },
       { camel: 'sourceCV', snake: 'source_cv' },
       { camel: 'isImported', snake: 'is_imported' },
       { camel: 'sourceFileName', snake: 'source_file_name' },
       { camel: 'sourceFileType', snake: 'source_file_type' },
       { camel: 'importedAt', snake: 'imported_at' }
   ];
   fieldMappings.forEach(mapping => {
       if (dualFormatData.hasOwnProperty(mapping.camel) && !dualFormatData.hasOwnProperty(mapping.snake)) {
           dualFormatData[mapping.snake] = dualFormatData[mapping.camel];
       } else if (dualFormatData.hasOwnProperty(mapping.snake) && !dualFormatData.hasOwnProperty(mapping.camel)) {
           dualFormatData[mapping.camel] = dualFormatData[mapping.snake];
       }
   });
   return dualFormatData;
}

// Other type definitions from the original file
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
}

export type ResumeExportFormat = 'pdf' | 'docx' | 'txt';

export interface ResumeExportRequest {
  resumeId: string;
  templateId: string;
  format: ResumeExportFormat;
  filename?: string;
}
