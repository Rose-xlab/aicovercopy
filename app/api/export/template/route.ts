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

export const maxDuration = 60; // Set max duration to 60 seconds for this route

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Parse the request body
    const { content, template_id, format, filename } = await request.json();
    
    if (!content || !template_id || !format) {
      return NextResponse.json(
        { error: 'Content, template_id, and format are required' },
        { status: 400 }
      );
    }
    
    // Get the template
    let template;
    
    // Check if it's a default template
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === template_id);
    if (defaultTemplate) {
      template = defaultTemplate;
    } else {
      // Query the database for the template
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
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Template not found or you do not have access' },
          { status: 404 }
        );
      }
      
      template = data;
    }
    
    // Generate export filename if not provided
    const baseFilename = filename || `cover-letter-${new Date().toISOString().split('T')[0]}`;
    
    // Log the export (if user is authenticated)
    if (userId) {
      try {
        await supabase.from('exports').insert({
          user_id: userId,
          template_id: template_id,
          format,
          created_at: new Date().toISOString(),
        });
      } catch (error: unknown) {
        console.error('Error logging export:', error);
        // Non-critical error, continue with export
      }
    }
    
    // Process export based on format
    switch (format as ExportFormat) {
      case 'pdf':
        return await generatePDFResponse(content, template, baseFilename);
      case 'docx':
        return await generateDOCXResponse(content, template, baseFilename);
      case 'html':
        return generateHTMLResponse(content, template, baseFilename);
      case 'txt':
        return generateTXTResponse(content, baseFilename);
      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error exporting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export template' },
      { status: 500 }
    );
  }
}

/**
 * Generate a PDF from the template using the PDF generator utility
 */
async function generatePDFResponse(content: string, template: any, filename: string) {
  try {
    // Generate the HTML with the template
    const html = renderTemplate(template, content);
    
    // Generate PDF using the utility
    const pdfBuffer = await generatePDF(html, {
      format: 'A4',
      margins: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generate a DOCX from the template
 */
async function generateDOCXResponse(content: string, template: any, filename: string) {
  try {
    // Parse the letter content first
    const parsedContent = parseLetterContent(content);
    
    // Generate the HTML with the template for reference
    const htmlContent = renderTemplateContent(template, content);
    
    // Parse HTML to extract styling (we'll use cheerio for simple HTML parsing)
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
    
    // Return the DOCX
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Failed to generate DOCX');
  }
}

/**
 * Generate HTML from the template
 */
function generateHTMLResponse(content: string, template: any, filename: string) {
  // Generate the HTML with the template
  const html = renderTemplate(template, content);
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${filename}.html"`,
    },
  });
}

/**
 * Generate plain text
 */
function generateTXTResponse(content: string, filename: string) {
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${filename}.txt"`,
    },
  });
}