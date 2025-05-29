import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import puppeteer from 'puppeteer';
import * as docx from 'docx';
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

type ExportFormat = 'pdf' | 'docx' | 'txt';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Authenticate user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { coverLetterId, format = 'pdf' } = await request.json() as {
      coverLetterId: string;
      format?: ExportFormat;
    };

    if (!coverLetterId) {
      return NextResponse.json(
        { error: 'Cover letter ID is required' },
        { status: 400 }
      );
    }

    // Fetch cover letter from database
    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', coverLetterId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !coverLetter) {
      console.error('Error fetching cover letter:', error);
      return NextResponse.json(
        { error: 'Cover letter not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare file metadata
    const timestamp = new Date().toISOString().split('T')[0];
    const jobTitle = coverLetter.job_title || 'cover-letter';
    const companyName = coverLetter.company_name || '';
    const baseFileName = `${jobTitle}-${companyName}-${timestamp}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Process export based on format
    switch (format) {
      case 'pdf':
        return await generatePdfResponse(coverLetter, baseFileName);
      case 'docx':
        return await generateDocxResponse(coverLetter, baseFileName);
      case 'txt':
      default:
        return generateTxtResponse(coverLetter, baseFileName);
    }

  } catch (error) {
    console.error('Error exporting cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to export cover letter' },
      { status: 500 }
    );
  }
}

async function generatePdfResponse(coverLetter: any, filename: string) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #2c3e50; }
            .content { white-space: pre-line; }
          </style>
        </head>
        <body>
          <h1>${coverLetter.job_title || 'Cover Letter'}</h1>
          <div class="content">${coverLetter.content}</div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

async function generateDocxResponse(coverLetter: any, filename: string) {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(coverLetter.job_title || 'Cover Letter')],
          }),
          new Paragraph({
            children: [new TextRun(coverLetter.content)],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Failed to generate DOCX');
  }
}

function generateTxtResponse(coverLetter: any, filename: string) {
  const content = `
Cover Letter
${'='.repeat(20)}

${coverLetter.job_title ? `Position: ${coverLetter.job_title}\n` : ''}
${coverLetter.company_name ? `Company: ${coverLetter.company_name}\n` : ''}

${coverLetter.content}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${filename}.txt"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}