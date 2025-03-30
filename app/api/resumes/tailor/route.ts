// app/api/resumes/tailor/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import openai from '@/lib/openai';
import { mapDatabaseToResumeData, mapResumeToDatabase } from '@/lib/resume-mappers';
import { ResumeData, WorkExperience, Skill } from '@/types/resume';
import { logResumeTailoring } from '@/lib/resume-tailoring-logger';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { resumeId, jobDescription } = await request.json();
    
    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume ID and job description are required' },
        { status: 400 }
      );
    }
    
    // Check if the resume exists and belongs to the user
    const { data: resumeData, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Resume not found or you do not have access' },
        { status: 404 }
      );
    }
    
    // Transform resume data to the format expected by our AI services
    const resume = mapDatabaseToResumeData(resumeData);
    
    // Call our AI service to tailor the resume
    const { tailoredResume, changedSections, keywordMatches } = await tailorResumeWithAI(resume, jobDescription);
    
    // Log the tailoring event
    await logResumeTailoring(
      session.user.id,
      resumeId,
      jobDescription,
      changedSections,
      keywordMatches,
      true
    );
    
    // Return the tailored resume without saving it yet (user will review and decide)
    return NextResponse.json({ tailoredResume, changedSections });
  } catch (error: any) {
    console.error('Error tailoring resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}

/**
 * Use OpenAI to tailor a resume based on a job description
 */
async function tailorResumeWithAI(resume: ResumeData, jobDescription: string): Promise<{
  tailoredResume: ResumeData;
  changedSections: string[];
  keywordMatches: number;
}> {
  try {
    // Make a deep copy of the resume to avoid modifying the original
    const tailoredResume: ResumeData = JSON.parse(JSON.stringify(resume));
    
    // Step 1: Extract key requirements and skills from the job description
    const jobAnalysis = await analyzeJobDescription(jobDescription);
    
    // Step 2: Enhance the professional summary
    if (tailoredResume.personalInfo) {
      tailoredResume.personalInfo.summary = await enhanceSummary(
        tailoredResume.personalInfo.summary || '',
        jobDescription,
        jobAnalysis
      );
    }
    
    // Step 3: Enhance work experiences to highlight relevant experience
    if (tailoredResume.workExperience && tailoredResume.workExperience.length > 0) {
      tailoredResume.workExperience = await enhanceWorkExperiences(
        tailoredResume.workExperience,
        jobDescription,
        jobAnalysis
      );
    }
    
    // Step 4: Enhance skills section with relevant skills from job description
    if (tailoredResume.skills) {
      tailoredResume.skills = await enhanceSkills(
        tailoredResume.skills,
        jobAnalysis.skills,
        tailoredResume.personalInfo?.title || ''
      );
    }
    
    // Step 5: Enhance projects section if available
    if (tailoredResume.projects && tailoredResume.projects.length > 0) {
      tailoredResume.projects = await enhanceProjects(
        tailoredResume.projects,
        jobDescription,
        jobAnalysis
      );
    }
    
    // Step 6: Calculate changes made to the resume
    const changedSections = determineChangedSections(resume, tailoredResume);
    
    // Step 7: Calculate keyword matches
    const keywordMatches = calculateKeywordMatches(tailoredResume, jobAnalysis);
    
    return {
      tailoredResume,
      changedSections,
      keywordMatches
    };
  } catch (error) {
    console.error('Error in tailorResumeWithAI:', error);
    throw new Error('Failed to tailor resume with AI');
  }
}

/**
 * Analyze the job description to extract key requirements, skills, and responsibilities
 */
async function analyzeJobDescription(jobDescription: string) {
  try {
    const systemPrompt = `
      You are an expert job analyzer with deep knowledge of ATS (Applicant Tracking Systems).
      Your task is to analyze a job description and extract key information for resume optimization.
      
      Extract the following information:
      1. Required hard skills (technical skills, tools, software)
      2. Required soft skills
      3. Key responsibilities
      4. Must-have qualifications
      5. Nice-to-have qualifications
      6. Industry-specific terminology and buzzwords
      
      Return a JSON object with the following structure:
      {
        "jobTitle": "string",
        "skills": {
          "hardSkills": ["string"],
          "softSkills": ["string"]
        },
        "keyResponsibilities": ["string"],
        "mustHaveQualifications": ["string"],
        "niceToHaveQualifications": ["string"],
        "industryTerminology": ["string"]
      }
    `;

    const userPrompt = `
      Analyze the following job description:
      
      ${jobDescription}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || '{}';
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('Error analyzing job description:', error);
    // Return a minimal structure if analysis fails
    return {
      jobTitle: "",
      skills: {
        hardSkills: [],
        softSkills: []
      },
      keyResponsibilities: [],
      mustHaveQualifications: [],
      niceToHaveQualifications: [],
      industryTerminology: []
    };
  }
}

/**
 * Enhance the professional summary to target the job description
 */
async function enhanceSummary(currentSummary: string, jobDescription: string, jobAnalysis: any): Promise<string> {
  try {
    const systemPrompt = `
      You are an expert resume writer specializing in crafting powerful professional summaries.
      Your task is to enhance the existing professional summary to better target the specific job description.
      
      Follow these guidelines:
      1. Emphasize skills and experience that directly match the job requirements
      2. Include industry-specific keywords from the job description to improve ATS ranking
      3. Keep the tone professional and confident
      4. Maintain a similar length to the original summary (2-4 sentences)
      5. Do not fabricate experience or skills not mentioned in the original summary
      
      Return only the enhanced summary, nothing else.
    `;

    const userPrompt = `
      Job Description:
      ${jobDescription}
      
      Key Job Requirements:
      Hard Skills: ${jobAnalysis.skills.hardSkills.join(', ')}
      Soft Skills: ${jobAnalysis.skills.softSkills.join(', ')}
      Key Responsibilities: ${jobAnalysis.keyResponsibilities.join(', ')}
      
      Current Professional Summary:
      ${currentSummary || "No current summary."}
      
      Please enhance this summary to better target the job description.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    });

    return completion.choices[0].message.content?.trim() || currentSummary;
  } catch (error) {
    console.error('Error enhancing summary:', error);
    return currentSummary;
  }
}

