// lib/resumeUtils.ts
import { SupabaseClient } from '@supabase/supabase-js'; // Or use your specific generated client type
import { v4 as uuidv4 } from 'uuid';
import openai from '@/lib/openai'; // Assuming openai client is here
import { Database } from '@/types/supabase'; // Assuming your generated types are here

// Define the types based on your regenerated Database types
type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];
type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
type Json = Database['public']['Tables']['linkedin_profiles']['Row']['education_json']; // Example to get Json type

/**
 * Enhances LinkedIn data for better resume generation using AI
 */
async function enhanceProfileWithAI(profileData: LinkedInProfile): Promise<LinkedInProfile> {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.log("No OpenAI API key, skipping profile enhancement");
            return profileData;
        }

        // Filter profileData to only include relevant fields for the prompt to save tokens
        const relevantData = {
            name: profileData.name,
            headline: profileData.headline,
            summary: profileData.summary,
            experience_json: Array.isArray(profileData.experience_json) ? profileData.experience_json : [],
            skills_json: Array.isArray(profileData.skills_json) ? profileData.skills_json : [],
        };

        const prompt = `
      I have LinkedIn profile data that I'd like to enhance for a professional resume. Please help me improve the content by:

      1. Enhancing the professional summary (currently: "${relevantData.summary || 'None'}") to be more impactful and focused on achievements (max 150 words).
      2. Improving each work experience description in experience_json to highlight accomplishments and measurable results using bullet points (start each bullet with - ). Keep existing structure.
      3. Ensure all text is professional, concise language appropriate for a resume.

      LinkedIn data excerpt:
      ${JSON.stringify(relevantData, null, 2)}

      Return ONLY a JSON object containing ONLY the enhanced 'summary' (string) and 'experience_json' (array) fields. If a field isn't enhanced, omit it.
      Example Response: {"summary": "Enhanced summary...", "experience_json": [{...enhanced_exp1...}, {...enhanced_exp2...}]}
      `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Or your preferred model
            messages: [
                {
                    role: "system",
                    content: "You are a professional resume writer specializing in transforming LinkedIn profiles into high-impact resumes. Enhance provided text for resume use. Return ONLY a JSON object with 'summary' and/or 'experience_json' fields containing ONLY the enhanced text/objects."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        if (!completion.choices[0].message.content) {
             console.log("AI enhancement returned empty content.");
             return profileData;
        }

        const enhancedContent = JSON.parse(completion.choices[0].message.content);

        // Merge enhanced content carefully
        const mergedProfile = { ...profileData }; // Start with the original profile

        if (enhancedContent.summary && typeof enhancedContent.summary === 'string') {
            mergedProfile.summary = enhancedContent.summary;
            console.log("AI Enhanced Summary applied.");
        }

        if (enhancedContent.experience_json && Array.isArray(enhancedContent.experience_json)) {
            // Ensure original experience_json is an array before merging
            const originalExperiences = Array.isArray(profileData.experience_json) ? profileData.experience_json : [];
            // Create a map for efficient lookup if original experiences have unique IDs
             const originalExperiencesMap = new Map(originalExperiences.filter((exp: any) => exp.id).map((exp: any) => [exp.id, exp]));

            const updatedExperienceJson = originalExperiences.map((originalExp: any) => {
                // Find corresponding enhanced experience (assuming IDs match or order matches)
                 // Let's assume order matches for simplicity if IDs aren't reliable/present
                 const enhancedExp = enhancedContent.experience_json.find((eExp: any) => eExp.id === originalExp.id); // Match by ID if possible

                 if (enhancedExp) {
                     return {
                         ...originalExp, // Keep original structure and dates
                         description: enhancedExp.description || originalExp.description, // Use enhanced description if provided
                         // Assuming AI might return achievements in the description or a separate field
                          achievements: enhancedExp.achievements || originalExp.achievements || []
                     };
                 }
                 return originalExp; // Return original if no enhancement found
            });

            mergedProfile.experience_json = updatedExperienceJson;
            console.log("AI Enhanced Experience applied.");
        } else {
             // Ensure experience_json is at least an empty array if null initially
             if (!Array.isArray(mergedProfile.experience_json)) {
                 mergedProfile.experience_json = [];
             }
        }

        return mergedProfile;
    } catch (error) {
        console.error("Error enhancing profile with AI:", error);
        return profileData; // Return original data on error
    }
}

