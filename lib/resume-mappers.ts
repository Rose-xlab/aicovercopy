/**
 * This file contains utility functions for mapping resume data between different formats:
 * - Database format (snake_case keys, potentially null arrays/objects)
 * - UI component format (camelCase keys, typically expects initialized arrays/objects)
 */
// Import correct types from the definitive types file
import {
  ResumeData,
  DatabaseResumeData,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  Reference,
  Internship,
  CustomContent,
  PersonalInformation // <<< Correct import name
} from '@/types/resume';

// Function to map database format (snake_case) to UI format (camelCase)
export function mapDatabaseToResumeData(dbData: DatabaseResumeData | null | undefined): ResumeData | null {
if (!dbData) {
    console.warn("mapDatabaseToResumeData received null or undefined input.");
    return null;
}

try {
    // Create a new object conforming to ResumeData type
    const mappedData: ResumeData = {
        id: dbData.id,
        userId: dbData.user_id,
        title: dbData.title || 'Untitled Resume',

        // Use PersonalInformation type, provide defaults for contact sub-object
        personalInfo: {
            firstName: dbData.personal_info?.firstName || '',
            lastName: dbData.personal_info?.lastName || '',
            title: dbData.personal_info?.title || '',
            summary: dbData.personal_info?.summary || '',
            contact: {
                email: dbData.personal_info?.contact?.email || '',
                phone: dbData.personal_info?.contact?.phone || '',
                location: dbData.personal_info?.contact?.location || '',
                linkedIn: dbData.personal_info?.contact?.linkedIn || '',
                website: dbData.personal_info?.contact?.website || '',
                // Add github if it exists in PersonalInformation.Contact type
                github: dbData.personal_info?.contact?.github || ''
            }
        },

        // Required arrays default to []
        workExperience: (Array.isArray(dbData.work_experience) ? dbData.work_experience : []) as WorkExperience[],
        education: (Array.isArray(dbData.education) ? dbData.education : []) as Education[],
        skills: (Array.isArray(dbData.skills) ? dbData.skills : []) as Skill[],

        // Optional arrays map to undefined if null/missing in DB (matching '?:' in ResumeData)
        projects: Array.isArray(dbData.projects) ? dbData.projects as Project[] : undefined,
        languages: Array.isArray(dbData.languages) ? dbData.languages as Language[] : undefined,
        certifications: Array.isArray(dbData.certifications) ? dbData.certifications as Certification[] : undefined,
        interests: Array.isArray(dbData.interests) ? dbData.interests : undefined, // Assuming interests is string[] | Hobby[] | null in DB
        internships: Array.isArray(dbData.internships) ? dbData.internships as Internship[] : undefined,
        references: Array.isArray(dbData.references) ? dbData.references as Reference[] : undefined,
        customSections: Array.isArray(dbData.custom_sections) ? dbData.custom_sections as CustomContent[] : undefined,

        referenceText: dbData.reference_text || undefined, // Map null to undefined for optional string

        // FIX: templateId is required string in ResumeData. Map null/undefined from DB to empty string.
        templateId: dbData.template_id || '',

        isPublic: dbData.is_public ?? false,

        // FIX: sourceCV is optional string (string | undefined) in ResumeData. Map null from DB to undefined.
        sourceCV: dbData.source_cv || undefined,

        // Pass through timestamps and other fields if defined in ResumeData
        created_at: dbData.created_at || undefined,
        updated_at: dbData.updated_at || undefined,
        is_imported: dbData.is_imported ?? undefined, // Map is_imported if present
        source: dbData.source || undefined,
        sourceFileName: dbData.source_file_name || undefined,
        sourceFileType: dbData.source_file_type || undefined,
        importedAt: dbData.imported_at || undefined,
    };

    return mappedData;

} catch (error) {
    console.error("Error in mapDatabaseToResumeData:", error, "Input data:", dbData);
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

         // Map optional UI fields to undefined if empty/missing, matching '?:' in DatabaseResumeData
         projects: (Array.isArray(uiData.projects) && uiData.projects.length > 0) ? uiData.projects : undefined,
         languages: (Array.isArray(uiData.languages) && uiData.languages.length > 0) ? uiData.languages : undefined,
         certifications: (Array.isArray(uiData.certifications) && uiData.certifications.length > 0) ? uiData.certifications : undefined,
         interests: (Array.isArray(uiData.interests) && uiData.interests.length > 0) ? uiData.interests : undefined,
         internships: (Array.isArray(uiData.internships) && uiData.internships.length > 0) ? uiData.internships : undefined,
         references: (Array.isArray(uiData.references) && uiData.references.length > 0) ? uiData.references : undefined,
         custom_sections: (Array.isArray(uiData.customSections) && uiData.customSections.length > 0) ? uiData.customSections : undefined,

         reference_text: uiData.referenceText || undefined, // Map empty/undefined to undefined

         // FIX: template_id is required string in DatabaseResumeData. Assume uiData.templateId is valid. Remove defaulting/cleanup.
         template_id: uiData.templateId, // Pass directly - calling code must ensure it's a non-empty string

         is_public: uiData.isPublic ?? false,

         // FIX: source_cv is optional string in DatabaseResumeData. Map empty/undefined to undefined.
         source_cv: uiData.sourceCV || undefined,

         updated_at: uiData.updated_at || new Date().toISOString(), // Ensure updated_at is set
         // Map other fields if they exist in both types
         is_imported: uiData.is_imported ?? undefined,
         source: uiData.source || undefined,
         source_file_name: uiData.sourceFileName || undefined,
         source_file_type: uiData.sourceFileType || undefined,
         imported_at: uiData.importedAt || undefined,
         // Note: created_at is usually handled by DB default on insert
     };

     // --- REMOVED Cleanup logic for template_id as it's required ---
     // if (mappedData.template_id === '') mappedData.template_id = undefined;

     // Cleanup for optional source_cv (map empty string to undefined)
     if (mappedData.source_cv === '') mappedData.source_cv = undefined;


     return mappedData;

 } catch (error) {
     console.error("Error in mapResumeToDatabase:", error, "Input data:", uiData);
     return null;
 }
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