/**
 * Enhance work experiences to highlight relevant experience for the job
 */
async function enhanceWorkExperiences(experiences: WorkExperience[], jobDescription: string, jobAnalysis: any): Promise<WorkExperience[]> {
  try {
    // Make a deep copy to avoid modifying the original
    const enhancedExperiences: WorkExperience[] = JSON.parse(JSON.stringify(experiences));
    
    // Sort experiences by recency (newest first)
    enhancedExperiences.sort((a, b) => {
      const dateA = a.endDate || a.startDate;
      const dateB = b.endDate || b.startDate;
      return dateB.localeCompare(dateA);
    });
    
    // Process only the 3 most recent experiences
    const recentExperiences = enhancedExperiences.slice(0, 3);
    
    for (const exp of recentExperiences) {
      const systemPrompt = `
        You are an expert resume writer specializing in tailoring work experience descriptions for specific job applications.
        Your task is to enhance the work experience description and achievements to better match the target job.
        
        Guidelines:
        1. Emphasize responsibilities and achievements that align with the target job
        2. Use industry-specific terminology from the job description
        3. Quantify achievements where possible (numbers, percentages, etc.)
        4. Use strong action verbs
        5. Do not fabricate experience or drastically change the nature of the role
        6. Keep a similar length to the original content
        
        Return a JSON object with the updated description and achievements:
        {
          "description": "string",
          "achievements": ["string"]
        }
      `;

      const userPrompt = `
        Target Job Description:
        ${jobDescription}
        
        Key Job Requirements:
        Hard Skills: ${jobAnalysis.skills.hardSkills.join(', ')}
        Soft Skills: ${jobAnalysis.skills.softSkills.join(', ')}
        Key Responsibilities: ${jobAnalysis.keyResponsibilities.join(', ')}
        
        Current Work Experience to Enhance:
        Position: ${exp.position}
        Company: ${exp.company}
        Description: ${exp.description || 'No description provided'}
        
        Current Achievements:
        ${exp.achievements.map(a => `- ${a}`).join('\n') || 'No achievements listed'}
        
        Please enhance this work experience to better target the job description.
      `;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        
        // Update the experience with the enhanced content
        exp.description = response.description || exp.description;
        exp.achievements = response.achievements || exp.achievements;
      } catch (error) {
        console.error(`Error enhancing work experience for ${exp.position}:`, error);
        // Continue with the next experience if one fails
      }
    }
    
    return enhancedExperiences;
  } catch (error) {
    console.error('Error enhancing work experiences:', error);
    return experiences;
  }
}

