// workers/openaiWorker.ts
import 'dotenv/config';  // Ensure .env is loaded
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


    // console.log(`[${requestId}] Sending ${textContent.length} chars to OpenAI for parsing`);

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

async function generateCoverLetterJob(data: any) {

    try {
        // Destructure job data
        const {
            jobTitle,
            companyName,
            jobDescription,
            userProfile,
            tone = 'professional',
            userId,
            coverLetterId,
            metadata = {}
        } = data;


        // Validate required fields
        if (!jobTitle && !companyName) {
            throw new Error('Job title or company name is required');
        }

        // Prepare comprehensive prompt for cover letter generation
        const prompt = `
            Write a professional cover letter with the following details:
            1. Job Title: ${jobTitle || 'Not specified'}
            2. Company: ${companyName || 'Not specified'}
            3. Tone: ${tone}
            4. Use the following resume context: ${JSON.stringify(userProfile, null, 2)}
            5. Follow standard business letter format
            ${jobDescription ? '6. Specifically address the requirements and skills mentioned in the job posting' : ''}

            Additional Context:
            Job Description: ${jobDescription || 'Not provided'}

            Guidelines:
            - Be formal and professional
            - Highlight relevant experience and skills
            - Show genuine enthusiasm for the position
            - Demonstrate clear understanding of the role
            - Align personal achievements with job requirements
        `;

        // Generate cover letter using OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are an expert cover letter writer with deep knowledge of the job market and business culture. Craft compelling, personalized cover letters that highlight the candidate's strengths."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        // Extract and validate cover letter content
        const coverLetter = completion.choices[0]?.message?.content?.trim();

        if (!coverLetter || coverLetter.length < 100) {
            throw new Error('Generated cover letter is too short or invalid');
        }


        // Return structured result
        return {
            success: true,
            data: {
                id: coverLetterId,
                content: coverLetter,
                metadata: {
                    ...metadata,
                    jobTitle,
                    companyName,
                    generatedAt: new Date().toISOString(),
                    userId,
                    model: completion.model,
                    usage: completion.usage
                }
            }
        };

    } catch (error) {
        console.error('Error in cover letter generation:', error);

        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to generate cover letter',
                details: error instanceof Error ? error.stack : String(error),
                timestamp: new Date().toISOString()
            },
            data: null
        };
    }
}

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
    // Simple enhancement: add missing job skills
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

    if (JSON.stringify(original.personalInfo) !== JSON.stringify(tailored.personalInfo)) {
        changes.push('personalInfo');
    }
    if (JSON.stringify(original.workExperience) !== JSON.stringify(tailored.workExperience)) {
        changes.push('workExperience');
    }
    if (JSON.stringify(original.skills) !== JSON.stringify(tailored.skills)) {
        changes.push('skills');
    }
    if (JSON.stringify(original.projects) !== JSON.stringify(tailored.projects)) {
        changes.push('projects');
    }

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

// Create worker
const worker = new Worker(
    'openai-requests',
    async job => {
        try {
            console.log('Processing job:',job.name, job.data.name);
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

// Add event listeners
worker.on('completed', job => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

console.log('OpenAI Worker initialized successfully');

export default worker;