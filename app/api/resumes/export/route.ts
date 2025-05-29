// app/api/resumes/export/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { generatePDF } from '@/lib/pdf-generator';
import * as docx from 'docx';
import { renderResumeTemplate } from '@/lib/resume-template-renderer';
import {
    type ResumeData,
    type ResumeTemplate,
    type DatabaseResumeData,
    type DatabaseResumeTemplate,
    mapDatabaseToResumeData,
    mapDatabaseToResumeTemplate
} from '@/types/resume';
import { type Database } from '@/types/supabase';

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, SectionType } = docx;

export const maxDuration = 120;

interface ExportError extends Error {
  code?: string;
  details?: unknown;
}

export async function POST(request: Request) {
  try {
    console.log("Resume export route handler started");
    
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
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    console.log("User session:", userId ? "Authenticated" : "Not authenticated");
    
    console.log("Fetching resume:", resumeId);
    const { data: dbResume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error("Resume fetch error:", resumeError);
      throw new Error(`Resume not found: ${resumeError.message}`);
    }
    if (!dbResume) {
      console.log("Resume not found for ID:", resumeId);
      throw new Error('Resume not found');
    }

    if (!dbResume.is_public && dbResume.user_id !== userId) {
      console.log("Access denied - not public and user ID doesn't match", {
        isPublic: dbResume.is_public,
        resumeUserId: dbResume.user_id,
        requestUserId: userId
      });
      throw new Error('You do not have access to this resume');
    }

    const resumeToRender = mapDatabaseToResumeData(dbResume as unknown as DatabaseResumeData);
    if (!resumeToRender) {
        console.error("Failed to map resume from database for resume ID:", resumeId);
        throw new Error("Failed to process resume data.");
    }
    
    console.log("Fetching template with ID:", templateId);
    const { data: dbTemplateData, error: templateError } = await supabase
      .from('resume_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    let templateToUseForDbQuery = dbTemplateData;
    
    if (!templateToUseForDbQuery && !templateError) {
      console.log("Template not found for ID:", templateId, "- trying to get a default template");
      const { data: defaultTemplates, error: defaultError } = await supabase
        .from('resume_templates')
        .select('*')
        .limit(1);
        
      if (!defaultError && defaultTemplates && defaultTemplates.length > 0) {
        templateToUseForDbQuery = defaultTemplates[0];
        console.log("Using default template:", templateToUseForDbQuery.name);
      } else {
        console.error("No templates available (original or fallback):", defaultError || "No default templates found.");
        throw new Error('No templates available');
      }
    } else if (!templateToUseForDbQuery && templateError) {
        throw new Error(`Template not found: ${templateError.message}`);
    }

    if (!templateToUseForDbQuery) {
        throw new Error('Template could not be loaded.');
    }

    const templateForRendering = mapDatabaseToResumeTemplate(templateToUseForDbQuery as unknown as DatabaseResumeTemplate);
     if (!templateForRendering) {
        throw new Error('Failed to map template data for rendering.');
    }

    const baseFilename = filename || `${resumeToRender.personalInfo?.firstName || 'resume'}-${resumeToRender.personalInfo?.lastName || ''}-Resume`;
    console.log("Using filename:", baseFilename);
    
    if (userId) {
      try {
        await supabase.from('resume_exports').insert({
          user_id: userId,
          resume_id: resumeId,
          format,
          created_at: new Date().toISOString(),
        });
        console.log("Export logged to database");
      } catch (logError) { console.error('Error logging export:', logError as ExportError); }
    }
    
    try {
      console.log(`Starting ${format} generation...`);
      const quality = options?.quality || 'standard';
      const exportTimeout = options?.timeout || 30000;
      console.log(`Export quality: ${quality}, timeout: ${exportTimeout}ms`);
      
      switch (format) {
        case 'pdf':
          return await generatePDFResponse(resumeToRender, templateForRendering, baseFilename, {
            quality,
            timeout: exportTimeout,
            metadata: options?.metadata
          });
        case 'docx':
          return await generateDOCXResponse(resumeToRender, templateForRendering, baseFilename);
        case 'html':
          return generateHTMLResponse(resumeToRender, templateForRendering, baseFilename);
        case 'txt':
          return generateTXTResponse(resumeToRender, baseFilename);
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
    const processingError = error as ExportError;
    console.error("Resume/Template processing error in POST:", processingError);
    return NextResponse.json(
      { error: processingError.message || 'Failed to process resume/template for export' },
      { status: processingError.message.includes("not found") || processingError.message.includes("No templates available") ? 404 : 500 }
    );
  }
}

async function generatePDFResponse(
  resume: ResumeData, 
  template: ResumeTemplate, 
  filename: string,
  options?: {
    quality?: 'draft' | 'standard' | 'high';
    timeout?: number;
    metadata?: Record<string, string>;
  }
) {
  try {
    console.log("Generating PDF for resume:", resume.id);
    const html = renderResumeTemplate(template, resume);
    
    const qualitySettings = {
      draft: { scale: 1, deviceScaleFactor: 1 },
      standard: { scale: 1, deviceScaleFactor: 2 },
      high: { scale: 1, deviceScaleFactor: 3 }
    };
    const quality = options?.quality || 'standard';
    const settings = qualitySettings[quality];
    
    const pdfNodeBuffer: Buffer = await generatePDF(html, {
      format: 'A4',
      margins: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      scale: settings.scale,
      timeout: options?.timeout || 30000,
      retries: 2
    });
    
    console.log("PDF generated successfully, size:", pdfNodeBuffer.length);
    
    // FIX: Create a Uint8Array copy from the Node.js Buffer to ensure plain ArrayBuffer backing for Blob
    const pdfUint8Array = new Uint8Array(pdfNodeBuffer);
    const pdfBlob = new Blob([pdfUint8Array], { type: 'application/pdf' });

    return new NextResponse(pdfBlob, {
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

async function generateDOCXResponse(
    resume: ResumeData, 
    template: ResumeTemplate, 
    filename: string
) {
  try {
    console.log("Generating DOCX for resume:", resume.id);
    
    const doc = new Document({
      sections: [{
        properties: { type: SectionType.CONTINUOUS, page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }}},
        children: [
          new Paragraph({ text: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
          new Paragraph({ text: resume.personalInfo.title || 'Professional Resume', alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          new Paragraph({ text: `Email: ${resume.personalInfo.contact.email}${resume.personalInfo.contact.phone ? ` | Phone: ${resume.personalInfo.contact.phone}` : ''}${resume.personalInfo.contact.location ? ` | Location: ${resume.personalInfo.contact.location}` : ''}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          ...(resume.personalInfo.summary ? [
            new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            new Paragraph({ text: resume.personalInfo.summary, spacing: { after: 400 } })
          ] : []),
          new Paragraph({ text: 'WORK EXPERIENCE', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          ...(resume.workExperience || []).flatMap(exp => [
            new Paragraph({ text: `${exp.position} | ${exp.company}`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
            new Paragraph({ text: `${exp.startDate} - ${exp.isOngoing ? 'Present' : (exp.endDate || '')}${exp.location ? ` | ${exp.location}` : ''}`, spacing: { after: 100 } }),
            ...(exp.description ? [new Paragraph({ text: exp.description, spacing: { after: 100 } })] : []),
            ...(exp.achievements?.map(achievement => new Paragraph({ text: `• ${achievement}`, spacing: { before: 100, after: 100 } })) || []),
          ]),
          ...(resume.education && resume.education.length > 0 ? [
            new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            ...(resume.education || []).flatMap(edu => [
              new Paragraph({ text: `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
              new Paragraph({ text: `${edu.institution} | ${edu.startDate} - ${edu.isOngoing ? 'Present' : (edu.endDate || '')}`, spacing: { after: 100 } }),
              ...(edu.description ? [new Paragraph({ text: edu.description, spacing: { after: 100 } })] : []),
            ]),
          ] : []),
          ...(resume.skills && resume.skills.length > 0 ? [
            new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            ...Object.entries(groupSkillsByCategory(resume.skills || [])).map(
              ([category, skillsList]: [string, any[]]) => [
                new Paragraph({ text: category, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                new Paragraph({ text: skillsList.map(skill => skill.name).join(', '), spacing: { after: 200 } }),
              ]
            ).flat(),
          ] : []),
          ...(resume.projects && resume.projects.length > 0 ? [
             new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
             ...(resume.projects || []).flatMap(project => [
                 new Paragraph({ text: project.name, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                 new Paragraph({ text: project.description, spacing: { after: 100 } }),
                 new Paragraph({ text: `Technologies: ${project.technologies?.join(', ') || ''}`, spacing: { after: 200 } }),
             ]),
          ] : []),
          ...(resume.certifications && resume.certifications.length > 0 ? [
            new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            ...(resume.certifications || []).map(cert => 
              new Paragraph({ text: `${cert.name} - ${cert.issuer} (${cert.date})`, spacing: { after: 100 } })
            ),
          ] : []),
        ],
      }],
    });
    
    const docxNodeBuffer: Buffer = await Packer.toBuffer(doc);
    console.log("DOCX generated successfully, size:", docxNodeBuffer.length);
    
    // FIX: Create a Uint8Array copy from the Node.js Buffer
    const docxUint8Array = new Uint8Array(docxNodeBuffer);
    const docxBlob = new Blob([docxUint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    return new NextResponse(docxBlob, {
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

function generateHTMLResponse(resume: ResumeData, template: ResumeTemplate, filename: string) {
  try {
    console.log("Generating HTML for resume:", resume.id);
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

function generateTXTResponse(resume: ResumeData, filename: string) {
  try {
    console.log("Generating TXT for resume:", resume.id);
    let textContent = '';
    
    textContent += `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}\n`;
    textContent += `${resume.personalInfo.title || ''}\n`;
    textContent += `Email: ${resume.personalInfo.contact.email}${resume.personalInfo.contact.phone ? ` | Phone: ${resume.personalInfo.contact.phone}` : ''}\n`;
    textContent += `${resume.personalInfo.contact.location ? `Location: ${resume.personalInfo.contact.location}` : ''}\n\n`;
    
    if (resume.personalInfo.summary) {
      textContent += `PROFESSIONAL SUMMARY\n${resume.personalInfo.summary}\n\n`;
    }
    
    if (resume.workExperience && resume.workExperience.length > 0) {
        textContent += `WORK EXPERIENCE\n`;
        for (const exp of resume.workExperience) {
          textContent += `${exp.position} | ${exp.company}\n`;
          textContent += `${exp.startDate} - ${exp.isOngoing ? 'Present' : (exp.endDate || '')}${exp.location ? ` | ${exp.location}` : ''}\n`;
          if (exp.description) textContent += `${exp.description}\n`;
          if (exp.achievements && exp.achievements.length > 0) {
            for (const achievement of exp.achievements) textContent += `• ${achievement}\n`;
          }
          textContent += '\n';
        }
    }

    if (resume.education && resume.education.length > 0) {
        textContent += `EDUCATION\n`;
        for (const edu of resume.education) {
          textContent += `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}\n`;
          textContent += `${edu.institution} | ${edu.startDate} - ${edu.isOngoing ? 'Present' : (edu.endDate || '')}\n`;
          if (edu.description) textContent += `${edu.description}\n`;
          textContent += '\n';
        }
    }

    if (resume.skills && resume.skills.length > 0) {
        textContent += `SKILLS\n`;
        const skillsByCategory = groupSkillsByCategory(resume.skills);
        for (const [category, skillsList] of Object.entries(skillsByCategory)) {
          textContent += `${category}: `;
          textContent += skillsList.map((skill) => skill.name).join(', ');
          textContent += '\n';
        }
        textContent += '\n';
    }

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

function groupSkillsByCategory(skills: ResumeData['skills']) {
  const grouped: Record<string, NonNullable<ResumeData['skills']>> = {};
  
  if (!Array.isArray(skills)) {
    console.warn("Skills is not an array or is undefined:", skills);
    return grouped; 
  }
  
  for (const skill of skills) {
    const category = skill.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category]!.push(skill); 
  }
  
  return grouped;
}
