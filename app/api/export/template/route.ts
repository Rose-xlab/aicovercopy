import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ExportFormat } from '@/types/templates';
import { DEFAULT_TEMPLATES } from '@/lib/default-templates';
import { renderTemplate, renderTemplateContent, parseLetterContent } from '@/lib/template-renderer';
import { generatePDF } from '@/lib/pdf-generator';
import * as docx from 'docx';
import * as cheerio from 'cheerio';
import type { CoverLetter } from '@/types/cover-letter'; // Ensure this type is imported

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, SectionType } = docx;

export const maxDuration = 120;

interface ExportError extends Error {
  code?: string;
  details?: unknown;
}

export async function POST(request: Request) {
  try {
    console.log("Template export route handler started");

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // --- MODIFICATION START ---
    // The API now expects a 'letterData' object instead of just 'content'.
    const { letterData, template_id, format, filename, options } = requestBody;

    if (!letterData || !template_id || !format) {
      console.error("Missing required fields:", { letterData: !!letterData, template_id, format });
      return NextResponse.json(
        { error: 'letterData, template_id, and format are required' },
        { status: 400 }
      );
    }
    // --- MODIFICATION END ---

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    console.log("User session:", userId ? "Authenticated" : "Not authenticated");

    let template;
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === template_id);
    if (defaultTemplate) {
      console.log("Using default template:", defaultTemplate.name);
      template = defaultTemplate;
    } else {
      console.log("Looking up template in database:", template_id);
      try {
        let query = supabase.from('templates').select('*').eq('id', template_id);
        if (!userId) {
          query = query.eq('is_public', true);
        } else {
          query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
        }
        const { data, error } = await query.single();
        if (error) {
          console.error("Template lookup error:", error);
          throw new Error(`Template not found: ${error.message}`);
        }
        if (!data) {
          console.error("Template not found with ID:", template_id);
          throw new Error('Template not found');
        }
        template = data;
        console.log("Found template:", template.name);
      } catch (error) {
        console.log("Error finding specific template, looking for fallback...");
        const { data: fallbackTemplates, error: fallbackError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_public', true)
          .limit(1);
        if (fallbackError || !fallbackTemplates || fallbackTemplates.length === 0) {
          console.log("No fallback templates in database, using built-in default");
          template = DEFAULT_TEMPLATES[0];
        } else {
          console.log("Using fallback template from database:", fallbackTemplates[0].name);
          template = fallbackTemplates[0];
        }
      }
    }

    const baseFilename = filename || `cover-letter-${new Date().toISOString().split('T')[0]}`;
    if (userId) {
      try {
        await supabase.from('exports').insert({
          user_id: userId,
          format,
          created_at: new Date().toISOString(),
        });
        console.log("Export logged to database");
      } catch (error) {
        console.error('Error logging export:', error);
      }
    }

    try {
      console.log(`Starting ${format} generation...`);
      const quality = options?.quality || 'standard';
      const exportTimeout = options?.timeout || 30000;
      console.log(`Export quality: ${quality}, timeout: ${exportTimeout}ms`);

      switch (format as ExportFormat) {
        case 'pdf':
          const pdfTimeout = options?.timeout || 60000;
          // --- MODIFICATION START ---
          // Pass the entire 'letterData' object to the PDF generator.
          return await generatePDFResponse(letterData, template, baseFilename, {
            quality,
            timeout: pdfTimeout,
            metadata: options?.metadata
          });
          // --- MODIFICATION END ---
        case 'docx':
          // Pass letterData.content for DOCX and TXT for backward compatibility
          return await generateDOCXResponse(letterData.content, template, baseFilename);
        case 'html':
          return generateHTMLResponse(letterData.content, template, baseFilename);
        case 'txt':
          return generateTXTResponse(letterData.content, baseFilename);
        default:
          console.error("Unsupported format:", format);
          return NextResponse.json(
            { error: `Unsupported format: ${format}` },
            { status: 400 }
          );
      }
    } catch (error) {
      const exportError = error as ExportError;
      console.error(`Error generating ${format}:`, exportError);
      let errorMessage = `Failed to generate ${format}: ${exportError.message}`;
      let statusCode = 500;
      if (format === 'pdf' && exportError.message?.includes('timeout')) {
        errorMessage = "PDF generation timed out. Please try again or use a different format.";
      } else if (format === 'docx' && exportError.message?.includes('memory')) {
        errorMessage = "DOCX generation failed due to memory limits. Try simplifying your content.";
      } else if (exportError.code === 'NETWORK_ERROR') {
        errorMessage = "Network error during generation. Please check your connection and try again.";
      } else if (exportError.message?.includes('Failed to generate PDF after')) {
         errorMessage = exportError.message;
      }
      return NextResponse.json(
        { error: errorMessage, details: exportError.details },
        { status: statusCode }
      );
    }
  } catch (error) {
    const serverError = error as ExportError;
    console.error('Unhandled error in export template route:', serverError);
    return NextResponse.json(
      { error: `Server error: ${serverError.message || 'Unknown error'}`, code: serverError.code },
      { status: 500 }
    );
  }
}

