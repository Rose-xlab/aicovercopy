// types/export.ts
import { ExportFormat } from './templates';

/**
 * Options for export operations
 */
export interface ExportOptions {
  /**
   * Retry configuration for export operations
   */
  retry?: {
    /** Number of retry attempts */
    attempts: number;
    /** Delay between retries in ms */
    delay: number;
  };
  
  /**
   * Timeout in milliseconds for export operations
   */
  timeout?: number;
  
  /**
   * Quality level for exports (affects PDF resolution)
   */
  quality?: 'draft' | 'standard' | 'high';
  
  /**
   * Optional metadata to include in the export
   */
  metadata?: Record<string, string>;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  /**
   * Whether the export was successful
   */
  success: boolean;
  
  /**
   * The generated file as a Blob (if successful)
   */
  blob?: Blob;
  
  /**
   * Filename for the exported file
   */
  filename: string;
  
  /**
   * Format of the exported file
   */
  format: string;
  
  /**
   * Error message if the export failed
   */
  error?: string;
  
  /**
   * Additional error details
   */
  details?: unknown;
}

/**
 * Represents a completed export
 */
export interface CompletedExport {
  /**
   * Unique ID of the export
   */
  id: string;
  
  /**
   * Type of export
   */
  type: 'cover-letter' | 'resume';
  
  /**
   * Format of the exported file
   */
  format: ExportFormat | 'txt';
  
  /**
   * Timestamp of when the export was completed
   */
  timestamp: string;
  
  /**
   * Filename of the exported file
   */
  filename: string;
  
  /**
   * Download URL (if available)
   */
  downloadUrl?: string;
  
  /**
   * Reference to the original document
   */
  documentId: string;
  
  /**
   * Template used for the export
   */
  templateId: string;
  
  /**
   * User ID who performed the export
   */
  userId: string;
}

/**
 * Request to export a cover letter
 */
export interface CoverLetterExportRequest {
  /**
   * Content of the cover letter
   */
  content: string;
  
  /**
   * ID of the template to use
   */
  template_id: string;
  
  /**
   * Format to export as
   */
  format: ExportFormat | 'txt';
  
  /**
   * Optional filename (without extension)
   */
  filename?: string;
  
  /**
   * Additional export options
   */
  options?: {
    quality?: 'draft' | 'standard' | 'high';
    timeout?: number;
    metadata?: Record<string, string>;
  };
}

/**
 * Request to export a resume
 */
export interface ResumeExportRequest {
  /**
   * ID of the resume to export
   */
  resumeId: string;
  
  /**
   * ID of the template to use
   */
  templateId: string;
  
  /**
   * Format to export as
   */
  format: 'pdf' | 'docx' | 'txt' | 'html';
  
  /**
   * Optional filename (without extension)
   */
  filename?: string;
  
  /**
   * Additional export options
   */
  options?: {
    quality?: 'draft' | 'standard' | 'high';
    timeout?: number;
    metadata?: Record<string, string>;
  };
}

/**
 * Error thrown during export operations
 */
export class ExportError extends Error {
  /**
   * Error code
   */
  code?: string;
  
  /**
   * Additional details about the error
   */
  details?: unknown;
  
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
    this.details = details;
  }
}