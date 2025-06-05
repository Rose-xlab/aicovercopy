// app/api/resumes/tailor/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { openaiQueue } from '@/lib/queues/openaiQueue';
import { mapDatabaseToResumeData, mapResumeToDatabase } from '@/lib/resume-mappers';
import { ResumeData, WorkExperience, Skill, Project } from '@/types/resume';
import { logResumeTailoring } from '@/lib/resume-tailoring-logger';

export async function POST(request: Request) {
  console.log("API Tailoring - POST request received");

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log("API Tailoring - No authenticated session found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("API Tailoring - Authenticated user:", session.user.id);

    // Get request body
    const requestData = await request.json();
    const { resumeId, jobDescription } = requestData;

    console.log("API Tailoring - Request data:", {
      resumeId,
      jobDescriptionLength: jobDescription?.length || 0
    });

    if (!resumeId || !jobDescription) {
      console.log("API Tailoring - Missing required fields");
      return NextResponse.json(
        { error: 'Resume ID and job description are required' },
        { status: 400 }
      );
    }

    // Check if the resume exists and belongs to the user
    console.log("API Tailoring - Fetching resume from database");
    const { data: resumeData, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !resumeData) {
      console.error("API Tailoring - Error fetching resume:", fetchError);
      return NextResponse.json(
        { error: 'Resume not found or you do not have access' },
        { status: 404 }
      );
    }

    console.log("API Tailoring - Resume fetched successfully");
    console.log("API Tailoring - Database resume structure:", {
      id: resumeData.id,
      user_id: resumeData.user_id,
      fields: Object.keys(resumeData)
    });

    // Transform resume data to the format expected by our AI services
    const resume = mapDatabaseToResumeData(resumeData);

    console.log("API Tailoring - After mapping to UI format:", {
      id: resume?.id,
      userId: resume?.userId,
      fields: resume ? Object.keys(resume) : 'null'
    });

    if (!resume) {
      console.error("API Tailoring - Failed to map resume data");
      return NextResponse.json(
        { error: 'Failed to process resume data' },
        { status: 500 }
      );
    }

    // Call our AI service to tailor the resume
    console.log("API Tailoring - Starting AI tailoring process");
    const { tailoredResume, changedSections, keywordMatches } = await tailorResumeWithAI(resume, jobDescription);

    console.log("API Tailoring - AI tailoring complete");
    console.log("API Tailoring - Changed sections:", changedSections);
    console.log("API Tailoring - Keyword matches:", keywordMatches);

    // Log the tailoring event
    await logResumeTailoring(
      session.user.id,
      resumeId,
      jobDescription,
      changedSections,
      keywordMatches,
      true
    );

    // Check for any missing critical fields
    console.log("API Tailoring - Original resume structure:", {
      hasId: Boolean(resume.id),
      hasUserId: Boolean(resume.userId),
      keys: Object.keys(resume)
    });

    console.log("API Tailoring - Tailored resume structure before validation:", {
      hasId: Boolean(tailoredResume.id),
      hasUserId: Boolean(tailoredResume.userId),
      keys: Object.keys(tailoredResume)
    });

    // Ensure the tailored resume has all the required fields from the original resume
    const validatedTailoredResume = {
      ...resume, // Start with the original resume as base
      ...tailoredResume, // Override with tailored data
      // Ensure critical fields are preserved
      id: resume.id,
      userId: resume.userId,
      user_id: resume.userId, // Add both versions to be safe
      templateId: resume.templateId,
      template_id: resume.templateId, // Add both versions to be safe
      isPublic: resume.isPublic,
      is_public: resume.isPublic, // Add both versions to be safe
      created_at: resume.created_at,
      createdAt: resume.created_at, // Add both versions to be safe
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString() // Add both versions to be safe
    };

    console.log("API Tailoring - Validated tailored resume structure:", {
      hasId: Boolean(validatedTailoredResume.id),
      hasUserId: Boolean(validatedTailoredResume.userId),
      hasUser_id: Boolean(validatedTailoredResume.user_id),
      keys: Object.keys(validatedTailoredResume)
    });

    // Try to map it back to database format as a test
    const testDbMapping = mapResumeToDatabase(validatedTailoredResume);
    console.log("API Tailoring - Test mapping to DB format:", {
      success: Boolean(testDbMapping),
      hasId: testDbMapping ? Boolean(testDbMapping.id) : false,
      hasUser_id: testDbMapping ? Boolean(testDbMapping.user_id) : false,
      keys: testDbMapping ? Object.keys(testDbMapping) : 'null'
    });

    // Return the tailored resume without saving it yet (user will review and decide)
    return NextResponse.json({ tailoredResume: validatedTailoredResume, changedSections });
  } catch (error: any) {
    console.error('API Tailoring - Error handling resume tailoring:', error);
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
  console.log("tailorResumeWithAI - Starting AI tailoring");

  try {
    // Make a deep copy of the resume to avoid modifying the original
    const tailoredResume: ResumeData = JSON.parse(JSON.stringify(resume));
    console.log("tailorResumeWithAI - Created deep copy of resume");

    // Step 1: Extract key requirements and skills from the job description
    console.log("tailorResumeWithAI - Analyzing job description");
    const jobAnalysis = await analyzeJobDescriptionWithWorker(jobDescription);
    console.log("tailorResumeWithAI - Job analysis complete");

    // Step 2: Enhance the professional summary
    if (tailoredResume.personalInfo) {
      console.log("tailorResumeWithAI - Enhancing professional summary");
      tailoredResume.personalInfo.summary = await enhanceWithWorker(
        'enhance-summary',
        {
          currentSummary: tailoredResume.personalInfo.summary || '',
          jobDescription,
          jobAnalysis
        },
        tailoredResume.personalInfo.summary || ''
      );
      console.log("tailorResumeWithAI - Summary enhanced");
    }

    // Step 3: Enhance work experiences to highlight relevant experience
    if (tailoredResume.workExperience && tailoredResume.workExperience.length > 0) {
      console.log("tailorResumeWithAI - Enhancing work experiences");
      tailoredResume.workExperience = await enhanceWithWorker(
        'enhance-work-experiences',
        {
          experiences: tailoredResume.workExperience,
          jobDescription,
          jobAnalysis
        },
        tailoredResume.workExperience
      );
      console.log("tailorResumeWithAI - Work experiences enhanced");
    }

    // Step 4: Enhance skills section with relevant skills from job description
    if (tailoredResume.skills) {
      console.log("tailorResumeWithAI - Enhancing skills");
      tailoredResume.skills = await enhanceWithWorker(
        'enhance-skills',
        {
          skills: tailoredResume.skills,
          jobSkills: jobAnalysis.skills,
          jobTitle: tailoredResume.personalInfo?.title || ''
        },
        tailoredResume.skills
      );
      console.log("tailorResumeWithAI - Skills enhanced");
    }

    // Step 5: Enhance projects section if available
    if (tailoredResume.projects && tailoredResume.projects.length > 0) {
      console.log("tailorResumeWithAI - Enhancing projects");
      tailoredResume.projects = await enhanceWithWorker(
        'enhance-projects',
        {
          projects: tailoredResume.projects,
          jobDescription,
          jobAnalysis
        },
        tailoredResume.projects
      );
      console.log("tailorResumeWithAI - Projects enhanced");
    }

    // Step 6: Calculate changes made to the resume
    console.log("tailorResumeWithAI - Determining changed sections");
    const changedSections = determineChangedSections(resume, tailoredResume);
    console.log("tailorResumeWithAI - Changed sections:", changedSections);

    // Step 7: Calculate keyword matches
    console.log("tailorResumeWithAI - Calculating keyword matches");
    const keywordMatches = calculateKeywordMatches(tailoredResume, jobAnalysis);
    console.log("tailorResumeWithAI - Keyword matches:", keywordMatches);

    // Check for any missing critical fields in the result
    console.log("tailorResumeWithAI - Final tailored resume structure:", {
      hasId: Boolean(tailoredResume.id),
      hasUserId: Boolean(tailoredResume.userId),
      keys: Object.keys(tailoredResume)
    });

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
 * Helper function to send requests to the OpenAI worker
 */
async function enhanceWithWorker<T>(
  taskType: string,
  data: any,
  defaultValue: T
): Promise<T> {
  try {
    const job = await openaiQueue.add(
      `resume-${taskType}`,
      {
        type: taskType,
        ...data
      },
      {
        jobId: `resume_${taskType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        removeOnComplete: true,
        removeOnFail: 1000, // Keep failed jobs for a while for debugging
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    );

    const result = await job.waitUntilFinished(openaiQueue.events);

    if (!result) {
      console.warn(`Empty result received for task: ${taskType}`);
      return defaultValue;
    }

    // If the result has an error property, log it and return the default value
    if (result.error) {
      console.error(`Error in worker for task ${taskType}:`, result.error);
      return defaultValue;
    }

    return result as T;
  } catch (error) {
    console.error(`Error in ${taskType}:`, error);
    return defaultValue;
  }
}

/**
 * Analyze job description using the worker
 */
async function analyzeJobDescriptionWithWorker(jobDescription: string): Promise<any> {
  try {
    const job = await openaiQueue.add('analyze-job-description', {
      jobDescription
    });

    const result = await job.waitUntilFinished(openaiQueue.events);
    return result || {
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
  } catch (error) {
    console.error('Error analyzing job description:', error);
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
  console.log("enhanceSummary - Starting summary enhancement");

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

    console.log("enhanceSummary - Sending request to OpenAI");

    const completion = await openaiQueue.add('enhance-summary', {
      type: 'enhance-summary',
      currentSummary,
      jobDescription,
      jobAnalysis
    });

    console.log("enhanceSummary - Received response from OpenAI");

    const enhancedSummary = (await completion.waitUntilFinished(openaiQueue.events)) || currentSummary;
    console.log("enhanceSummary - Summary length before:", currentSummary.length, "after:", enhancedSummary.length);

    return enhancedSummary;
  } catch (error) {
    console.error('Error enhancing summary:', error);
    console.log("enhanceSummary - Returning original summary due to error");
    return currentSummary;
  }
}

/**
 * Enhance work experiences to highlight relevant experience for the job
 */
async function enhanceWorkExperiences(experiences: WorkExperience[], jobDescription: string, jobAnalysis: any): Promise<WorkExperience[]> {
  console.log("enhanceWorkExperiences - Starting work experiences enhancement");
  console.log("enhanceWorkExperiences - Experiences count:", experiences.length);

  try {
    // Make a deep copy to avoid modifying the original
    const enhancedExperiences: WorkExperience[] = JSON.parse(JSON.stringify(experiences));

    // Sort experiences by recency (newest first)
    enhancedExperiences.sort((a, b) => {
      const dateA = a.endDate || a.startDate;
      const dateB = b.endDate || b.startDate;
      return dateB.localeCompare(dateA);
    });

    console.log("enhanceWorkExperiences - Sorted experiences by recency");

    // Process only the 3 most recent experiences
    const recentExperiences = enhancedExperiences.slice(0, 3);
    console.log("enhanceWorkExperiences - Processing the 3 most recent experiences");

    for (const exp of recentExperiences) {
      console.log("enhanceWorkExperiences - Enhancing experience:", exp.position, "at", exp.company);

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
        console.log("enhanceWorkExperiences - Sending request to OpenAI for experience");

        const completion = await openaiQueue.add('enhance-work-experiences', {
          type: 'enhance-work-experiences',
          experiences: enhancedExperiences,
          jobDescription,
          jobAnalysis
        });

        console.log("enhanceWorkExperiences - Received response from OpenAI for experience");

        const response = await completion.waitUntilFinished(openaiQueue.events);

        // Update the experience with the enhanced content
        exp.description = response.description || exp.description;
        exp.achievements = response.achievements || exp.achievements;

        console.log("enhanceWorkExperiences - Experience enhanced successfully");
      } catch (error) {
        console.error(`Error enhancing work experience for ${exp.position}:`, error);
        // Continue with the next experience if one fails
        console.log("enhanceWorkExperiences - Continuing with next experience due to error");
      }
    }

    return enhancedExperiences;
  } catch (error) {
    console.error('Error enhancing work experiences:', error);
    console.log("enhanceWorkExperiences - Returning original experiences due to error");
    return experiences;
  }
}

/**
 * Enhance skills section based on job requirements
 */
async function enhanceSkills(currentSkills: Skill[], jobSkills: any, jobTitle: string): Promise<Skill[]> {
  // If current skills is not an array or is empty, make sure we have a valid array to start with
  if (!Array.isArray(currentSkills) || currentSkills.length === 0) {
    console.warn('Current skills is not an array or is empty, initializing empty array');
    currentSkills = [];
  }

  console.log('enhanceSkills - OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('enhanceSkills - Current skills count:', currentSkills.length);
  console.log('enhanceSkills - Job hard skills count:', jobSkills?.hardSkills?.length || 0);
  console.log('enhanceSkills - Job soft skills count:', jobSkills?.softSkills?.length || 0);

  try {
    // Simplest possible approach: add relevant job skills to existing skills
    console.log('enhanceSkills - Using direct skills extraction approach');

    // Get existing skill names for comparison (lowercase for case-insensitive matching)
    const existingSkillNames = new Set(currentSkills.map((s: Skill) => s.name.toLowerCase()));

    // Filter out job skills that are already in the resume
    const newHardSkills = (jobSkills.hardSkills || [])
      .filter((skill: string) => !existingSkillNames.has(skill.toLowerCase()));

    const newSoftSkills = (jobSkills.softSkills || [])
      .filter((skill: string) => !existingSkillNames.has(skill.toLowerCase()));

    console.log(`enhanceSkills - Found ${newHardSkills.length} new hard skills and ${newSoftSkills.length} new soft skills`);

    // Create new skill objects
    const newSkills = [
      ...newHardSkills.map((name: string) => ({
        id: crypto.randomUUID(),
        name,
        level: "Intermediate",
        category: "Technical Skills"
      })),
      ...newSoftSkills.map((name: string) => ({
        id: crypto.randomUUID(),
        name,
        level: "Intermediate",
        category: "Soft Skills"
      }))
    ];

    // Combine existing skills with new ones
    const combinedSkills = [...currentSkills, ...newSkills];

    console.log(`enhanceSkills - Successfully added ${newSkills.length} new skills, total: ${combinedSkills.length}`);
    return combinedSkills;
  } catch (error) {
    console.error('enhanceSkills - Error enhancing skills:', error);
    return currentSkills;
  }
}

/**
 * Enhance projects section to highlight relevant projects
 */
async function enhanceProjects(projects: Project[], jobDescription: string, jobAnalysis: any): Promise<Project[]> {
  console.log("enhanceProjects - Starting projects enhancement");
  console.log("enhanceProjects - Projects count:", projects.length);

  try {
    // Make a deep copy to avoid modifying the original
    const enhancedProjects: Project[] = JSON.parse(JSON.stringify(projects));

    // Only enhance up to 2 most relevant projects
    // We'll determine relevance by matching project technologies with job required skills
    const relevanceScores = enhancedProjects.map((project: Project) => {
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

    console.log("enhanceProjects - Selected most relevant projects:", sortedProjects.map(p => p.name));

    // Enhance the most relevant projects
    for (const project of sortedProjects) {
      console.log("enhanceProjects - Enhancing project:", project.name);

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
        console.log("enhanceProjects - Sending request to OpenAI for project");

        const completion = await openaiQueue.add('enhance-projects', {
          type: 'enhance-projects',
          projects: enhancedProjects,
          jobDescription,
          jobAnalysis
        });

        console.log("enhanceProjects - Received response from OpenAI for project");

        const response = await completion.waitUntilFinished(openaiQueue.events);

        // Update the project with the enhanced content
        project.description = response.description || project.description;
        if (response.achievements && Array.isArray(response.achievements)) {
          project.achievements = response.achievements;
        }

        console.log("enhanceProjects - Project enhanced successfully");
      } catch (error) {
        console.error(`Error enhancing project ${project.name}:`, error);
        // Continue with the next project if one fails
        console.log("enhanceProjects - Continuing with next project due to error");
      }
    }

    return enhancedProjects;
  } catch (error) {
    console.error('Error enhancing projects:', error);
    console.log("enhanceProjects - Returning original projects due to error");
    return projects;
  }
}

/**
 * Determine which sections were changed between original and tailored resume
 */
function determineChangedSections(originalResume: ResumeData, tailoredResume: ResumeData): string[] {
  console.log("determineChangedSections - Identifying changed sections");

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

  console.log("determineChangedSections - Identified changed sections:", changedSections);

  return changedSections;
}

/**
 * Calculate the number of keyword matches between the resume and job requirements
 */
function calculateKeywordMatches(resume: ResumeData, jobAnalysis: any): number {
  console.log("calculateKeywordMatches - Calculating keyword matches");

  let matches = 0;
  const allJobKeywords = [
    ...(jobAnalysis.skills?.hardSkills || []),
    ...(jobAnalysis.skills?.softSkills || []),
    ...(jobAnalysis.industryTerminology || [])
  ].map((kw: string) => kw.toLowerCase());

  console.log("calculateKeywordMatches - Total job keywords:", allJobKeywords.length);

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

  console.log("calculateKeywordMatches - Resume content length:", resumeContent.length);

  // Count unique keyword matches
  const uniqueMatches = new Set<string>();

  for (const keyword of allJobKeywords) {
    if (resumeContent.includes(keyword)) {
      uniqueMatches.add(keyword);
    }
  }

  console.log("calculateKeywordMatches - Unique keyword matches:", uniqueMatches.size);
  return uniqueMatches.size;
}