// --- MODIFICATION START ---
// Update the function signature to accept the 'letterData' object.
async function generatePDFResponse(
  letterData: CoverLetter,
  template: any,
  filename: string,
  options?: {
    quality?: 'draft' | 'standard' | 'high';
    timeout?: number;
    metadata?: Record<string, string>;
  }
) {
  try {
    console.log("Generating PDF from template with structured data");
    // The call to renderTemplate now passes the full object, not just the content string.
    const html = renderTemplate(template, letterData);
// --- MODIFICATION END ---

    const qualityMap = { draft: 1, standard: 1.5, high: 2 };
    const quality = options?.quality || 'standard';
    const scale = qualityMap[quality] || 1.5;

    const pdfBuffer = await generatePDF(html, {
      format: 'A4',
      margins: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      scale: scale,
      timeout: options?.timeout || 60000,
      retries: 2
    });
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${(error as Error).message}`);
  }
}

async function generateDOCXResponse(content: string, template: any, filename: string) {
  try {
    console.log("Generating DOCX from template");
    const parsedContent = parseLetterContent(content);
    const htmlContent = renderTemplateContent(template, content);
    const $ = cheerio.load(`<div>${htmlContent}</div>`);
    const rawFontSizeString = ($('body').css('font-size') || '12pt');
    let fontSizeInPt = 12;
    if (rawFontSizeString.endsWith('pt')) {
        const parsed = parseInt(rawFontSizeString.replace('pt', ''), 10);
        if (!isNaN(parsed)) {
            fontSizeInPt = parsed;
        }
    } else {
        console.warn(`Unexpected font-size format found: ${rawFontSizeString}, defaulting to 12pt.`);
    }
    const baseFontSize = fontSizeInPt * 2;
    const doc = new Document({
      sections: [{
        properties: {
          type: SectionType.CONTINUOUS,
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: [
          ...parsedContent.header.map(line => new Paragraph({ children: [new TextRun({ text: line, size: baseFontSize })], alignment: AlignmentType.RIGHT, spacing: { after: 120 } })),
          new Paragraph({ text: '', spacing: { after: 240 } }),
          new Paragraph({ children: [new TextRun({ text: parsedContent.greeting, size: baseFontSize })], spacing: { after: 240 } }),
          ...parsedContent.introduction.map(para => new Paragraph({ children: [new TextRun({ text: para, size: baseFontSize })], spacing: { after: 240 } })),
          ...parsedContent.body.map(para => new Paragraph({ children: [new TextRun({ text: para, size: baseFontSize })], spacing: { after: 240 } })),
          ...parsedContent.conclusion.map(para => new Paragraph({ children: [new TextRun({ text: para, size: baseFontSize })], spacing: { after: 240 } })),
          new Paragraph({ text: '', spacing: { after: 240 } }),
          ...parsedContent.signature.map((line, i) => new Paragraph({ children: [new TextRun({ text: line, size: baseFontSize })], spacing: { after: i < parsedContent.signature.length - 1 ? 120 : 0 } })),
        ],
      }],
    });
    const buffer = await Packer.toBuffer(doc);
    console.log(`DOCX generated successfully, size: ${buffer.length} bytes`);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error(`Failed to generate DOCX: ${(error as Error).message}`);
  }
}

function generateHTMLResponse(content: string, template: any, filename: string) {
  try {
    console.log("Generating HTML from template");
    // NOTE: This uses the old parsing method. For full HTML exports,
    // you may want to update this similarly to the PDF method.
    const html = renderTemplateContent(template, content);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating HTML:', error);
    throw new Error(`Failed to generate HTML: ${(error as Error).message}`);
  }
}

function generateTXTResponse(content: string, filename: string) {
  try {
    console.log("Generating TXT content");
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error generating TXT:', error);
    throw new Error(`Failed to generate TXT: ${(error as Error).message}`);
  }
}