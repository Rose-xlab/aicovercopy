// app/api/resumes/export/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { generatePDF } from '@/lib/pdf-generator';
import * as docx from 'docx';
import * as cheerio from 'cheerio';
import { renderResumeTemplate } from '@/lib/resume-template-renderer';

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
    console.log("Resume export route handler started");
    
    // Parse the request body with error handling
    let body;
    try {
      body = await request.json();
      console.log("Request received for resume export", {
        resumeId: body.resumeId,
        templateId: body.templateId,
        format: body.format
      });
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { resumeId, templateId, format, filename, options } = body;
    
    if (!resumeId || !templateId || !format) {
      console.error("Missing required fields:", { resumeId, templateId, format });
      return NextResponse.json(
        { error: 'ResumeId, templateId, and format are required' },
        { status: 400 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    console.log("User session:", userId ? "Authenticated" : "Not authenticated");
    
    // Verify user has access to this resume
    console.log("Fetching resume:", resumeId);
    try {
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
      
      if (resumeError) {
        console.error("Resume fetch error:", resumeError);
        throw new Error(`Resume not found: ${resumeError.message}`);
      }
      
      if (!resume) {
        console.log("Resume not found for ID:", resumeId);
        throw new Error('Resume not found');
      }
      
      // Verify ownership or public access
      if (!resume.is_public && resume.user_id !== userId) {
        console.log("Access denied - not public and user ID doesn't match", {
          isPublic: resume.is_public,
          resumeUserId: resume.user_id,
          requestUserId: userId
        });
        throw new Error('You do not have access to this resume');
      }
      
      // Get the template
      console.log("Fetching template with ID:", templateId);
      const { data: template, error: templateError } = await supabase
        .from('resume_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError) {
        console.error("Template fetch error:", templateError);
        throw new Error(`Template not found: ${templateError.message}`);
      }
      
      // Variable to hold the template, whether the original or fallback
      let templateToUse = template;
      
      // If the template wasn't found, try to get any available template as fallback
      if (!templateToUse) {
        console.log("Template not found for ID:", templateId, "- trying to get a default template");
        const { data: defaultTemplates, error: defaultError } = await supabase
          .from('resume_templates')
          .select('*')
          .limit(1);
          
        if (!defaultError && defaultTemplates && defaultTemplates.length > 0) {
          templateToUse = defaultTemplates[0];
          console.log("Using default template:", templateToUse.name);
        } else {
          console.error("No templates available in the database");
          throw new Error('No templates available');
        }
      }
      
      // Generate export filename if not provided
      const baseFilename = filename || `${resume.personal_info?.firstName || 'resume'}-${resume.personal_info?.lastName || ''}-Resume`;
      console.log("Using filename:", baseFilename);
      
      // Log the export (if user is authenticated)
      if (userId) {
        try {
          await supabase.from('resume_exports').insert({
            user_id: userId,
            resume_id: resumeId,
            format,
            created_at: new Date().toISOString(),
          });
          console.log("Export logged to database");
        } catch (error) {
          const exportError = error as ExportError;
          console.error('Error logging export:', exportError);
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
        
        switch (format) {
          case 'pdf':
            return await generatePDFResponse(resume, templateToUse, baseFilename, {
              quality,
              timeout: exportTimeout,
              metadata: options?.metadata
            });
          case 'docx':
            return await generateDOCXResponse(resume, templateToUse, baseFilename);
          case 'html':
            return generateHTMLResponse(resume, templateToUse, baseFilename);
          case 'txt':
            return generateTXTResponse(resume, baseFilename);
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
        throw new Error(`Failed to generate ${format}: ${exportError.message}`);
      }
    } catch (error) {
      const resumeError = error as ExportError;
      console.error("Resume processing error:", resumeError);
      return NextResponse.json(
        { error: resumeError.message || 'Failed to process resume' },
        { status: 404 }
      );
    }
  } catch (error) {
    const serverError = error as ExportError;
    console.error('Unhandled error in export route:', serverError);
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
  resume: any, 
  template: any, 
  filename: string,
  options?: {
    quality?: 'draft' | 'standard' | 'high';
    timeout?: number;
    metadata?: Record<string, string>;
  }
) {
  try {
    console.log("Generating PDF for resume:", resume.id);
    // Generate the HTML with the template
    const html = renderResumeTemplate(template, resume);
    
    // Quality settings
    const qualitySettings = {
      draft: { scale: 1, deviceScaleFactor: 1 },
      standard: { scale: 1, deviceScaleFactor: 2 },
      high: { scale: 1, deviceScaleFactor: 3 }
    };
    
    const quality = options?.quality || 'standard';
    const settings = qualitySettings[quality];
    
    // Generate PDF using the utility with retries
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
    
    console.log("PDF generated successfully, size:", pdfBuffer.length);
    
    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    const pdfError = error as ExportError;
    console.error('Error generating PDF:', pdfError);
    throw new Error(`Failed to generate PDF: ${pdfError.message}`);
  }
}

/**
 * Generate a DOCX from the resume data
 */
async function generateDOCXResponse(resume: any, template: any, filename: string) {
  try {
    console.log("Generating DOCX for resume:", resume.id);
    
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
            text: `Email: ${resume.personal_info.contact.email}${resume.personal_info.contact.phone ? ` | Phone: ${resume.personal_info.contact.phone}` : ''}${resume.personal_info.contact.location ? ` | Location: ${resume.personal_info.contact.location}` : ''}`,
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
          ...resume.work_experience.flatMap((exp: any) => [
            new Paragraph({
              text: `${exp.position} | ${exp.company}`,
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: 200,
                after: 100,
              },
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.isOngoing ? 'Present' : exp.endDate}${exp.location ? ` | ${exp.location}` : ''}`,
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
            ...(exp.achievements?.map((achievement: string) => 
              new Paragraph({
                text: `• ${achievement}`,
                spacing: {
                  before: 100,
                  after: 100,
                },
              })
            ) || []),
          ]),
          
          // Education section
          ...(resume.education && resume.education.length > 0 ? [
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
                text: `${edu.institution} | ${edu.startDate} - ${edu.isOngoing ? 'Present' : edu.endDate}`,
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
          ] : []),
          
          // Skills section
          ...(resume.skills && resume.skills.length > 0 ? [
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
          ] : []),
          
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
                text: `Technologies: ${project.technologies?.join(', ') || ''}`,
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
    console.log("DOCX generated successfully, size:", buffer.length);
    
    // Return the DOCX
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (error) {
    const docxError = error as ExportError;
    console.error('Error generating DOCX:', docxError);
    throw new Error(`Failed to generate DOCX: ${docxError.message}`);
  }
}

/**
 * Generate HTML from the template
 */
function generateHTMLResponse(resume: any, template: any, filename: string) {
  try {
    console.log("Generating HTML for resume:", resume.id);
    // Generate the HTML with the template
    const html = renderResumeTemplate(template, resume);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}.html"`,
      },
    });
  } catch (error) {
    const htmlError = error as ExportError;
    console.error('Error generating HTML:', htmlError);
    throw new Error(`Failed to generate HTML: ${htmlError.message}`);
  }
}

/**
 * Generate plain text from resume data
 */
function generateTXTResponse(resume: any, filename: string) {
  try {
    console.log("Generating TXT for resume:", resume.id);
    // Build a plain text version of the resume
    let textContent = '';
    
    // Header
    textContent += `${resume.personal_info.firstName} ${resume.personal_info.lastName}\n`;
    textContent += `${resume.personal_info.title || ''}\n`;
    textContent += `Email: ${resume.personal_info.contact.email}${resume.personal_info.contact.phone ? ` | Phone: ${resume.personal_info.contact.phone}` : ''}\n`;
    textContent += `${resume.personal_info.contact.location ? `Location: ${resume.personal_info.contact.location}` : ''}\n\n`;
    
    // Summary
    if (resume.personal_info.summary) {
      textContent += `PROFESSIONAL SUMMARY\n`;
      textContent += `${resume.personal_info.summary}\n\n`;
    }
    
    // Work Experience
    textContent += `WORK EXPERIENCE\n`;
    for (const exp of resume.work_experience) {
      textContent += `${exp.position} | ${exp.company}\n`;
      textContent += `${exp.startDate} - ${exp.isOngoing ? 'Present' : exp.endDate}${exp.location ? ` | ${exp.location}` : ''}\n`;
      if (exp.description) {
        textContent += `${exp.description}\n`;
      }
      if (exp.achievements && exp.achievements.length > 0) {
        for (const achievement of exp.achievements) {
          textContent += `• ${achievement}\n`;
        }
      }
      textContent += '\n';
    }
    
    // Education
    if (resume.education && resume.education.length > 0) {
      textContent += `EDUCATION\n`;
      for (const edu of resume.education) {
        textContent += `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}\n`;
        textContent += `${edu.institution} | ${edu.startDate} - ${edu.isOngoing ? 'Present' : edu.endDate}\n`;
        if (edu.description) {
          textContent += `${edu.description}\n`;
        }
        textContent += '\n';
      }
    }
    
    // Skills
    if (resume.skills && resume.skills.length > 0) {
      textContent += `SKILLS\n`;
      const skillsByCategory = groupSkillsByCategory(resume.skills);
      for (const [category, skills] of Object.entries(skillsByCategory)) {
        textContent += `${category}: `;
        textContent += skills.map((skill: any) => skill.name).join(', ');
        textContent += '\n';
      }
      textContent += '\n';
    }
    
    // Projects (if any)
    if (resume.projects && resume.projects.length > 0) {
      textContent += `PROJECTS\n`;
      for (const project of resume.projects) {
        textContent += `${project.name}\n`;
        textContent += `${project.description}\n`;
        if (project.technologies && project.technologies.length > 0) {
          textContent += `Technologies: ${project.technologies.join(', ')}\n`;
        }
        textContent += '\n';
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
    
    console.log("TXT generated successfully, size:", textContent.length);
    
    return new NextResponse(textContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}.txt"`,
      },
    });
  } catch (error) {
    const txtError = error as ExportError;
    console.error('Error generating TXT:', txtError);
    throw new Error(`Failed to generate TXT: ${txtError.message}`);
  }
}

/**
 * Helper function to group skills by category
 */
function groupSkillsByCategory(skills: any[]) {
  const grouped: Record<string, any[]> = {};
  
  if (!Array.isArray(skills)) {
    console.warn("Skills is not an array:", skills);
    return { "Other": [] };
  }
  
  for (const skill of skills) {
    const category = skill.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(skill);
  }
  
  return grouped;
}