/**
 * Get the default template ID to use for a new resume
 */
async function getDefaultTemplateId(supabase: SupabaseClient<Database>): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('resume_templates')
            .select('id')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error fetching default template:", error);
            return null;
        }
        return data ? data.id : null;
    } catch (error) {
        console.error("Error getting default template ID:", error);
        return null;
    }
}

/**
 * Generate achievement statements for work experiences (if needed)
 */
async function generateAchievements(experience: any): Promise<string[]> {
     // Only generate if OpenAI key exists and description is present
    if (!process.env.OPENAI_API_KEY || !experience?.description) {
        return [];
    }
    // Avoid generating if achievements already seem present
     if (Array.isArray(experience.achievements) && experience.achievements.length > 0) {
         return experience.achievements;
     }

    try {
        const prompt = `
      Based on the following job description/duties for a "${experience.title || 'role'}" at "${experience.company || 'a company'}", generate 3 concise, impressive, and quantifiable (where possible) achievement statements suitable for a resume. Start each statement with an action verb. Format as a JSON array of strings.

      Job Description/Duties:
      ${experience.description}

      Example format: ["Managed a team of 5 engineers...", "Increased sales by 15%...", "Developed a new feature..."]
      Return ONLY the JSON array.
      `;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Cheaper model for this task
            messages: [
                {
                    role: "system",
                    content: "You are a professional resume writer creating achievement bullet points from job descriptions. Focus on action verbs and quantifiable results. Return ONLY a JSON array of strings."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.6,
             max_tokens: 150,
             response_format: { type: "json_object" } // Expecting JSON-like output, even if model doesn't fully support strict mode
        });

        const responseContent = completion.choices[0].message.content || '[]';
        let achievements: string[] = [];

        try {
            // Attempt to parse the response as JSON
            const parsed = JSON.parse(responseContent);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                achievements = parsed;
            } else {
                 // Fallback if parsing fails or format is wrong: treat as bulleted list
                 achievements = responseContent
                     .split(/\n+/)
                     .map(line => line.replace(/^[\s•\-–—*]+/, '').trim())
                     .filter(line => line.length > 5); // Filter very short lines
            }
        } catch (parseError) {
            console.warn("Failed to parse AI achievements as JSON, falling back to line splitting:", parseError);
             // Fallback if JSON parsing fails
             achievements = responseContent
                 .split(/\n+/)
                 .map(line => line.replace(/^[\s•\-–—*]+/, '').trim())
                 .filter(line => line.length > 5);
        }

        console.log(`Generated ${achievements.length} achievements for role: ${experience.title}`);
        return achievements.slice(0, 5); // Limit to max 5 achievements
    } catch (error) {
        console.error("Error generating achievements:", error);
        return [];
    }
}


/**
 * Creates a resume in the database from LinkedIn profile data.
 */
