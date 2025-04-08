// workers/openaiWorker.ts
import 'dotenv/config';  // Ensure .env is loaded
import { Worker, Queue } from 'bullmq';
import redisConnection from '../lib/redis.js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';



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

    console.log(`[${requestId}] Sending ${textContent.length} chars to OpenAI for parsing`);

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

    console.log(`[${requestId}] Resume data processing complete`);
    return parsedData;
}

async function generateCoverLetterJob(data: any) {
    // Placeholder for future cover letter generation job
    console.log('Generating cover letter', data);
    return { status: 'not implemented' };
}

// Create worker
const worker = new Worker(
    'openai-requests',
    async job => {
        try {
            switch (job.name) {
                case 'parse-resume':
                    return await parseResumeJob(job.data);
                case 'generate-cover-letter':
                    return await generateCoverLetterJob(job.data);
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
