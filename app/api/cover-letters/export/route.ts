import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database, Tables } from '@/types/supabase';
import puppeteer from 'puppeteer';
// FIX: Corrected the typo in the import statement from '*s' to '* as'
import * as docx from 'docx';
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

type ExportFormat = 'pdf' | 'docx' | 'txt';

type CoverLetter = Tables<'cover_letters'>;

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const timestamp = new Date().toISOString().split('T')[0];
    const jobTitle = coverLetter.job_title || 'cover-letter';
    const companyName = coverLetter.company_name || '';
    const baseFileName = `${jobTitle}-${companyName}-${timestamp}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

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
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to export cover letter', details: errorMessage },
      { status: 500 }
    );
  }
}

async function generatePdfResponse(coverLetter: CoverLetter, filename: string) {
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    const content = coverLetter.content || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            .content { white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <h1>${coverLetter.job_title || 'Cover Letter'}</h1>
          <div class="content">${content}</div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
    
    // FIX: Use Buffer.from() to reliably convert the returned data into a standard Buffer.
    // This is the most robust way to handle binary data from different sources.
    const pdfBuffer = Buffer.from(pdfUint8Array);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generateDocxResponse(coverLetter: CoverLetter, filename:string) {
  try {
    const content = coverLetter.content || '';

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(coverLetter.job_title || 'Cover Letter')],
            spacing: { after: 240 },
          }),
          ...content.split('\n').map(text => new Paragraph({
            children: [new TextRun(text)],
            spacing: { after: 120 },
          })),
        ],
      }],
    });

    const docxUint8Array = await Packer.toBuffer(doc);

    // FIX: Use Buffer.from() here as well for consistency and reliability.
    const docxBuffer = Buffer.from(docxUint8Array);

    return new NextResponse(docxBuffer, {
      status: 200,
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

function generateTxtResponse(coverLetter: CoverLetter, filename: string) {
  const content = coverLetter.content || '';

  const textContent = `
Cover Letter
${'='.repeat(20)}

Position: ${coverLetter.job_title || 'N/A'}
Company: ${coverLetter.company_name || 'N/A'}

-------------------------------------------------

${content}
`;

  return new NextResponse(textContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.txt"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
