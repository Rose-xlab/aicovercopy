// app/api/resumes/export/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import puppeteer from 'puppeteer';
import * as docx from 'docx';
import * as cheerio from 'cheerio';
import { renderResumeTemplate } from '@/lib/resume-template-renderer';

// Import docx components
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, SectionType } = docx;

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Parse the request body
    const { resumeId, templateId, format, filename } = await request.json();
    
    if (!resumeId || !templateId || !format) {
      return NextResponse.json(
        { error: 'ResumeId, templateId, and format are required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to this resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership or public access
    if (!resume.is_public && resume.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this resume' },
        { status: 403 }
      );
    }
    
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('resume_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Generate export filename if not provided
    const baseFilename = filename || `${resume.personal_info.firstName}-${resume.personal_info.lastName}-Resume`;
    
    // Log the export (if user is authenticated)
    if (userId) {
      try {
        await supabase.from('exports').insert({
          user_id: userId,
          resume_id: resumeId,
          template_id: templateId,
          format,
          created_at: new Date().toISOString(),
        });
      } catch (error: unknown) {
        console.error('Error logging export:', error);
        // Non-critical error, continue with export
      }
    }
    
    // Process export based on format
    switch (format) {
      case 'pdf':
        return await generatePDF(resume, template, baseFilename);
      case 'docx':
        return await generateDOCX(resume, template, baseFilename);
      case 'html':
        return generateHTML(resume, template, baseFilename);
      case 'txt':
        return generateTXT(resume, baseFilename);
      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error exporting resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export resume' },
      { status: 500 }
    );
  }
}

/**
 * Generate a PDF from the template using Puppeteer
 */
async function generatePDF(resume: any, template: any, filename: string) {
  try {
    // Generate the HTML with the template
    const html = renderResumeTemplate(template, resume);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for rendering
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Add print styles
    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      preferCSSPageSize: true,
    });
    
    // Close browser
    await browser.close();
    
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
 * Generate a DOCX from the resume data
 */
async function generateDOCX(resume: any, template: any, filename: string) {
  try {
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
          // Header with name and contact info
          new Paragraph({
            text: `${resume.personal_info.firstName} ${resume.personal_info.lastName}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
          }),
          
          new Paragraph({
            text: resume.personal_info.title || 'Professional Resume',
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          }),
          
          // Contact information
          new Paragraph({
            text: `Email: ${resume.personal_info.contact.email} | Phone: ${resume.personal_info.contact.phone || 'N/A'} | Location: ${resume.personal_info.contact.location || 'N/A'}`,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          }),
          
          // Summary section
          ...(resume.personal_info.summary ? [
            new Paragraph({
              text: 'PROFESSIONAL SUMMARY',
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            new Paragraph({
              text: resume.personal_info.summary,
              spacing: {
                after: 400,
              },
            })
          ] : []),
          
          // Work Experience section
          new Paragraph({
            text: 'WORK EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
          
          // Work experience entries
          ...resume.workExperience.flatMap((exp: any) => [
            new Paragraph({
              text: `${exp.position} | ${exp.company}`,
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: 200,
                after: 100,
              },
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate || 'Present'}${exp.location ? ` | ${exp.location}` : ''}`,
              spacing: {
                after: 100,
              },
            }),
            ...(exp.description ? [
              new Paragraph({
                text: exp.description,
                spacing: {
                  after: 100,
                },
              })
            ] : []),
            ...(exp.achievements.map((achievement: string) => 
              new Paragraph({
                text: `• ${achievement}`,
                spacing: {
                  before: 100,
                  after: 100,
                },
              })
            )),
          ]),
          
          // Education section
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
          
          // Education entries
          ...resume.education.flatMap((edu: any) => [
            new Paragraph({
              text: `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`,
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: 200,
                after: 100,
              },
            }),
            new Paragraph({
              text: `${edu.institution} | ${edu.startDate} - ${edu.endDate || 'Present'}`,
              spacing: {
                after: 100,
              },
            }),
            ...(edu.description ? [
              new Paragraph({
                text: edu.description,
                spacing: {
                  after: 100,
                },
              })
            ] : []),
          ]),
          
          // Skills section
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
          
          // Group skills by category
          ...Object.entries(groupSkillsByCategory(resume.skills)).map(
            ([category, skills]: [string, any[]]) => [
              new Paragraph({
                text: category,
                heading: HeadingLevel.HEADING_3,
                spacing: {
                  before: 200,
                  after: 100,
                },
              }),
              new Paragraph({
                text: skills.map((skill: any) => skill.name).join(', '),
                spacing: {
                  after: 200,
                },
              }),
            ]
          ).flat(),
          
          // Additional sections (conditionally added)
          ...(resume.projects && resume.projects.length > 0 ? [
            new Paragraph({
              text: 'PROJECTS',
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            ...resume.projects.flatMap((project: any) => [
              new Paragraph({
                text: project.name,
                heading: HeadingLevel.HEADING_3,
                spacing: {
                  before: 200,
                  after: 100,
                },
              }),
              new Paragraph({
                text: project.description,
                spacing: {
                  after: 100,
                },
              }),
              new Paragraph({
                text: `Technologies: ${project.technologies.join(', ')}`,
                spacing: {
                  after: 200,
                },
              }),
            ]),
          ] : []),
          
          ...(resume.certifications && resume.certifications.length > 0 ? [
            new Paragraph({
              text: 'CERTIFICATIONS',
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),
            ...resume.certifications.map((cert: any) => 
              new Paragraph({
                text: `${cert.name} - ${cert.issuer} (${cert.date})`,
                spacing: {
                  after: 100,
                },
              })
            ),
          ] : []),
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
function generateHTML(resume: any, template: any, filename: string) {
  // Generate the HTML with the template
  const html = renderResumeTemplate(template, resume);
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${filename}.html"`,
    },
  });
}