export async function createResumeFromLinkedInData(
    supabase: SupabaseClient<Database>,
    userId: string,
    linkedInProfile: LinkedInProfile
): Promise<{ success: boolean; resumeId?: string; error?: string }> {

    if (!linkedInProfile) {
         console.error("createResumeFromLinkedInData called with null linkedInProfile");
         return { success: false, error: 'LinkedIn profile data is missing.' };
    }
     if (!userId) {
         console.error("createResumeFromLinkedInData called without userId");
         return { success: false, error: 'User ID is missing.' };
     }

    try {
        console.log(`Starting resume creation for user: ${userId} from LinkedIn profile ID: ${linkedInProfile.id}`);

        // Enhance profile data using AI (optional based on API key)
        const enhancedProfile = await enhanceProfileWithAI(linkedInProfile);

        // Extract name parts safely
        const name = enhancedProfile.name || enhancedProfile.email?.split('@')[0] || 'User';
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        // --- Process Sections ---
        // Ensure experience_json is an array, then process achievements
        const experienceJson = Array.isArray(enhancedProfile.experience_json) ? enhancedProfile.experience_json : [];
        const processedExperience = await Promise.all(experienceJson.map(async (exp: any) => ({
            ...exp, // Spread original experience first
            achievements: await generateAchievements(exp) // Generate/ensure achievements
        })));

        // Ensure skills_json is an array, then process
        const skillsJson = Array.isArray(enhancedProfile.skills_json) ? enhancedProfile.skills_json : [];
        const processedSkills = skillsJson.map((skill: any, index: number) => ({
            id: skill.id || `skill-${index}-${uuidv4()}`, // Ensure unique ID
            name: skill.name || '',
            level: skill.level || skill.proficiency || 'Intermediate', // Accept 'level' or 'proficiency'
            category: skill.category || 'Professional' // Default category
        }));

        // Safely handle potentially missing JSON fields (assuming types are now updated)
        const educationJson = Array.isArray(enhancedProfile.education_json) ? enhancedProfile.education_json : [];
        const projectsJson = Array.isArray(enhancedProfile.projects_json) ? enhancedProfile.projects_json : [];
        const languagesJson = Array.isArray(enhancedProfile.languages_json) ? enhancedProfile.languages_json : [];
        const certificationsJson = Array.isArray(enhancedProfile.certifications_json) ? enhancedProfile.certifications_json : [];
        // --- End Process Sections ---


        // Get default template ID
        const defaultTemplateId = await getDefaultTemplateId(supabase);
        console.log(`Using default template ID: ${defaultTemplateId || 'None'}`);

        // Construct the resume data for insertion
        const resumeData: ResumeInsert = {
            // id: uuidv4(), // DB should generate default UUID if column default is set, otherwise uncomment
            user_id: userId,
            title: `${firstName} ${lastName} Resume`.trim(),
            personal_info: {
                firstName: firstName,
                lastName: lastName,
                title: enhancedProfile.headline || enhancedProfile.position || '',
                summary: enhancedProfile.summary || '',
                contact: {
                    email: enhancedProfile.email || '',
                    phone: '', // Placeholder
                    location: enhancedProfile.location || '',
                    linkedIn: enhancedProfile.profile_url || '',
                    website: '' // Placeholder
                }
            },
            work_experience: processedExperience,
            education: educationJson,
            skills: processedSkills,
            projects: projectsJson,
            languages: languagesJson,
            certifications: certificationsJson,
            // Ensure other potentially required fields have defaults
            interests: [],
            internships: [],
            references: [],
            reference_text: "References available upon request",
            template_id: defaultTemplateId,
            // created_at: handled by db default? If not: new Date().toISOString(),
            // updated_at: handled by db default? If not: new Date().toISOString(),
            is_imported: true,
            is_public: false,
            // Ensure any other non-nullable fields are included
        };

        // Log key parts of the data being inserted (avoid logging everything)
        console.log(`Attempting to insert resume titled: "${resumeData.title}"`);
        console.log(`Experience count: ${processedExperience.length}, Skills count: ${processedSkills.length}`);


        // Insert the resume
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .insert(resumeData)
            .select('id') // Select only the ID after insert
            .single();

        if (resumeError) {
            console.error('Error inserting resume:', JSON.stringify(resumeError, null, 2));
            // Attempt to provide more specific feedback if possible
            let userErrorMessage = 'Failed to save resume data.';
            if (resumeError.message.includes("violates non-null constraint")) {
                 userErrorMessage = `Database error: A required field was missing. Details: ${resumeError.details || resumeError.message}`;
            } else if (resumeError.message.includes("violates unique constraint")) {
                 userErrorMessage = `Database error: A unique value conflict occurred. Details: ${resumeError.details || resumeError.message}`;
            } else {
                 userErrorMessage = `Database error: ${resumeError.message}`;
            }
            return { success: false, error: userErrorMessage };
        }

        if (!resume || !resume.id) {
             console.error('Resume insert seemed successful, but no ID was returned.');
             return { success: false, error: 'Failed to get resume ID after creation.' };
        }

        console.log("Resume inserted successfully with ID:", resume.id);

        // Log activity (fire-and-forget)
        supabase.from('activity_logs').insert({
            user_id: userId,
            event_type: 'resume_created',
            entity_type: 'resume',
            entity_id: resume.id,
            details: { source: 'linkedin', profile_id: linkedInProfile.id }
        }).then(({ error: logError }) => {
            if (logError) console.error("Error logging activity:", logError);
            else console.log("Activity logged successfully for resume creation");
        });


        return { success: true, resumeId: resume.id };

    } catch (error: any) {
        console.error('Critical error in createResumeFromLinkedInData:', error);
        return { success: false, error: `An unexpected error occurred: ${error.message || 'Unknown error'}` };
    }
}