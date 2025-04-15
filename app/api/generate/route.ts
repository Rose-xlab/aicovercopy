// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import openai from '@/lib/openai';
import { LinkedInCoverLetterData } from '@/lib/linkedInCoverLetterTransformer';
import { Database } from '@/types/supabase';

// Define expected structures for payload
type DbResume = Database['public']['Tables']['resumes']['Row'];
type CvFile = { id?: string; name?: string; content?: string; };
type ResumeDataFromFrontend = DbResume | CvFile | null;

interface UserProfilePayload {
    linkedin?: LinkedInCoverLetterData | null;
    resume?: ResumeDataFromFrontend | null;
    cv?: CvFile | null;
    keyAttributes?: any;
}

// Define expected types for loop parameters within prompt builder
interface ExperiencePromptItem { role?: string; company?: string; highlights?: string[]; }
interface EducationPromptItem { degree?: string; school?: string; fieldOfStudy?: string; }

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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
        console.log(`Generating cover letter. Data Source: ${dataSource}`);
        let prompt = `Create a targeted cover letter for this specific job opportunity:\n\n`;
        
        // Job details section
        prompt += `## JOB DETAILS ##\n`;
        if (jobTitle) prompt += `Position: ${jobTitle}\n`;
        if (companyName) prompt += `Company: ${companyName}\n`;
        prompt += `\nJob Description:\n${jobDescription}\n\n`;

        // Candidate information section
        prompt += `## CANDIDATE INFORMATION ##\n`;

        // ** Include LinkedIn Data **
        if (userProfile?.linkedin && (dataSource === 'linkedin' || dataSource === 'both')) {
            const li: LinkedInCoverLetterData | null = userProfile.linkedin;
            console.log("Including LinkedIn data in prompt...");
            
            // Basic Information
            if (li.name) prompt += `Full Name: ${li.name}\n`;
            if (li.title) prompt += `Current Title: ${li.title}\n`;
            if (li.currentCompany) prompt += `Current Company: ${li.currentCompany}\n`;
            if (li.yearsOfExperience > 0) prompt += `Years of Experience: ${li.yearsOfExperience}\n`;
            if (li.summary) prompt += `Professional Summary: ${li.summary}\n\n`;
            
            // Skills Section (essential for skill matching)
            if (li.topSkills?.length > 0) {
                prompt += `Skills: ${li.topSkills.join(', ')}\n\n`;
            }

            // Work Experience (detailed, with all highlights)
            if (li.relevantExperience?.length > 0) {
                prompt += `## WORK EXPERIENCE ##\n`;
                li.relevantExperience.forEach((exp: ExperiencePromptItem, index: number) => {
                    prompt += `Position ${index + 1}: ${exp.role || 'N/A'} at ${exp.company || 'N/A'}\n`;
                    
                    // Include ALL highlights to give the AI more material to work with
                    if (Array.isArray(exp.highlights) && exp.highlights.length > 0) {
                        prompt += `Achievements/Responsibilities:\n`;
                        exp.highlights.forEach((hl: string) => {
                            prompt += `- ${hl}\n`;
                        });
                    }
                    prompt += '\n';
                });
            }
            
            // Education (might be relevant for matching qualifications)
            if (li.education?.length > 0) {
                prompt += `## EDUCATION ##\n`;
                li.education.forEach((edu: EducationPromptItem) => {
                    prompt += `- ${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'N/A'} from ${edu.school || 'N/A'}\n`;
                });
                prompt += '\n';
            }
            
            // Additional qualifications that might be relevant
            if (li.accomplishments?.length > 0) {
                prompt += `## KEY ACCOMPLISHMENTS ##\n`;
                li.accomplishments.forEach((accomplishment: string) => {
                    prompt += `- ${accomplishment}\n`;
                });
                prompt += '\n';
            }
            
            // Languages (especially relevant for international roles)
            if (li.languages?.length > 0) {
                prompt += `Languages: ${li.languages.join(', ')}\n`;
            }
            
            // Certifications (important for many technical/professional roles)
            if (li.certifications?.length > 0) {
                prompt += `## CERTIFICATIONS ##\n`;
                li.certifications.forEach((cert: string) => {
                    prompt += `- ${cert}\n`;
                });
                prompt += '\n';
            }
        }

        // ** Include Resume/CV Data if available **
        if (userProfile?.resume && (dataSource === 'cv' || dataSource === 'linkedin' || dataSource === 'both')) {
            console.log("Including Resume/CV data in prompt...");
            prompt += `## ADDITIONAL RESUME DATA ##\n`;
            // Extract resume data here - this is placeholder for now
            const resume = userProfile.resume;
            if (resume && 'personal_info' in resume) {
                const personalInfo = resume.personal_info;
                if (personalInfo && typeof personalInfo === 'object') {
                    // Extract and format relevant resume data
                    prompt += `Additional resume information available but not parsed in this version.\n\n`;
                }
            }
        } else if (userProfile?.cv && (dataSource === 'cv' || dataSource === 'both')) {
            console.log("Including CV file data in prompt...");
            prompt += `CV Filename: ${(userProfile.cv as CvFile).name || 'Unnamed CV'}\n\n`;
            // CV content parsing would go here
        }

        // --- Detailed Instructions for AI ---
        prompt += `## INSTRUCTIONS ##\n\n`;
        
        // General structure guidelines
        prompt += `1. Create a professional cover letter that follows this structure:
   - Professional greeting (To the Hiring Manager or addressee name if known)
   - Opening paragraph: Specify the position, express interest, and provide a brief value proposition
   - Body paragraphs (2-3): Highlight specific, relevant experience and skills that match the job requirements
   - Closing paragraph: Express enthusiasm, include a call to action, and thank them for their consideration
   - Professional sign-off (e.g., "Sincerely,") followed by the candidate's name

2. Ensure the letter is tailored to this specific job by:
   - Analyzing the job description to identify 3-5 key requirements or qualifications
   - Finding matching skills, experience, or achievements from the candidate's profile
   - Using the candidate's actual experience - don't invent or assume qualifications not listed
   - Addressing specific company needs mentioned in the job description

3. Make the letter impactful by:
   - Using specific examples with measurable results or achievements where possible
   - Demonstrating knowledge of the company/industry based on the job description
   - Using strong action verbs and concrete language
   - Avoiding generic phrases and clichés
   - Using a ${tone} tone throughout

4. Keep the length concise - 350-450 words total (3-4 paragraphs).

5. Focus on what value the candidate would bring to the organization rather than what they hope to gain.

`;

        // Custom instructions based on the data source
        if (dataSource === 'linkedin') {
            prompt += `6. Since you're working with LinkedIn data, emphasize:
   - Professional connections or network relevance to the industry
   - Specific projects or achievements mentioned in the experience section
   - Skills that directly align with the job requirements
   - Certifications or formal qualifications relevant to the role
`;
        } else if (dataSource === 'cv') {
            prompt += `6. Since you're working with CV data, emphasize:
   - Technical skills and qualifications
   - Detailed work experience relevant to the position
   - Educational background if particularly relevant to the role
`;
        } else if (dataSource === 'both') {
            prompt += `6. Since you have both LinkedIn and CV data, create a comprehensive picture by:
   - Using LinkedIn information for professional narrative and industry connections
   - Using CV details for specific technical qualifications and formal experience
   - Ensuring all highlighted qualifications appear in at least one of the data sources
`;
        }

        // Regeneration-specific instructions
        if (regenerate) {
            prompt += `\n7. This is a regeneration request. Create an alternative version of the cover letter that:
   - Uses different phrasing and structure while maintaining accuracy
   - Emphasizes different yet equally relevant aspects of the candidate's experience
   - Has a slightly ${tone === 'professional' ? 'more conversational' : 'more formal'} tone
   - Maintains the same level of personalization and relevance to the job\n`;
        }

        // --- Call OpenAI ---
        console.log("Sending prompt to OpenAI...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4", // Ensure this model is available/correct
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: regenerate ? 0.8 : 0.7,
            max_tokens: 1000,
        });
        const coverLetter = completion.choices[0].message.content;
        console.log("Received response from OpenAI.");
        if (!coverLetter) { throw new Error("OpenAI returned an empty response."); }

        // --- Save to DB ---
        const sourceRecordId = userProfile?.resume?.id || (userProfile?.cv as CvFile)?.id || null;
        const sourceLinkedInDbId = userProfile?.linkedin?.id || null;

        console.log(`Saving cover letter. Source type: ${dataSource}, Source record ID: ${sourceRecordId}`);
        const { error: insertError } = await supabase.from('cover_letters').insert({
            user_id: session.user.id, 
            job_description: jobDescription, 
            job_title: jobTitle, // Fix key name to match database field
            company_name: companyName, 
            content: coverLetter, 
            tone: tone,
            data_source: dataSource, 
            created_at: new Date().toISOString(), 
            status: 'draft',
            resume_id: sourceRecordId,
            metadata: sourceLinkedInDbId ? { source_linkedin_profile_id: sourceLinkedInDbId } : null
        });

        if (insertError) {
            console.error("Error saving cover letter to DB:", insertError);
        } else {
            console.log("Cover letter saved to database.");
        }

        return NextResponse.json({ coverLetter });

    } catch (error: any) {
        console.error('Error generating cover letter:', error);
        return NextResponse.json({ error: 'Failed to generate cover letter: ' + error.message }, { status: 500 });
    }
}