/**
 * Generate plain text from resume data
 */
function generateTXT(resume: any, filename: string) {
  try {
    // Build a plain text version of the resume
    let textContent = '';
    
    // Header
    textContent += `${resume.personal_info.firstName} ${resume.personal_info.lastName}\n`;
    textContent += `${resume.personal_info.title || ''}\n`;
    textContent += `Email: ${resume.personal_info.contact.email} | Phone: ${resume.personal_info.contact.phone || 'N/A'}\n`;
    textContent += `${resume.personal_info.contact.location ? `Location: ${resume.personal_info.contact.location}` : ''}\n\n`;
    
    // Summary
    if (resume.personal_info.summary) {
      textContent += `PROFESSIONAL SUMMARY\n`;
      textContent += `${resume.personal_info.summary}\n\n`;
    }
    
    // Work Experience
    textContent += `WORK EXPERIENCE\n`;
    for (const exp of resume.workExperience) {
      textContent += `${exp.position} | ${exp.company}\n`;
      textContent += `${exp.startDate} - ${exp.endDate || 'Present'}${exp.location ? ` | ${exp.location}` : ''}\n`;
      if (exp.description) {
        textContent += `${exp.description}\n`;
      }
      for (const achievement of exp.achievements) {
        textContent += `• ${achievement}\n`;
      }
      textContent += '\n';
    }
    
    // Education
    textContent += `EDUCATION\n`;
    for (const edu of resume.education) {
      textContent += `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}\n`;
      textContent += `${edu.institution} | ${edu.startDate} - ${edu.endDate || 'Present'}\n`;
      if (edu.description) {
        textContent += `${edu.description}\n`;
      }
      textContent += '\n';
    }
    
    // Skills
    textContent += `SKILLS\n`;
    const skillsByCategory = groupSkillsByCategory(resume.skills);
    for (const [category, skills] of Object.entries(skillsByCategory)) {
      textContent += `${category}: `;
      textContent += skills.map((skill: any) => skill.name).join(', ');
      textContent += '\n';
    }
    textContent += '\n';
    
    // Projects (if any)
    if (resume.projects && resume.projects.length > 0) {
      textContent += `PROJECTS\n`;
      for (const project of resume.projects) {
        textContent += `${project.name}\n`;
        textContent += `${project.description}\n`;
        textContent += `Technologies: ${project.technologies.join(', ')}\n\n`;
      }
    }
    
    // Certifications (if any)
    if (resume.certifications && resume.certifications.length > 0) {
      textContent += `CERTIFICATIONS\n`;
      for (const cert of resume.certifications) {
        textContent += `${cert.name} - ${cert.issuer} (${cert.date})\n`;
      }
      textContent += '\n';
    }
    
    return new NextResponse(textContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error generating TXT:', error);
    throw new Error('Failed to generate TXT');
  }
}

/**
 * Helper function to group skills by category
 */
function groupSkillsByCategory(skills: any[]) {
  const grouped: Record<string, any[]> = {};
  
  for (const skill of skills) {
    const category = skill.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(skill);
  }
  
  return grouped;
}