import { Template, ExportFormat } from "@/types/templates";
import { ResumeTemplate, ResumeData } from "@/types/resume";
import type { CoverLetter } from "@/types/cover-letter"; // <-- FIX: Import CoverLetter type
import { renderTemplate, renderTemplateContent } from "@/lib/template-renderer";
import { renderResumeTemplate } from "@/lib/resume-template-renderer";

/**
 * Enhanced Export Utilities for handling different export formats
 * with better error handling and retry mechanisms
 */

/**
 * Configuration options for file exports
 */
export interface ExportOptions {
  retry?: {
    attempts: number;
    delay: number;
  };
  timeout?: number;
  quality?: 'draft' | 'standard' | 'high';
  metadata?: Record<string, string>;
}

/**
 * Result of export operation
 */
export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename: string;
  format: string;
  error?: string;
  details?: unknown;
}

/**
 * Export the cover letter with a template in the specified format
 * Enhanced with better error handling and retry logic
 */
export async function exportCoverLetter(
  content: string,
  template: Template,
  format: ExportFormat,
  filename?: string,
  options?: ExportOptions
): Promise<ExportResult> {
  // Generate a default filename if not provided
  const defaultFilename = `cover-letter-${new Date().toISOString().split('T')[0]}`;
  const baseFilename = filename || defaultFilename;
  
  const maxAttempts = options?.retry?.attempts || 1;
  const retryDelay = options?.retry?.delay || 1000;
  
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Export attempt ${attempts + 1}/${maxAttempts} for ${format} format`);
      
      switch (format) {
        case 'pdf':
          return await exportAsPdf(content, template, `${baseFilename}.pdf`, options);
        case 'docx':
          return await exportAsDocx(content, template, `${baseFilename}.docx`, options);
        case 'html':
          return exportAsHtml(content, template, `${baseFilename}.html`);
        case 'txt':
          return exportAsTxt(content, `${baseFilename}.txt`);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`Export error (attempt ${attempts + 1}/${maxAttempts}):`, error);
      
      attempts++;
      
      if (attempts >= maxAttempts) {
        return {
          success: false,
          filename: `${baseFilename}.${format}`,
          format,
          error: lastError?.message || 'Export failed',
          details: lastError
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Should never reach here due to the return in the catch block
  return {
    success: false,
    filename: `${baseFilename}.${format}`,
    format,
    error: 'Export failed: Unexpected execution path'
  };
}

/**
 * Export a resume with a template in the specified format
 */
export async function exportResume(
  resume: ResumeData,
  template: ResumeTemplate,
  format: 'pdf' | 'docx' | 'txt',
  filename?: string,
  options?: ExportOptions
): Promise<ExportResult> {
  // Generate a default filename if not provided
  const defaultFilename = `${resume.personalInfo?.firstName || 'Resume'}-${resume.personalInfo?.lastName || ''}-Resume`;
  const baseFilename = filename || defaultFilename;
  
  const maxAttempts = options?.retry?.attempts || 1;
  const retryDelay = options?.retry?.delay || 1000;
  
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Resume export attempt ${attempts + 1}/${maxAttempts} for ${format} format`);
      
      switch (format) {
        case 'pdf':
          return await exportResumeAsPdf(resume, template, `${baseFilename}.pdf`, options);
        case 'docx':
          return await exportResumeAsDocx(resume, template, `${baseFilename}.docx`, options);
        case 'txt':
          return exportResumeAsTxt(resume, `${baseFilename}.txt`);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`Resume export error (attempt ${attempts + 1}/${maxAttempts}):`, error);
      
      attempts++;
      
      if (attempts >= maxAttempts) {
        return {
          success: false,
          filename: `${baseFilename}.${format}`,
          format,
          error: lastError?.message || 'Export failed',
          details: lastError
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Should never reach here due to the return in the catch block
  return {
    success: false,
    filename: `${baseFilename}.${format}`,
    format,
    error: 'Export failed: Unexpected execution path'
  };
}

/**
 * Export cover letter as PDF (server-side implementation)
 */
async function exportAsPdf(
  content: string,
  template: Template,
  filename: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    console.log('Exporting cover letter as PDF');
    // This uses the server API since PDF generation is better done server-side
    const response = await fetch('/api/export/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        template_id: template.id,
        format: 'pdf',
        filename: filename.replace(/\.pdf$/, ''),
        options: {
          quality: options?.quality || 'standard',
          timeout: options?.timeout || 30000,
          metadata: options?.metadata
        }
      }),
    });
    
    if (!response.ok) {
      // Try to get error message if possible
      let errorMessage = `Failed to export as PDF: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Unable to parse error as JSON, use status text
      }
      
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      blob,
      filename,
      format: 'pdf'
    };
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw error;
  }
}

/**
 * Export cover letter as DOCX (server-side implementation)
 */
async function exportAsDocx(
  content: string,
  template: Template,
  filename: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    console.log('Exporting cover letter as DOCX');
    // This uses the server API since DOCX generation is better done server-side
    const response = await fetch('/api/export/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        template_id: template.id,
        format: 'docx',
        filename: filename.replace(/\.docx$/, ''),
        options: {
          quality: options?.quality || 'standard',
          timeout: options?.timeout || 30000,
          metadata: options?.metadata
        }
      }),
    });
    
    if (!response.ok) {
      // Try to get error message if possible
      let errorMessage = `Failed to export as DOCX: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Unable to parse error as JSON, use status text
      }
      
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      blob,
      filename,
      format: 'docx'
    };
  } catch (error) {
    console.error('Error exporting as DOCX:', error);
    throw error;
  }
}

