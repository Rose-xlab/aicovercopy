//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\export-service.ts
import { exportCoverLetter, exportResume, downloadBlob, ExportResult, ExportOptions } from './export-utils';
import { Template, ExportFormat } from '@/types/templates';
import { ResumeTemplate, ResumeData } from '@/types/resume';

/**
 * Centralized Export Service to handle all export operations
 * with proper logging, retries, and error handling
 */

type ExportType = 'cover-letter' | 'resume';
type ExportProgressCallback = (progress: number, status: string) => void;

interface ExportRequest {
  type: ExportType;
  format: string;
  data: any;
  template: any;
  filename?: string;
  options?: ExportOptions;
  onProgress?: ExportProgressCallback;
}

interface LoggedExport {
  id: string;
  timestamp: string;
  type: ExportType;
  format: string;
  success: boolean;
  error?: string;
  filename: string;
  metadata?: Record<string, any>;
}

// Keep a log of recent exports
const exportHistory: LoggedExport[] = [];

/**
 * Main export function that handles all export types
 */
export async function performExport(request: ExportRequest): Promise<ExportResult> {
  const { type, format, data, template, filename, options, onProgress } = request;
  
  // Generate a unique ID for this export operation
  const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log export start
  console.log(`Starting export ${exportId}: ${type} as ${format}`);
  
  // Update progress
  if (onProgress) {
    onProgress(0, 'Preparing export...');
  }
  
  try {
    // Update progress
    if (onProgress) {
      onProgress(20, 'Processing content...');
    }
    
    // Perform the export based on type
    let result: ExportResult;
    
    if (type === 'cover-letter' && isExportFormat(format)) {
      if (onProgress) {
        onProgress(40, `Generating ${format.toUpperCase()}...`);
      }
      
      // Export cover letter
      result = await exportCoverLetter(
        data as string,
        template as Template,
        format,
        filename,
        options
      );
    } else if (type === 'resume') {
      if (onProgress) {
        onProgress(40, `Generating resume ${format.toUpperCase()}...`);
      }
      
      // Export resume
      result = await exportResume(
        data as ResumeData,
        template as ResumeTemplate,
        format as 'pdf' | 'docx' | 'txt',
        filename,
        options
      );
    } else {
      throw new Error(`Unsupported export type: ${type} or format: ${format}`);
    }
    
    // Log result to history
    logExport({
      id: exportId,
      timestamp: new Date().toISOString(),
      type,
      format,
      success: result.success,
      error: result.error,
      filename: result.filename,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        contentLength: type === 'cover-letter' ? (data as string).length : 'resume-data'
      }
    });
    
    // Update progress
    if (onProgress) {
      onProgress(80, 'Export generated, preparing download...');
    }
    
    // Automatically trigger download if successful and blob exists
    if (result.success && result.blob) {
      downloadBlob(result.blob, result.filename);
      
      // Final progress update
      if (onProgress) {
        onProgress(100, 'Download complete!');
      }
    } else if (result.error) {
      // Failed but with error info
      if (onProgress) {
        onProgress(100, `Export failed: ${result.error}`);
      }
    }
    
    return result;
  } catch (error) {
    // Log the error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Export ${exportId} failed:`, error);
    
    // Log to history
    logExport({
      id: exportId,
      timestamp: new Date().toISOString(),
      type,
      format,
      success: false,
      error: errorMessage,
      filename: filename || `export.${format}`,
      metadata: {
        templateId: template.id,
        templateName: template.name
      }
    });
    
    // Update progress with error
    if (onProgress) {
      onProgress(100, `Export failed: ${errorMessage}`);
    }
    
    // Return a structured error result
    return {
      success: false,
      filename: filename || `export.${format}`,
      format,
      error: errorMessage,
      details: error
    };
  }
}

/**
 * Log export to history and optionally to analytics
 */
function logExport(exportData: LoggedExport): void {
  // Add to local history (limited to last 20)
  exportHistory.unshift(exportData);
  if (exportHistory.length > 20) {
    exportHistory.pop();
  }
  
  // Log to console
  console.log(`Export ${exportData.id} ${exportData.success ? 'succeeded' : 'failed'}: ${exportData.type} as ${exportData.format}`);
  
  // In a real application, you might want to log to analytics or server here
  try {
    // Example of logging to server (commented out)
    /*
    fetch('/api/log/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exportData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }),
    });
    */
  } catch (error) {
    console.error('Failed to log export:', error);
    // Non-critical error, continue
  }
}

/**
 * Get export history (last 20 exports)
 */
export function getExportHistory(): LoggedExport[] {
  return [...exportHistory];
}

/**
 * Clear export history
 */
export function clearExportHistory(): void {
  exportHistory.length = 0;
}

/**
 * Type guard for export formats
 */
function isExportFormat(format: string): format is ExportFormat {
  return ['pdf', 'docx', 'html', 'txt'].includes(format);
}

/**
 * Convenience function for cover letter exports
 */
export async function exportCoverLetterWithProgress(
  content: string,
  template: Template,
  format: ExportFormat,
  onProgress?: ExportProgressCallback,
  filename?: string,
  options?: ExportOptions
): Promise<ExportResult> {
  return performExport({
    type: 'cover-letter',
    format,
    data: content,
    template,
    filename,
    options,
    onProgress
  });
}

/**
 * Convenience function for resume exports
 */
export async function exportResumeWithProgress(
  resume: ResumeData,
  template: ResumeTemplate,
  format: 'pdf' | 'docx' | 'txt',
  onProgress?: ExportProgressCallback,
  filename?: string,
  options?: ExportOptions
): Promise<ExportResult> {
  return performExport({
    type: 'resume',
    format,
    data: resume,
    template,
    filename,
    options,
    onProgress
  });
}