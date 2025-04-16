// app/api/export/template/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ExportFormat } from '@/types/templates';
import { DEFAULT_TEMPLATES } from '@/lib/default-templates';
import { renderTemplate, renderTemplateContent, parseLetterContent } from '@/lib/template-renderer';
import { generatePDF } from '@/lib/pdf-generator';
import * as docx from 'docx';
import * as cheerio from 'cheerio';

// Import docx components
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, SectionType } = docx;

export const maxDuration = 120; // Increased to 120 seconds for more reliable exports

// Custom error type for better error handling
interface ExportError extends Error {
  code?: string;
  details?: unknown;
}

export async function POST(request: Request) {
  try {
    console.log("Template export route handler started");
    
    // Parse the request body with error handling
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("Request received for template export", {
        template_id: requestBody.template_id,
        format: requestBody.format,
        contentLength: requestBody.content?.length || 0
      });
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { content, template_id, format, filename, options } = requestBody;
    
    if (!content || !template_id || !format) {
      console.error("Missing required fields:", { content: !!content, template_id, format });
      return NextResponse.json(
        { error: 'Content, template_id, and format are required' },
        { status: 400 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    console.log("User session:", userId ? "Authenticated" : "Not authenticated");
    
    // Get the template
    let template;
    
    // Check if it's a default template
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === template_id);
    if (defaultTemplate) {
      console.log("Using default template:", defaultTemplate.name);
      template = defaultTemplate;
    } else {
      // Query the database for the template
      console.log("Looking up template in database:", template_id);
      
      try {
        let query = supabase
          .from('templates')
          .select('*')
          .eq('id', template_id);
        
        // If user is not authenticated, only fetch public templates
        if (!userId) {
          query = query.eq('is_public', true);
        } else {
          // If authenticated, fetch public templates or user's own templates
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
        // Try to find any public template to use as fallback
        console.log("Error finding specific template, looking for fallback...");
        const { data: fallbackTemplates, error: fallbackError } = await supabase
          .from('templates')
          .select('*')
          .eq('is_public', true)
          .limit(1);
          
        if (fallbackError || !fallbackTemplates || fallbackTemplates.length === 0) {
          // If no fallback found in DB, use first default template
          console.log("No fallback templates in database, using built-in default");
          template = DEFAULT_TEMPLATES[0];
        } else {
          console.log("Using fallback template from database:", fallbackTemplates[0].name);
          template = fallbackTemplates[0];
        }
      }
    }
    
    // Generate export filename if not provided
    const baseFilename = filename || `cover-letter-${new Date().toISOString().split('T')[0]}`;
    console.log("Using filename:", baseFilename);
    
    // Log the export (if user is authenticated)
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
        // Non-critical error, continue with export
      }
    }
    
    // Process export based on format
    try {
      console.log(`Starting ${format} generation...`);
      
      // Get quality setting from options
      const quality = options?.quality || 'standard';
      const exportTimeout = options?.timeout || 30000;
      console.log(`Export quality: ${quality}, timeout: ${exportTimeout}ms`);
      
      switch (format as ExportFormat) {
        case 'pdf':
          return await generatePDFResponse(content, template, baseFilename, {
            quality,
            timeout: exportTimeout,
            metadata: options?.metadata
          });
        case 'docx':
          return await generateDOCXResponse(content, template, baseFilename);
        case 'html':
          return generateHTMLResponse(content, template, baseFilename);
        case 'txt':
          return generateTXTResponse(content, baseFilename);
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
      return NextResponse.json(
        { error: `Failed to generate ${format}: ${exportError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const serverError = error as ExportError;
    console.error('Unhandled error in export template route:', serverError);
    return NextResponse.json(
      { error: `Server error: ${serverError.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * Generate a PDF from the template using the PDF generator utility
 */
async function generatePDFResponse(
  content: string, 
  template: any, 
  filename: string,
  options?: {
    quality?: 'draft' | 'standard' | 'high';
    timeout?: number;
    metadata?: Record<string, string>;
  }
) {
  try {
    console.log("Generating PDF from template");
    // Generate the HTML with the template
    const html = renderTemplate(template, content);
    
    // Quality settings
    const qualitySettings = {
      draft: { scale: 1, deviceScaleFactor: 1 },
      standard: { scale: 1, deviceScaleFactor: 2 },
      high: { scale: 1, deviceScaleFactor: 3 }
    };
    
    const quality = options?.quality || 'standard';
    const settings = qualitySettings[quality];
    
    // Generate PDF using the utility with retries and better error handling
    const pdfBuffer = await generatePDF(html, {
      format: 'A4',
      margins: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      scale: settings.scale,
      timeout: options?.timeout || 30000,
      retries: 2
    });
    
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    
    // Return the PDF
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

/**
 * Generate a DOCX from the template
 */
async function generateDOCXResponse(content: string, template: any, filename: string) {
  try {
    console.log("Generating DOCX from template");
    // Parse the letter content first
    const parsedContent = parseLetterContent(content);
    
    // Generate the HTML with the template for reference (to extract styling)
    const htmlContent = renderTemplateContent(template, content);
    
    // Parse HTML to extract styling
    const $ = cheerio.load(`<div>${htmlContent}</div>`);
    
    // Create a new document
    const doc = new Document({
      sections: [{
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: 1440, // 1 inch (in twips)
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header (contact information)
          ...parsedContent.header.map(line => new Paragraph({
            text: line,
            alignment: AlignmentType.RIGHT,
            spacing: {
              after: 120, // spacing after paragraph
            },
          })),
          
          // Empty line after header
          new Paragraph({
            text: '',
            spacing: {
              after: 240, // double spacing
            },
          }),
          
          // Greeting
          new Paragraph({
            text: parsedContent.greeting,
            spacing: {
              after: 240, // spacing after greeting
            },
          }),
          
          // Introduction paragraphs
          ...parsedContent.introduction.map(para => new Paragraph({
            text: para,
            spacing: {
              after: 240, // spacing after paragraph
            },
          })),
          
          // Body paragraphs
          ...parsedContent.body.map(para => new Paragraph({
            text: para,
            spacing: {
              after: 240, // spacing after paragraph
            },
          })),
          
          // Conclusion paragraphs
          ...parsedContent.conclusion.map(para => new Paragraph({
            text: para,
            spacing: {
              after: 240, // spacing after paragraph
            },
          })),
          
          // Empty line before signature
          new Paragraph({
            text: '',
            spacing: {
              after: 240, // double spacing
            },
          }),
          
          // Signature
          ...parsedContent.signature.map((line, i) => new Paragraph({
            text: line,
            spacing: {
              after: i < parsedContent.signature.length - 1 ? 120 : 0, // spacing between signature lines
            },
          })),
        ],
      }],
    });
    
    // Generate the DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    console.log(`DOCX generated successfully, size: ${buffer.length} bytes`);
    
    // Return the DOCX
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

/**
 * Generate HTML from the template
 */
function generateHTMLResponse(content: string, template: any, filename: string) {
  try {
    console.log("Generating HTML from template");
    // Generate the HTML with the template
    const html = renderTemplate(template, content);
    
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

/**
 * Generate plain text
 */
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