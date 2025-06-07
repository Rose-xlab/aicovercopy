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
    console.log('Generating cover letter for job:', data);

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

// Create worker
const worker = new Worker(
    'openai-requests',
    async job => {
        try {
            console.log('inside the worker', job.name, job.data.name)
            switch (job.data.name) {
                case 'parse-resume':
                    return await parseResumeJob(job.data.data);
                case 'generate-cover-letter':
                    return await generateCoverLetterJob(job.data.data); // Notice we're accessing job.data.data
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