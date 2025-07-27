//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\workers\openaiWorker.ts

import 'dotenv/config'; // Ensure .env is loaded
import { Worker, Queue } from 'bullmq';
import redisConnection from '../lib/redis.js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Ensure environment variables are loaded
if (!process.env.OPENAI_API_KEY) {
    console.error('CRITICAL: OPENAI_API_KEY is not set');
    console.error('Current working directory:', process.cwd());
    console.error('Attempted to load .env from:', require.resolve('dotenv/config'));
    process.exit(1);
}

// Create OpenAI instance
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create queue
new Queue('openai-requests', { connection: redisConnection });

async function parseResumeJob(data: any) {
    const {
        textContent,
        requestId,
        systemPrompt,
        userPrompt,
        fileStructure,
        fileName
    } = data;

    // Call OpenAI to parse the resume
    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const responseContent = completion.choices[0].message?.content || '{}';
    let parsedData: any = {};
    try {
        parsedData = JSON.parse(responseContent);
        console.log(`[${requestId}] Successfully parsed resume data from AI response`);
    } catch (jsonError) {
        console.error(`[${requestId}] Error parsing JSON response from OpenAI:`, jsonError);
        throw new Error('Could not parse resume into structured data');
    }

    // Ensure all items in arrays have valid UUIDs
    const addUuids = (items: any[]) => items?.map((item: any) => ({
        ...item,
        id: item.id || uuidv4()
    })) || [];

    // Apply UUIDs to various sections
    ['workExperience', 'education', 'skills', 'projects',
        'certifications', 'languages', 'references',
        'internships', 'interests', 'customSections'].forEach(section => {
            if (parsedData[section]) {
                parsedData[section] = addUuids(parsedData[section]);
            }
        });

    // Generate a title for the resume
    const firstName = parsedData.personalInfo?.firstName || '';
    const lastName = parsedData.personalInfo?.lastName || '';
    const jobTitle = parsedData.personalInfo?.title || '';

    parsedData.title = firstName && lastName
        ? `${firstName} ${lastName}${jobTitle ? ` - ${jobTitle}` : ''} Resume`
        : `${fileName.split('.')[0] || 'Imported'} Resume`;

    // Apply defaults for missing sections
    parsedData.references = parsedData.references || [];
    parsedData.referenceStatement = parsedData.referenceStatement || "References available upon request";
    parsedData.internships = parsedData.internships || [];
    parsedData.interests = parsedData.interests || [];
    parsedData.customSections = parsedData.customSections || [];

    console.log(`[${requestId}] Resume data processing complete`, parsedData);
    return parsedData;
}

// --- *** THIS IS THE ONLY FUNCTION THAT HAS BEEN MODIFIED *** ---
async function generateCoverLetterJob(data: any) {
    try {
      const {
        jobDescription,
        userProfile,
        tone = 'professional',
        userId,
        coverLetterId,
        metadata = {},
      } = data;
  
      // The AI's first task is to extract structured data.
      const systemPrompt = `You are an expert job application assistant. Your tasks are:
  1.  Analyze the provided job description to accurately extract the specific 'jobTitle' and the 'companyName'.
  2.  Using the extracted details and the user's profile, write a compelling, professional cover letter.
  3.  You MUST return the result as a single, valid JSON object with three keys: "jobTitle" (string), "companyName" (string), and "content" (string).`;
  
      // The user prompt now focuses on providing the necessary data.
      const userPrompt = `
          Job Description:
          ---
          ${jobDescription}
          ---
  
          User's Profile / Resume Context:
          ---
          ${JSON.stringify(userProfile, null, 2)}
          ---
  
          Tone to use for the cover letter: ${tone}
          `;
  
      // Generate the structured JSON response from OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo', // Updated model for better JSON handling
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }, // Enforce JSON output
      });
  
      const responseContent = completion.choices[0]?.message?.content?.trim();
      if (!responseContent) {
        throw new Error('OpenAI returned an empty response.');
      }
  
      // Safely parse the JSON response from the AI
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (e) {
        console.error('Failed to parse JSON from OpenAI:', responseContent);
        throw new Error('AI did not return a valid JSON object.');
      }
  
      // Validate the parsed data has the fields we need
      const { jobTitle, companyName, content } = parsedResponse;
      if (!jobTitle || !companyName || !content || content.length < 100) {
        throw new Error('Generated response is missing required fields or content is too short.');
      }
  
      // Return the structured result, now with all three key pieces of data
      return {
        success: true,
        data: {
          id: coverLetterId,
          content: content,
          jobTitle: jobTitle,
          companyName: companyName,
          metadata: {
            ...metadata,
            generatedAt: new Date().toISOString(),
            userId,
            model: completion.model,
            usage: completion.usage,
          },
        },
      };
    } catch (error) {
      console.error('Error in cover letter generation:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate cover letter',
          details: error instanceof Error ? error.stack : String(error),
        },
        data: null,
      };
    }
  }