/**
 * Enhance skills section based on job requirements
 */
async function enhanceSkills(currentSkills: Skill[], jobSkills: any, jobTitle: string): Promise<Skill[]> {
  try {
    const systemPrompt = `
      You are an expert resume skills optimizer.
      Your task is to enhance a skills section for a resume to better match a specific job.
      
      Guidelines:
      1. Identify skills from the current resume that match the job requirements
      2. Suggest additional relevant skills that should be added based on the job requirements
      3. Do not remove essential skills that may be relevant even if not directly mentioned
      4. Prioritize hard skills that demonstrate specific technical abilities
      5. Maintain a balanced mix of hard and soft skills
      
      Return a JSON array of skill objects with the following structure:
      [
        {
          "id": "string",
          "name": "string",
          "level": "Beginner"|"Intermediate"|"Advanced"|"Expert",
          "category": "string"
        }
      ]
    `;

    const userPrompt = `
      Target Job Title: ${jobTitle}
      
      Job Required Skills:
      Hard Skills: ${jobSkills.hardSkills.join(', ')}
      Soft Skills: ${jobSkills.softSkills.join(', ')}
      
      Current Skills on Resume:
      ${JSON.stringify(currentSkills, null, 2)}
      
      Please enhance the skills section by:
      1. Keeping relevant existing skills
      2. Adding important missing skills from the job requirements
      3. Setting appropriate skill levels
      4. Organizing into categories
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '[]');
    
    // Ensure all skills have IDs
    const enhancedSkills = response.map((skill: any) => ({
      ...skill,
      id: skill.id || crypto.randomUUID()
    }));
    
    return enhancedSkills;
  } catch (error) {
    console.error('Error enhancing skills:', error);
    return currentSkills;
  }
}

/**
 * Enhance projects section to highlight relevant projects
 */
async function enhanceProjects(projects: any[], jobDescription: string, jobAnalysis: any): Promise<any[]> {
  try {
    // Make a deep copy to avoid modifying the original
    const enhancedProjects = JSON.parse(JSON.stringify(projects));
    
    // Only enhance up to 2 most relevant projects
    // We'll determine relevance by matching project technologies with job required skills
    const relevanceScores = enhancedProjects.map((project: any) => {
      let score = 0;
      const projectTech = project.technologies || [];
      
      // Check against hard skills
      jobAnalysis.skills.hardSkills.forEach((skill: string) => {
        const skillLower = skill.toLowerCase();
        if (projectTech.some((tech: string) => tech.toLowerCase().includes(skillLower) || 
                             skillLower.includes(tech.toLowerCase()))) {
          score += 2;
        }
        
        // Also check in project name and description
        if (project.name.toLowerCase().includes(skillLower) || 
            (project.description || '').toLowerCase().includes(skillLower)) {
          score += 1;
        }
      });
      
      // Check if project aligns with key responsibilities
      jobAnalysis.keyResponsibilities.forEach((resp: string) => {
        if ((project.description || '').toLowerCase().includes(resp.toLowerCase())) {
          score += 1;
        }
      });
      
      return { project, score };
    });
    
    // Sort by relevance score and take top 2
    const sortedProjects = relevanceScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.project)
      .slice(0, 2);
    
    // Enhance the most relevant projects
    for (const project of sortedProjects) {
      const systemPrompt = `
        You are an expert resume writer specializing in highlighting relevant projects.
        Your task is to enhance the project description to better align with the target job.
        
        Guidelines:
        1. Emphasize aspects of the project that relate to the target job
        2. Highlight technologies and skills that match job requirements
        3. Use industry-specific terminology from the job description
        4. Keep the enhancements factual and based on the original content
        5. Maintain approximately the same length as the original description
        
        Return a JSON object with the enhanced project description:
        {
          "description": "string",
          "achievements": ["string"] (optional)
        }
      `;

      const userPrompt = `
        Target Job Description:
        ${jobDescription}
        
        Key Job Requirements:
        Hard Skills: ${jobAnalysis.skills.hardSkills.join(', ')}
        Soft Skills: ${jobAnalysis.skills.softSkills.join(', ')}
        
        Project to Enhance:
        Name: ${project.name}
        Description: ${project.description || 'No description provided'}
        Technologies: ${project.technologies.join(', ')}
        
        ${project.achievements ? `Current Achievements:\n${project.achievements.map((a: string) => `- ${a}`).join('\n')}` : ''}
        
        Please enhance this project to better target the job description.
      `;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        
        // Update the project with the enhanced content
        project.description = response.description || project.description;
        if (response.achievements && Array.isArray(response.achievements)) {
          project.achievements = response.achievements;
        }
      } catch (error) {
        console.error(`Error enhancing project ${project.name}:`, error);
        // Continue with the next project if one fails
      }
    }
    
    return enhancedProjects;
  } catch (error) {
    console.error('Error enhancing projects:', error);
    return projects;
  }
}

/**
 * Determine which sections were changed between original and tailored resume
 */
function determineChangedSections(originalResume: ResumeData, tailoredResume: ResumeData): string[] {
  const changedSections: string[] = [];
  
  // Check personal info (summary)
  if (originalResume.personalInfo?.summary !== tailoredResume.personalInfo?.summary) {
    changedSections.push('summary');
  }
  
  // Check work experience
  if (JSON.stringify(originalResume.workExperience) !== JSON.stringify(tailoredResume.workExperience)) {
    changedSections.push('workExperience');
  }
  
  // Check skills
  if (JSON.stringify(originalResume.skills) !== JSON.stringify(tailoredResume.skills)) {
    changedSections.push('skills');
  }
  
  // Check education
  if (JSON.stringify(originalResume.education) !== JSON.stringify(tailoredResume.education)) {
    changedSections.push('education');
  }
  
  // Check projects
  if (JSON.stringify(originalResume.projects) !== JSON.stringify(tailoredResume.projects)) {
    changedSections.push('projects');
  }
  
  return changedSections;
}

/**
 * Calculate the number of keyword matches between the resume and job requirements
 */
function calculateKeywordMatches(resume: ResumeData, jobAnalysis: any): number {
  let matches = 0;
  const allJobKeywords = [
    ...(jobAnalysis.skills?.hardSkills || []),
    ...(jobAnalysis.skills?.softSkills || []),
    ...(jobAnalysis.industryTerminology || [])
  ].map(kw => kw.toLowerCase());
  
  // Check all textual content in the resume
  const resumeContent = [
    // Summary
    resume.personalInfo?.summary || '',
    
    // Work experience
    ...(resume.workExperience || []).flatMap(exp => [
      exp.position,
      exp.company,
      exp.description || '',
      ...(exp.achievements || [])
    ]),
    
    // Skills
    ...(resume.skills || []).map(skill => skill.name),
    
    // Projects
    ...(resume.projects || []).flatMap(proj => [
      proj.name,
      proj.description || '',
      ...(proj.technologies || []),
      ...(proj.achievements || [])
    ])
  ].join(' ').toLowerCase();
  
  // Count unique keyword matches
  const uniqueMatches = new Set<string>();
  
  for (const keyword of allJobKeywords) {
    if (resumeContent.includes(keyword)) {
      uniqueMatches.add(keyword);
    }
  }
  
  return uniqueMatches.size;
}