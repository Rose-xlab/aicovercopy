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
      // Create a temporary container with proper styling for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.minHeight = '297mm'; // A4 height
      tempContainer.style.padding = '10mm';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.lineHeight = '1.4';
      tempContainer.style.color = '#000';
      
      // Add CSS to handle page breaks and content flow
      tempContainer.innerHTML = `
        <style>
          * {
            box-sizing: border-box;
          }
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: auto;
          }
          .page-break {
            page-break-before: always;
          }
          .avoid-break {
            page-break-inside: avoid;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          p, div {
            margin: 0 0 10px 0;
            padding: 0;
          }
        </style>
        <div style="width: 100%; height: auto; overflow: visible;">
          ${content}
        </div>
      `;
      
      document.body.appendChild(tempContainer);

      try {
        await html2pdf().set({
          margin: [10, 10, 10, 10], // top, right, bottom, left in mm
          filename: `${fileName}.pdf`,
          image: { 
            type: 'jpeg', 
            quality: 0.98 
          },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            width: tempContainer.offsetWidth,
            height: tempContainer.scrollHeight,
            windowWidth: tempContainer.offsetWidth,
            windowHeight: tempContainer.scrollHeight
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break',
            after: '.page-break-after',
            avoid: '.avoid-break'
          }
        }).from(tempContainer).save();
      } finally {
        // Clean up the temporary container
        document.body.removeChild(tempContainer);
      }

    } else if (format === 'txt') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      const textContent = tempElement.textContent || tempElement.innerText || '';

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${fileName}.txt`);

    } else if (format === 'docx') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      
      // Better DOCX conversion - preserve formatting
      const htmlContent = tempElement.innerHTML;
      
      // Convert HTML to paragraphs for DOCX
      const paragraphs = htmlContent
        .split(/<\/?(p|div|br)\s*\/?>/i)
        .filter(text => text.trim())
        .map(text => {
          // Remove HTML tags and decode entities
          const cleanText = text.replace(/<[^>]*>/g, '').trim();
          return new Paragraph({
            children: [new TextRun(cleanText)],
            spacing: { after: 200 } // Add spacing between paragraphs
          });
        })
        .filter(p => p.root[0]?.children?.[0]?.text); // Remove empty paragraphs

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,    // 0.5 inch
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: paragraphs.length > 0 ? paragraphs : [
              new Paragraph({
                children: [new TextRun(tempElement.textContent || tempElement.innerText || '')],
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