// --- NO CHANGES TO THE FUNCTIONS BELOW THIS LINE ---

async function tailorResumeJob(data: any) {
    const {
        resume,
        jobDescription,
        requestId = uuidv4()
    } = data;

    console.log(`[${requestId}] Starting resume tailoring for job description`);

    try {
        // Step 1: Analyze job description
        console.log(`[${requestId}] Analyzing job description`);
        const jobAnalysis = await analyzeJobDescription(jobDescription, requestId);

        // Step 2: Enhance the resume sections
        const tailoredResume = { ...resume };

        // Enhance summary
        if (tailoredResume.personalInfo?.summary) {
            console.log(`[${requestId}] Enhancing summary`);
            tailoredResume.personalInfo.summary = await enhanceSummary(
                tailoredResume.personalInfo.summary,
                jobDescription,
                jobAnalysis,
                requestId
            );
        }

        // Enhance work experiences
        if (tailoredResume.workExperience?.length) {
            console.log(`[${requestId}] Enhancing work experiences`);
            tailoredResume.workExperience = await enhanceWorkExperiences(
                tailoredResume.workExperience,
                jobDescription,
                jobAnalysis,
                requestId
            );
        }

        // Enhance skills
        if (tailoredResume.skills?.length) {
            console.log(`[${requestId}] Enhancing skills`);
            tailoredResume.skills = await enhanceSkills(
                tailoredResume.skills,
                jobAnalysis.skills,
                tailoredResume.personalInfo?.title || '',
                requestId
            );
        }

        // Enhance projects
        if (tailoredResume.projects?.length) {
            console.log(`[${requestId}] Enhancing projects`);
            tailoredResume.projects = await enhanceProjects(
                tailoredResume.projects,
                jobDescription,
                jobAnalysis,
                requestId
            );
        }

        // Calculate changes and keyword matches
        const changedSections = determineChangedSections(resume, tailoredResume);
        const keywordMatches = calculateKeywordMatches(tailoredResume, jobAnalysis);

        console.log(`[${requestId}] Resume tailoring completed successfully`);

        return {
            success: true,
            data: {
                tailoredResume,
                changedSections,
                keywordMatches
            }
        };

    } catch (error) {
        console.error(`[${requestId}] Error in resume tailoring:`, error);
        throw error;
    }
}

// Helper functions for resume tailoring
async function analyzeJobDescription(jobDescription: string, requestId: string) {
    const systemPrompt = `You are an expert job analyzer with deep knowledge of ATS (Applicant Tracking Systems).
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
    }`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this job description:\n\n${jobDescription}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
}

