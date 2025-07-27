//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\export\route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, format } = await request.json();

    let contentType: string;
    let fileName: string;
    let fileContent: string;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'txt':
        contentType = 'text/plain';
        fileName = `cover-letter-${timestamp}.txt`;
        fileContent = content;
        break;
      case 'docx':
        // Simple HTML to DOCX conversion
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `cover-letter-${timestamp}.docx`;
        fileContent = `
          <html>
            <body>
              ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
            </body>
          </html>
        `;
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Store export history
    await supabase.from('exports').insert({
      user_id: session.user.id,
      format,
      created_at: new Date().toISOString(),
    });

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
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