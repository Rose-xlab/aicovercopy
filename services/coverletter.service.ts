import { getCoverLetterPreviewData } from './coverletterpreview.service';
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import type { CoverLetter } from '@/types/cover-letter';

interface ExportOptions {
  setIsExporting?: (isExporting: boolean) => void;
  onError?: (error: Error) => void;
  templateId?: string;
  zoom?: number;
}

export async function handleCoverLetterExport(
  coverLetter: CoverLetter,
  format: 'pdf' | 'txt' | 'docx',
  options: ExportOptions = {}
) {
  const { setIsExporting, onError, templateId, zoom = 100 } = options;
  const isClient = typeof window !== 'undefined';

  if (!isClient) {
    throw new Error('Export is only available in the browser');
  }

  try {
    setIsExporting?.(true);

    const result = await getCoverLetterPreviewData(coverLetter, templateId, zoom);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.html;
    const content = tempDiv.querySelector('body')?.innerHTML || result.html;

    const sender = typeof coverLetter.sender === 'string' 
      ? JSON.parse(coverLetter.sender) 
      : coverLetter.sender || {};
    const firstName = sender.first_name || 'cover-letter';
    const lastName = sender.last_name || '';
    const fileName = `${firstName}${lastName ? `-${lastName}` : ''}-Cover-Letter`;

    if (format === 'pdf') {
      await html2pdf().set({
        margin: 10,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(content).save();

    } else if (format === 'txt') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      const textContent = tempElement.textContent || tempElement.innerText || '';

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${fileName}.txt`);

    } else if (format === 'docx') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      const textContent = tempElement.textContent || tempElement.innerText || '';

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [new TextRun(textContent)],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName}.docx`);
      
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return true;

  } catch (err) {
    console.error("Error exporting cover letter:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to export cover letter. Please try again.";

    onError?.(err instanceof Error ? err : new Error(errorMessage));
    return false;

  } finally {
    setIsExporting?.(false);
  }
}