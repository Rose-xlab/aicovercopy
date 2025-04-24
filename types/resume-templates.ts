//types/resume-templates.ts


/**
 * Resume template interface
 */
export interface ResumeTemplate {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    htmlContent: string;
    cssContent: string;
    thumbnail?: string | null;
    isPublic?: boolean | null;
    userId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }
  
  /**
   * Database representation of resume template
   */
  export interface DatabaseResumeTemplate {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    html_content: string;
    css_content: string;
    thumbnail: string | null;
    is_public: boolean | null;
    user_id: string | null;
    created_at: string | null;
    updated_at: string | null;
  }
  
  /**
   * Convert database template to application template
   */
  export function mapDatabaseToResumeTemplate(dbTemplate: DatabaseResumeTemplate): ResumeTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      category: dbTemplate.category,
      htmlContent: dbTemplate.html_content,
      cssContent: dbTemplate.css_content,
      thumbnail: dbTemplate.thumbnail,
      isPublic: dbTemplate.is_public,
      userId: dbTemplate.user_id,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at
    };
  }
  
  /**
   * Convert application template to database template
   */
  export function mapResumeTemplateToDatabase(template: ResumeTemplate): DatabaseResumeTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description || null,
      category: template.category || null,
      html_content: template.htmlContent,
      css_content: template.cssContent,
      thumbnail: template.thumbnail || null,
      is_public: template.isPublic || false,
      user_id: template.userId || null,
      created_at: template.createdAt || new Date().toISOString(),
      updated_at: template.updatedAt || new Date().toISOString()
    };
  }
  
  /**
   * Resume export options
   */
  export type ResumeExportFormat = 'pdf' | 'docx' | 'txt';
  
  /**
   * Resume export request
   */
  export interface ResumeExportRequest {
    resumeId: string;
    templateId: string;
    format: ResumeExportFormat;
    filename?: string;
  }