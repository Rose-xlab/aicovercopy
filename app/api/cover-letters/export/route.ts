import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

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
    const baseFileName = `${jobTitle}-${companyName}-${timestamp}`.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let contentType: string;
    let fileName: string;
    let content: string | Buffer;

    // Generate content based on format
    switch (format) {
      case 'pdf':
        contentType = 'application/pdf';
        fileName = `${baseFileName}.pdf`;
        // In a real implementation, you would use a PDF generation library like pdfkit or puppeteer
        // For now, we'll return a simple text representation
        content = `Cover Letter\n\n${coverLetter.content}`;
        break;

      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `${baseFileName}.docx`;
        // Simple HTML to DOCX conversion
        content = `
          <html>
            <body>
              <h1>${jobTitle} - ${companyName}</h1>
              <div>${coverLetter.content.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
            </body>
          </html>
        `;
        break;

      case 'txt':
      default:
        contentType = 'text/plain';
        fileName = `${baseFileName}.txt`;
        content = `Cover Letter\n\nPosition: ${jobTitle}\nCompany: ${companyName}\n\n${coverLetter.content}`;
        break;
    }

    // Log the export activity
    await supabase.from('exports').insert({
      user_id: session.user.id,
      type: 'cover_letter',
      format,
      item_id: coverLetterId,
      created_at: new Date().toISOString(),
    });

    // Return the file
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('Error exporting cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to export cover letter' },
      { status: 500 }
    );
  }
}