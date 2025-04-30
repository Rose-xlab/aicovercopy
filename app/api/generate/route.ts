// File: app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import openai from '@/lib/openai';
import { LinkedInCoverLetterData } from '@/lib/linkedInCoverLetterTransformer'; // Assuming this type exists
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic'; // Keep if needed

// Define expected structures for payload (ensure consistency)
type DbResume = Database['public']['Tables']['resumes']['Row'];
interface CvFile { id?: string; name?: string; content?: string; }
type ResumeDataFromFrontend = DbResume | CvFile | null;

// This interface should match the output of 'prepareUserProfilePayload'
interface UserProfilePayload {
    name?: string; title?: string; summary?: string; currentRole?: string;
    currentCompany?: string; yearsOfExperience?: number; skills?: string[];
    experience?: { role?: string; company?: string; highlights?: string[] }[];
    education?: { degree?: string; school?: string; fieldOfStudy?: string }[];
    accomplishments?: string[]; cvFilename?: string; linkedInProfileUrl?: string | null;
    // Add any other fields prepareUserProfilePayload might include
    // Based on previous context, it might also include these top-level keys:
    linkedin?: LinkedInCoverLetterData | null;
    resume?: ResumeDataFromFrontend | null; // DbResume | CvFile | null
    cv?: CvFile | null;
    keyAttributes?: any; // Use a more specific type if possible
    id?: string; // From LinkedInCoverLetterData or CvFile?
}

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        // Use Database type for stricter client typing
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

        const {
            jobDescription, jobTitle, companyName, userProfile,
            tone = 'professional', regenerate = false, dataSource = 'none'
        }: {
            jobDescription: string; jobTitle?: string; companyName?: string;
            userProfile: UserProfilePayload; tone?: string; regenerate?: boolean;
            dataSource: 'cv' | 'linkedin' | 'both' | 'none';
        } = await request.json();

        if (!jobDescription) { return NextResponse.json({ error: 'Job description is required' }, { status: 400 }); }

        // --- Build System Message ---
        const systemMessage = `You are an expert cover letter writer who creates highly tailored, compelling cover letters based on a candidate's actual qualifications.

Your cover letters will:
- Be highly personalized for the specific job position
- Only use information that is provided about the candidate (never invent or assume qualifications)
- Match the candidate's skills and experience directly to the job requirements
- Highlight concrete, specific accomplishments with measurable results when available
- Use a ${tone} tone throughout the letter
- Follow proper business letter format with a greeting, 3-4 informative paragraphs, and a confident closing
- Be concise (about 350-450 words total)
- Demonstrate knowledge of the company/industry when possible based on the job description
- Avoid clichés, generic statements, and fluff content
- Focus on what value the candidate can bring to the company

Remember that your goal is to effectively market the candidate's actual achievements and qualifications in a way that shows they are a perfect match for this specific job.`;

        // --- Prompt Building for User Message ---
        // (Build the prompt based on job details and the received userProfile payload)
        console.log(`Generating cover letter. Data Source: ${dataSource}`);
        let prompt = `Create a targeted cover letter for this specific job opportunity:\n\n`;

        // Job details section
        prompt += `## JOB DETAILS ##\n`;
        if (jobTitle) prompt += `Position: ${jobTitle}\n`;
        if (companyName) prompt += `Company: ${companyName}\n`;
        prompt += `\nJob Description:\n${jobDescription}\n\n`;

        // Candidate information section - Use the already prepared payload
        prompt += `## CANDIDATE INFORMATION ##\n`;
        if (userProfile) {
             if (userProfile.name) prompt += `Full Name: ${userProfile.name}\n`;
             if (userProfile.title) prompt += `Current Title: ${userProfile.title}\n`;
             if (userProfile.currentCompany) prompt += `Current Company: ${userProfile.currentCompany}\n`;
             if (userProfile.yearsOfExperience && userProfile.yearsOfExperience > 0) prompt += `Years of Experience: ${userProfile.yearsOfExperience}\n`;
             if (userProfile.summary) prompt += `Professional Summary: ${userProfile.summary}\n\n`;
             if (userProfile.skills && userProfile.skills.length > 0) prompt += `Skills: ${userProfile.skills.join(', ')}\n\n`;
             if (userProfile.experience && userProfile.experience.length > 0) {
                prompt += `## WORK EXPERIENCE ##\n`;
                userProfile.experience.forEach((exp, index) => {
                    prompt += `Position ${index + 1}: ${exp.role || 'N/A'} at ${exp.company || 'N/A'}\n`;
                    if (exp.highlights && exp.highlights.length > 0) {
                        prompt += `Achievements/Responsibilities:\n`;
                        exp.highlights.forEach(hl => { prompt += `- ${hl}\n`; });
                    }
                    prompt += '\n';
                });
             }
             if (userProfile.education && userProfile.education.length > 0) {
                 prompt += `## EDUCATION ##\n`;
                 userProfile.education.forEach(edu => {
                    prompt += `- ${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'N/A'} from ${edu.school || 'N/A'}\n`;
                 });
                 prompt += '\n';
             }
            if (userProfile.accomplishments && userProfile.accomplishments.length > 0) {
                prompt += `## KEY ACCOMPLISHMENTS ##\n`;
                userProfile.accomplishments.forEach(acc => { prompt += `- ${acc}\n`; });
                prompt += '\n';
            }
            // Add any other relevant fields from userProfile if needed for the prompt
        } else {
            prompt += "No specific candidate profile data provided.\n\n";
        }

        // --- Detailed Instructions for AI ---
        prompt += `## INSTRUCTIONS ##\n\n`;
        prompt += `1. Create a professional cover letter following business letter format...\n`; // Keep existing detailed instructions
        prompt += `2. Ensure the letter is tailored...\n`;
        prompt += `3. Make the letter impactful...\n`;
        prompt += `4. Keep the length concise...\n`;
        prompt += `5. Focus on value...\n`;
        // Add source-specific or regeneration instructions as needed
         if (dataSource === 'linkedin') {
             prompt += `6. Emphasize LinkedIn specific data points...\n`;
         } else if (dataSource === 'cv') {
              prompt += `6. Emphasize CV specific data points...\n`;
         } else if (dataSource === 'both') {
             prompt += `6. Synthesize information from both LinkedIn and CV...\n`;
         }
         if (regenerate) {
             prompt += `\n7. This is a regeneration request...\n`;
         }

        // --- Call OpenAI ---
        console.log("Sending prompt to OpenAI...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4", // Or your preferred model
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: regenerate ? 0.8 : 0.7,
            max_tokens: 1000, // Adjust as needed
        });
        const coverLetter = completion.choices[0].message.content;
        console.log("Received response from OpenAI.");
        if (!coverLetter) { throw new Error("OpenAI returned an empty response."); }

        // --- SAVE LOGIC REMOVED ---
        // Database insert is now handled by a separate API endpoint

        // --- Return ONLY the generated content ---
        return NextResponse.json({ coverLetter });

    } catch (error: any) {
        console.error('Error in /api/generate:', error);
        return NextResponse.json({ error: 'Failed to generate cover letter: ' + error.message }, { status: 500 });
    }
}