import { Template, ExportFormat } from "@/types/templates";
import { renderTemplate, renderTemplateContent } from "@/lib/template-renderer";

/**
 * Export the cover letter with a template in the specified format
 * @param content The cover letter content
 * @param template The selected template
 * @param format The export format
 * @param filename Optional filename (without extension)
 * @returns A promise that resolves to the blob of the exported file
 */
export async function exportCoverLetter(
  content: string,
  template: Template,
  format: ExportFormat,
  filename?: string
): Promise<{blob: Blob, filename: string}> {
  // Generate a default filename if not provided
  const defaultFilename = `cover-letter-${new Date().toISOString().split('T')[0]}`;
  const baseFilename = filename || defaultFilename;
  
  switch (format) {
    case 'pdf':
      return exportAsPdf(content, template, `${baseFilename}.pdf`);
    case 'docx':
      return exportAsDocx(content, template, `${baseFilename}.docx`);
    case 'html':
      return exportAsHtml(content, template, `${baseFilename}.html`);
    case 'txt':
      return exportAsTxt(content, `${baseFilename}.txt`);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export as PDF (server-side implementation)
 */
async function exportAsPdf(
  content: string,
  template: Template,
  filename: string
): Promise<{blob: Blob, filename: string}> {
  // This uses the server API since PDF generation is better done server-side
  try {
    const response = await fetch('/api/export/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        template_id: template.id,
        format: 'pdf',
        filename,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export as PDF');
    }
    
    const blob = await response.blob();
    return { blob, filename };
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw error;
  }
}

/**
 * Export as DOCX (server-side implementation)
 */
async function exportAsDocx(
  content: string,
  template: Template,
  filename: string
): Promise<{blob: Blob, filename: string}> {
  // This uses the server API since DOCX generation is better done server-side
  try {
    const response = await fetch('/api/export/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        template_id: template.id,
        format: 'docx',
        filename,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export as DOCX');
    }
    
    const blob = await response.blob();
    return { blob, filename };
  } catch (error) {
    console.error('Error exporting as DOCX:', error);
    throw error;
  }
}

/**
 * Export as HTML (client-side implementation)
 */
function exportAsHtml(
  content: string,
  template: Template,
  filename: string
): Promise<{blob: Blob, filename: string}> {
  // Create the full HTML document
  const html = renderTemplate(template, content);
  
  // Create a blob from the HTML
  const blob = new Blob([html], { type: 'text/html' });
  
  return Promise.resolve({ blob, filename });
}

/**
 * Export as plain text (client-side implementation)
 */
function exportAsTxt(
  content: string,
  filename: string
): Promise<{blob: Blob, filename: string}> {
  // Create a blob from the text content
  const blob = new Blob([content], { type: 'text/plain' });
  
  return Promise.resolve({ blob, filename });
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
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}