/**
 * Export cover letter as HTML (client-side implementation)
 */
function exportAsHtml(
  content: string,
  template: Template,
  filename: string
): ExportResult {
  try {
    console.log('Exporting cover letter as HTML');
    // Create a mock CoverLetter object to satisfy the type requirements
    const mockCoverLetter: CoverLetter = {
        content: content,
        userId: '',
        jobDescription: '',
        tone: 'professional',
        jobTitle: null,
        companyName: null,
        created_at: new Date(),
        data_source: 'none',
    };
    
    // Create the full HTML document using the mock object
    const html = renderTemplate(template, mockCoverLetter);
    
    // Create a blob from the HTML
    const blob = new Blob([html], { type: 'text/html' });
    
    return {
      success: true,
      blob,
      filename,
      format: 'html'
    };
  } catch (error) {
    console.error('Error exporting as HTML:', error);
    return {
      success: false,
      filename,
      format: 'html',
      error: `Failed to export as HTML: ${(error as Error).message}`
    };
  }
}

/**
 * Export cover letter as plain text (client-side implementation)
 */
function exportAsTxt(
  content: string,
  filename: string
): ExportResult {
  try {
    console.log('Exporting cover letter as TXT');
    // Create a blob from the text content
    const blob = new Blob([content], { type: 'text/plain' });
    
    return {
      success: true,
      blob,
      filename,
      format: 'txt'
    };
  } catch (error) {
    console.error('Error exporting as TXT:', error);
    return {
      success: false,
      filename,
      format: 'txt',
      error: `Failed to export as TXT: ${(error as Error).message}`
    };
  }
}

/**
 * Export resume as PDF
 */
