// app/api/generate/route.ts (enhanced version with fixed TS errors)
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import openai from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      jobDescription,
      jobTitle,
      companyName,
      userProfile,
      tone = 'professional',
      regenerate = false,
      dataSource = 'none'
    } = await request.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    let prompt = `
      Write a professional cover letter in English with the following parameters:
      
      Job Description:
      ${jobDescription}
      
      ${jobTitle ? `Job Title: ${jobTitle}` : ''}
      ${companyName ? `Company: ${companyName}` : ''}
      
      Tone: ${tone}
    `;

    if (userProfile) {
      prompt += `\nApplicant Information:\n`;

      if (userProfile.keyAttributes) {
        const attr = userProfile.keyAttributes;

        if (attr.yearsOfExperience) {
          prompt += `Years of Experience: ${attr.yearsOfExperience}\n`;
        }

        if (attr.currentRole) {
          prompt += `Current Role: ${attr.currentRole}\n`;
        }

        if (attr.currentCompany) {
          prompt += `Current Company: ${attr.currentCompany}\n`;
        }

        if (attr.skills && attr.skills.length > 0) {
          prompt += `Key Skills: ${attr.skills.join(', ')}\n`;
        }

        if (attr.accomplishments && attr.accomplishments.length > 0) {
          prompt += `Key Accomplishments:\n`;
          attr.accomplishments.forEach((acc: string) => {
            prompt += `- ${acc}\n`;
          });
        }
      }

      if (userProfile.linkedin) {
        const li = userProfile.linkedin;

        prompt += `\nLinkedIn Profile Information:\n`;
        prompt += `Name: ${li.name}\n`;
        prompt += `Title: ${li.title}\n`;
        prompt += `Current Position: ${li.currentRole} at ${li.currentCompany}\n`;
        prompt += `Years of Experience: ${li.yearsOfExperience}\n`;

        if (li.topSkills && li.topSkills.length > 0) {
          prompt += `Top Skills: ${li.topSkills.join(', ')}\n`;
        }

        if (li.relevantExperience && li.relevantExperience.length > 0) {
          prompt += `Relevant Experience:\n`;
          li.relevantExperience.forEach((exp: {
            role: string;
            company: string;
            highlights?: string[];
          }) => {
            prompt += `- ${exp.role} at ${exp.company}\n`;
            if (exp.highlights && exp.highlights.length > 0) {
              exp.highlights.slice(0, 2).forEach((highlight: string) => {
                prompt += `  - ${highlight}\n`;
              });
            }
          });
        }

        if (li.education && li.education.length > 0) {
          prompt += `Education:\n`;
          li.education.forEach((edu: {
            degree: string;
            fieldOfStudy?: string;
            school: string;
          }) => {
            prompt += `- ${edu.degree} in ${edu.fieldOfStudy || 'relevant field'} from ${edu.school}\n`;
          });
        }

        if (li.accomplishments && li.accomplishments.length > 0) {
          prompt += `Professional Accomplishments:\n`;
          li.accomplishments.forEach((acc: string) => {
            prompt += `- ${acc}\n`;
          });
        }
      }

      if (userProfile.resume) {
        const resume = userProfile.resume;

        const personalInfo = resume.personal_info || resume.personalInfo;
        if (personalInfo) {
          prompt += `\nResume Personal Information:\n`;
          prompt += `Name: ${personalInfo.firstName} ${personalInfo.lastName}\n`;
          prompt += `Title: ${personalInfo.title || 'N/A'}\n`;

          if (personalInfo.summary) {
            prompt += `Professional Summary: ${personalInfo.summary}\n`;
          }
        }

        const workExperience = resume.work_experience || resume.workExperience || [];
        if (workExperience.length > 0) {
          prompt += `\nWork Experience:\n`;
          workExperience.slice(0, 2).forEach((job: any) => {
            prompt += `- ${job.position} at ${job.company}\n`;
            if (job.achievements && job.achievements.length > 0) {
              job.achievements.slice(0, 2).forEach((achievement: string) => {
                prompt += `  - ${achievement}\n`;
              });
            }
          });
        }

        const education = resume.education || [];
        if (education.length > 0) {
          prompt += `\nEducation:\n`;
          education.forEach((edu: any) => {
            prompt += `- ${edu.degree} from ${edu.institution}\n`;
          });
        }

        const skills = resume.skills || [];
        if (skills.length > 0) {
          const skillNames = skills.map((skill: any) => skill.name || skill).slice(0, 10);
          prompt += `\nSkills: ${skillNames.join(', ')}\n`;
        }
      }
    }

    prompt += `\nThe cover letter should:
      1. Be formal and professional
      2. Highlight relevant experience and skills
      3. Show enthusiasm for the position
      4. Be written in proper English
      5. Follow standard business letter format
    `;

    if (dataSource === 'linkedin') {
      prompt += `6. Specifically highlight relevant experience from the LinkedIn profile
      7. Mention key accomplishments that align with the job requirements
      8. Reference the most relevant skills from the LinkedIn profile`;
    } else if (dataSource === 'cv') {
      prompt += `6. Focus on the most relevant experience from the resume
      7. Highlight key skills that match the job requirements
      8. Mention educational background if relevant to the position`;
    } else if (dataSource === 'both') {
      prompt += `6. Combine the most relevant information from both the resume and LinkedIn profile
      7. Present a cohesive narrative that showcases the candidate's qualifications`;
    }

    if (regenerate) {
      prompt += `\nIMPORTANT: This is a regeneration request. Please create a DIFFERENT version from previous generations with:
      - Alternative opening approach
      - Different highlighted accomplishments
      - Varied sentence structure
      - Fresh phrasing while maintaining the same qualifications`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert cover letter writer with deep knowledge of the job market and business culture. You create persuasive, tailored cover letters that highlight relevant skills and experience while maintaining a professional tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: regenerate ? 0.8 : 0.7,
      max_tokens: 1000,
    });

    const coverLetter = completion.choices[0].message.content;

    await supabase.from('cover_letters').insert({
      user_id: session.user.id,
      job_description: jobDescription,
      job_title: jobTitle,
      company_name: companyName,
      content: coverLetter,
      tone,
      data_source: dataSource,
      created_at: new Date().toISOString(),
      status: 'draft',
      resume_id: userProfile?.resume?.id || null,
      metadata: dataSource === 'linkedin' || dataSource === 'both'
        ? { linkedin_profile_id: userProfile?.linkedin?.profileUrl || null }
        : null
    });

    return NextResponse.json({ coverLetter });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter: ' + error.message },
      { status: 500 }
    );
  }
}