async function enhanceSummary(currentSummary: string, jobDescription: string, jobAnalysis: any, requestId: string) {
    const systemPrompt = `You are an expert resume writer specializing in crafting powerful professional summaries.
    Your task is to enhance the existing professional summary to better target the specific job description.`;

    const userPrompt = `Job Description:\n${jobDescription}\n\nKey Job Requirements:\nHard Skills: ${jobAnalysis.skills.hardSkills.join(', ')}\nSoft Skills: ${jobAnalysis.skills.softSkills.join(', ')}\n\nCurrent Summary:\n${currentSummary}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.7
    });

    return completion.choices[0].message.content?.trim() || currentSummary;
}

async function enhanceWorkExperiences(experiences: any[], jobDescription: string, jobAnalysis: any, requestId: string) {
    const enhanced = [...experiences];

    for (let i = 0; i < Math.min(enhanced.length, 3); i++) {
        const exp = enhanced[i];
        const systemPrompt = `You are an expert resume writer. Enhance this work experience to better match the job description.`;
        const userPrompt = `Job Description:\n${jobDescription}\n\nWork Experience to Enhance:\n${JSON.stringify(exp, null, 2)}`;

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

            const enhancedExp = JSON.parse(completion.choices[0].message.content || '{}');
            enhanced[i] = { ...exp, ...enhancedExp };
        } catch (error) {
            console.error(`[${requestId}] Error enhancing work experience:`, error);
        }
    }

    return enhanced;
}

async function enhanceSkills(currentSkills: any[], jobSkills: any, jobTitle: string, requestId: string) {
    const existingSkills = new Set(currentSkills.map((s: any) => s.name.toLowerCase()));

    const newSkills = [
        ...(jobSkills.hardSkills || []).filter((s: string) => !existingSkills.has(s.toLowerCase()))
            .map((name: string) => ({
                id: uuidv4(),
                name,
                level: "Intermediate",
                category: "Technical Skills"
            })),
        ...(jobSkills.softSkills || []).filter((s: string) => !existingSkills.has(s.toLowerCase()))
            .map((name: string) => ({
                id: uuidv4(),
                name,
                level: "Intermediate",
                category: "Soft Skills"
            }))
    ];

    return [...currentSkills, ...newSkills];
}

async function enhanceProjects(projects: any[], jobDescription: string, jobAnalysis: any, requestId: string) {
    const enhanced = [...projects];

    for (let i = 0; i < Math.min(enhanced.length, 2); i++) {
        const proj = enhanced[i];
        const systemPrompt = `You are an expert resume writer. Enhance this project to better match the job description.`;
        const userPrompt = `Job Description:\n${jobDescription}\n\nProject to Enhance:\n${JSON.stringify(proj, null, 2)}`;

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

            const enhancedProj = JSON.parse(completion.choices[0].message.content || '{}');
            enhanced[i] = { ...proj, ...enhancedProj };
        } catch (error) {
            console.error(`[${requestId}] Error enhancing project:`, error);
        }
    }

    return enhanced;
}

function determineChangedSections(original: any, tailored: any) {
    const changes: string[] = [];
    if (JSON.stringify(original.personalInfo) !== JSON.stringify(tailored.personalInfo)) changes.push('personalInfo');
    if (JSON.stringify(original.workExperience) !== JSON.stringify(tailored.workExperience)) changes.push('workExperience');
    if (JSON.stringify(original.skills) !== JSON.stringify(tailored.skills)) changes.push('skills');
    if (JSON.stringify(original.projects) !== JSON.stringify(tailored.projects)) changes.push('projects');
    return changes;
}

function calculateKeywordMatches(resume: any, jobAnalysis: any) {
    const resumeText = JSON.stringify(resume).toLowerCase();
    const keywords = [
        ...(jobAnalysis.skills?.hardSkills || []),
        ...(jobAnalysis.skills?.softSkills || []),
        ...(jobAnalysis.industryTerminology || [])
    ].map(k => k.toLowerCase());

    return keywords.filter(kw => resumeText.includes(kw)).length;
}

const worker = new Worker(
    'openai-requests',
    async job => {
        try {
            console.log('Processing job:', job.name, job.data.name);
            switch (job.data.name) {
                case 'parse-resume':
                    return await parseResumeJob(job.data.data);
                case 'generate-cover-letter':
                    return await generateCoverLetterJob(job.data.data);
                case 'tailor-resume':
                    return await tailorResumeJob(job.data.data);
                default:
                    throw new Error(`Unknown job type: ${job.name}`);
            }
        } catch (error) {
            console.error('Job processing error:', error);
            throw error;
        }
    },
    { connection: redisConnection }
);

worker.on('completed', job => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

console.log('OpenAI Worker initialized successfully');

export default worker;