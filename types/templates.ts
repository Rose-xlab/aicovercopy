// Template types for the cover letter templating system

/**
 * Template interface representing a cover letter template
 */
export interface Template {
    id: string;
    name: string;
    description: string;
    html_content: string;
    css_content: string;
    thumbnail_url?: string;
    tags?: string[];
    category?: string;
    is_public: boolean;
    user_id?: string | null; // null for system templates
    created_at: string;
    updated_at?: string;
  }
  
  /**
   * Template input for creating or updating a template
   */
  export interface TemplateInput {
    name: string;
    description: string;
    html_content: string;
    css_content: string;
    tags?: string[];
    category?: string;
    is_public?: boolean;
  }
  
  /**
   * Export format options for templated cover letters
   */
  export type ExportFormat = 'pdf' | 'docx' | 'html' | 'txt';
  
  /**
   * Export request payload
   */
  export interface ExportRequest {
    content: string;
    template_id: string;
    format: ExportFormat;
    filename?: string;
  }
  
  /**
   * Template preview request
   */
  export interface TemplatePreviewRequest {
    template_id: string;
    content: string;
  }