async function exportResumeAsPdf(
  resume: ResumeData,
  template: ResumeTemplate,
  filename: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    console.log('Exporting resume as PDF');
    const response = await fetch('/api/resumes/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resume.id,
        templateId: template.id,
        format: 'pdf',
        filename: filename.replace(/\.pdf$/, ''),
        options: {
          quality: options?.quality || 'standard',
          timeout: options?.timeout || 30000,
          metadata: options?.metadata
        }
      }),
    });
    
    if (!response.ok) {
      // Try to get error message if possible
      let errorMessage = `Failed to export resume as PDF: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Unable to parse error as JSON, use status text
      }
      
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      blob,
      filename,
      format: 'pdf'
    };
  } catch (error) {
    console.error('Error exporting resume as PDF:', error);
    throw error;
  }
}

/**
 * Export resume as DOCX
 */
async function exportResumeAsDocx(
  resume: ResumeData,
  template: ResumeTemplate,
  filename: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    console.log('Exporting resume as DOCX');
    const response = await fetch('/api/resumes/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: resume.id,
        templateId: template.id,
        format: 'docx',
        filename: filename.replace(/\.docx$/, ''),
        options: {
          quality: options?.quality || 'standard',
          timeout: options?.timeout || 30000,
          metadata: options?.metadata
        }
      }),
    });
    
    if (!response.ok) {
      // Try to get error message if possible
      let errorMessage = `Failed to export resume as DOCX: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Unable to parse error as JSON, use status text
      }
      
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      blob,
      filename,
      format: 'docx'
    };
  } catch (error) {
    console.error('Error exporting resume as DOCX:', error);
    throw error;
  }
}

/**
 * Export resume as plain text
 */
function exportResumeAsTxt(
  resume: ResumeData,
  filename: string
): ExportResult {
  try {
    console.log('Exporting resume as TXT');
    // Simple text representation of resume
    let textContent = `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}\n`;
    textContent += `${resume.personalInfo.title}\n\n`;
    
    if (resume.personalInfo.contact) {
      textContent += `Contact Information:\n`;
      if (resume.personalInfo.contact.email) textContent += `Email: ${resume.personalInfo.contact.email}\n`;
      if (resume.personalInfo.contact.phone) textContent += `Phone: ${resume.personalInfo.contact.phone}\n`;
      if (resume.personalInfo.contact.location) textContent += `Location: ${resume.personalInfo.contact.location}\n`;
      if (resume.personalInfo.contact.linkedIn) textContent += `LinkedIn: ${resume.personalInfo.contact.linkedIn}\n`;
      if (resume.personalInfo.contact.website) textContent += `Website: ${resume.personalInfo.contact.website}\n`;
      textContent += `\n`;
    }
    
    if (resume.personalInfo.summary) {
      textContent += `SUMMARY\n${resume.personalInfo.summary}\n\n`;
    }
    
    if (resume.workExperience && resume.workExperience.length > 0) {
      textContent += `WORK EXPERIENCE\n`;
      for (const work of resume.workExperience) {
        textContent += `${work.position} at ${work.company}\n`;
        textContent += `${work.startDate} - ${work.isOngoing ? 'Present' : work.endDate}\n`;
        if (work.location) textContent += `Location: ${work.location}\n`;
        if (work.description) textContent += `${work.description}\n`;
        
        if (work.achievements && work.achievements.length > 0) {
          textContent += `Achievements:\n`;
          for (const achievement of work.achievements) {
            textContent += `- ${achievement}\n`;
          }
        }
        textContent += `\n`;
      }
    }
    
    if (resume.education && resume.education.length > 0) {
      textContent += `EDUCATION\n`;
      for (const edu of resume.education) {
        textContent += `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}\n`;
        textContent += `${edu.institution}\n`;
        textContent += `${edu.startDate} - ${edu.isOngoing ? 'Present' : edu.endDate}\n`;
        if (edu.description) textContent += `${edu.description}\n`;
        textContent += `\n`;
      }
    }
    
    if (resume.skills && resume.skills.length > 0) {
      textContent += `SKILLS\n`;
      for (const skill of resume.skills) {
        textContent += `- ${skill.name}${skill.level ? ` (${skill.level})` : ''}\n`;
      }
      textContent += `\n`;
    }
    
    // Create a blob from the text content
    const blob = new Blob([textContent], { type: 'text/plain' });
    
    return {
      success: true,
      blob,
      filename,
      format: 'txt'
    };
  } catch (error) {
    console.error('Error exporting resume as TXT:', error);
    return {
      success: false,
      filename,
      format: 'txt',
      error: `Failed to export as TXT: ${(error as Error).message}`
    };
  }
}

/**
 * Trigger a download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}