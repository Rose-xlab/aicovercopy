/**
 * This file contains utility functions for mapping resume data between different formats:
 * - Database format (snake_case keys)
 * - UI component format (camelCase keys)
 */

// Function to map database format (snake_case) to UI format (camelCase)
export function mapDatabaseToResumeData(dbData: any) {
    if (!dbData) return null;
    
    // Create a new object with mapped properties
    const mappedData = {
      id: dbData.id,
      userId: dbData.user_id,
      title: dbData.title || 'My Resume',
      personalInfo: dbData.personal_info || {
        firstName: '',
        lastName: '',
        title: '',
        summary: '',
        contact: { email: '', phone: '', location: '', linkedIn: '', website: '' }
      },
      workExperience: dbData.work_experience || [],
      education: dbData.education || [],
      skills: dbData.skills || [],
      projects: dbData.projects || [],
      languages: dbData.languages || [],
      certifications: dbData.certifications || [],
      interests: dbData.interests || [],
      internships: dbData.internships || [],
      references: dbData.references || [],
      referenceText: dbData.reference_text || "References available upon request",
      customSections: dbData.custom_sections || [],
      templateId: dbData.template_id || '',
      isPublic: dbData.is_public || false,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    };
  
    console.log("Mapped from DB to UI format:", { 
      fromKeys: Object.keys(dbData), 
      toKeys: Object.keys(mappedData)
    });
    
    return mappedData;
  }
  
  // Function to map UI format (camelCase) to database format (snake_case)
  export function mapResumeToDatabase(uiData: any) {
    if (!uiData) return null;
    
    // Create a new object with mapped properties
    const mappedData = {
      id: uiData.id,
      user_id: uiData.userId,
      title: uiData.title,
      personal_info: uiData.personalInfo,
      work_experience: uiData.workExperience,
      education: uiData.education,
      skills: uiData.skills,
      projects: uiData.projects || [],
      languages: uiData.languages || [],
      certifications: uiData.certifications || [],
      interests: uiData.interests || [],
      internships: uiData.internships || [],
      references: uiData.references || [],
      reference_text: uiData.referenceText || "References available upon request",
      custom_sections: uiData.customSections || [],
      template_id: uiData.templateId || '',
      is_public: uiData.isPublic || false,
      created_at: uiData.created_at || uiData.createdAt || new Date().toISOString(),
      updated_at: uiData.updated_at || uiData.updatedAt || new Date().toISOString()
    };
  
    console.log("Mapped from UI to DB format:", { 
      fromKeys: Object.keys(uiData), 
      toKeys: Object.keys(mappedData)
    });
    
    return mappedData;
  }
  
  // Function to ensure both formats exist in a single object (for compatibility)
  export function ensureDualFormatFields(data: any) {
    if (!data) return null;
    
    const dualFormatData = { ...data };
    
    // Add both camelCase and snake_case versions of all fields
    if (dualFormatData.personalInfo && !dualFormatData.personal_info) {
      dualFormatData.personal_info = dualFormatData.personalInfo;
    } else if (dualFormatData.personal_info && !dualFormatData.personalInfo) {
      dualFormatData.personalInfo = dualFormatData.personal_info;
    }
    
    if (dualFormatData.workExperience && !dualFormatData.work_experience) {
      dualFormatData.work_experience = dualFormatData.workExperience;
    } else if (dualFormatData.work_experience && !dualFormatData.workExperience) {
      dualFormatData.workExperience = dualFormatData.work_experience;
    }
    
    // Map other fields that need conversion
    const fieldMappings = [
      { camel: 'userId', snake: 'user_id' },
      { camel: 'referenceText', snake: 'reference_text' },
      { camel: 'customSections', snake: 'custom_sections' },
      { camel: 'templateId', snake: 'template_id' },
      { camel: 'isPublic', snake: 'is_public' },
      { camel: 'createdAt', snake: 'created_at' },
      { camel: 'updatedAt', snake: 'updated_at' },
    ];
    
    fieldMappings.forEach(mapping => {
      if (dualFormatData[mapping.camel] && !dualFormatData[mapping.snake]) {
        dualFormatData[mapping.snake] = dualFormatData[mapping.camel];
      } else if (dualFormatData[mapping.snake] && !dualFormatData[mapping.camel]) {
        dualFormatData[mapping.camel] = dualFormatData[mapping.snake];
      }
    });
    
    return dualFormatData;
  }