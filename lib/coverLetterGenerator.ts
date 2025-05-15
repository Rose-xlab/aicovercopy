// File: lib/coverLetterGenerator.ts

import { Database } from '@/types/supabase';
import { LinkedInCoverLetterData } from '@/lib/linkedInCoverLetterTransformer'; // Ensure this type exists and is correct
import type {SenderInfo, RecipientInfo} from '@/types/cover-letter'
// Define types based on Supabase schema or expected structures
type DbResume = Database['public']['Tables']['resumes']['Row'];
type Json = Database['public']['Tables']['resumes']['Row']['personal_info']; // Adjust if Json type is different
interface CvFile { id: string; name: string; content?: string; /* ... other fields if needed */ }

// Expected structure within DbResume JSON columns (keep relevant definitions)
interface ExperienceObject {
    id?: string; title?: string; company?: string; startDate?: string | null;
    endDate?: string | null; isOngoing?: boolean; description?: string;
    location?: string; achievements?: string[];
}
interface EducationObject {
     id?: string; institution?: string; studyType?: string; degree?: string;
     startDate?: string | null; endDate?: string | null; isOngoing?: boolean;
     description?: string;
}
interface SkillObject {
    id?: string; name?: string | null; level?: string; category?: string;
}
interface ResumePersonalInfo {
    firstName?: string | null; lastName?: string | null; title?: string | null;
    summary?: string | null; contact?: { phone?: string | null; location?: string | null;
    linkedIn?: string | null; website?: string | null; email?: string | null; } | null;
}


/**
 * Data structure for generating a cover letter (parameters for the API call)
 */
export interface CoverLetterGenerationParams {
    jobDescription: string;
    jobTitle?: string;
    companyName?: string;
    tone?: string;
    sender?:SenderInfo
    recipient?:RecipientInfo
    // Data passed from frontend - could be DbResume, CvFile, or potentially LinkedIn data structure
    resumeData: DbResume | CvFile | LinkedInCoverLetterData | null;
    dataSource: 'cv' | 'linkedin' | 'both' | 'none';
    regenerate?: boolean;
}

/**
 * Data structure sent TO the /api/generate route (prepared data)
 * Ensure this aligns with what prepareUserProfilePayload outputs and /api/generate expects
 */
interface UserProfilePayload {
    name?: string; title?: string; summary?: string; currentRole?: string;
    currentCompany?: string; yearsOfExperience?: number; skills?: string[];
    experience?: { role?: string; company?: string; highlights?: string[] }[];
    education?: { degree?: string; school?: string; fieldOfStudy?: string }[];
    accomplishments?: string[]; cvFilename?: string; linkedInProfileUrl?: string | null;
    id?: string; // From LinkedInProfile or CvFile?
    // Add other potential top-level fields if applicable
    linkedin?: LinkedInCoverLetterData | null;
    resume?: DbResume | CvFile | null;
    cv?: CvFile | null;
    keyAttributes?: any;
}


// --- Keep existing helper functions ---
function calculateYearsFromResume(experience: any[]): number {
    if (!Array.isArray(experience) || experience.length === 0) return 0;
    let totalMonths = 0;
    const currentDate = new Date();
    experience.forEach((job: ExperienceObject) => {
        try {
            const startDate = job.startDate ? new Date(job.startDate) : null;
            const endDate = job.isOngoing ? currentDate : (job.endDate ? new Date(job.endDate) : null);
            if (startDate instanceof Date && !isNaN(startDate.getTime()) && endDate instanceof Date && !isNaN(endDate.getTime())) {
                let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
                months -= startDate.getMonth(); months += endDate.getMonth();
                totalMonths += months >= 0 ? (months + 1) : 0;
            }
        } catch (error) { console.warn('Error calculating experience duration:', error); }
    });
    return totalMonths > 0 ? Math.round((totalMonths / 12) * 10) / 10 : 0;
}

function extractTopAccomplishmentsFromResume(experience: ExperienceObject[]): string[] {
    if (!Array.isArray(experience)) return [];
    const allAchievements: string[] = [];
    experience.forEach((job: ExperienceObject) => {
        if (Array.isArray(job.achievements)) {
            allAchievements.push(...job.achievements.filter((ach): ach is string => typeof ach === 'string'));
        } else if (typeof job.description === 'string') {
            const bullets = job.description.match(/^[*-•]\s*(.*)/gm);
            if (bullets) allAchievements.push(...bullets.map(b => b.replace(/^[*-•]\s*/, '').trim()).filter(b => b.length > 10));
        }
    });
    return allAchievements
       .filter(achievement => achievement.length > 10)
       .sort((a: string, b: string) => {
           const aHasMetrics = /\d+%|\d+\s*%|\$\d+|\d+\+|\d+K|\d+M/i.test(a);
           const bHasMetrics = /\d+%|\d+\s*%|\$\d+|\d+\+|\d+K|\d+M/i.test(b);
           if (aHasMetrics && !bHasMetrics) return -1;
           if (!aHasMetrics && bHasMetrics) return 1;
           return b.length - a.length;
        })
       .slice(0, 5);
}

/**
 * Prepares the user profile payload for the /api/generate endpoint.
 * REVIEW AND REFINE THIS FUNCTION based on actual data structures used.
 */
export function prepareUserProfilePayload(
    sourceData: DbResume | CvFile | LinkedInCoverLetterData | null,
    dataSource: 'cv' | 'linkedin' | 'both' | 'none'
): UserProfilePayload {
   const payload: UserProfilePayload = {};
   if (!sourceData) return payload;

    // Logic based on data source
    if ((dataSource === 'cv' || dataSource === 'both') && 'personal_info' in sourceData) { // Check if it's DbResume
        const data = sourceData as DbResume;
        const pInfo = data.personal_info as ResumePersonalInfo | null;
        const workExp = (Array.isArray(data.work_experience) ? data.work_experience : []) as ExperienceObject[];
        const education = (Array.isArray(data.education) ? data.education : []) as EducationObject[];
        const rawSkills = data.skills;
        let skillNames: string[] = [];
         if (Array.isArray(rawSkills)) {
            skillNames = rawSkills
                .map((skill: any): string | null => typeof skill === 'string' ? skill.trim() : (typeof skill === 'object' && skill?.name ? String(skill.name).trim() : null))
                .filter((name): name is string => !!name)
                .slice(0, 15);
        }

        payload.name = `${pInfo?.firstName || ''} ${pInfo?.lastName || ''}`.trim() || data.title || 'Applicant (from Resume)';
        payload.title = pInfo?.title || workExp[0]?.title || '';
        payload.summary = pInfo?.summary || '';
        payload.currentRole = workExp.find(j => j.isOngoing)?.title || workExp[0]?.title || '';
        payload.currentCompany = workExp.find(j => j.isOngoing)?.company || workExp[0]?.company || '';
        payload.yearsOfExperience = calculateYearsFromResume(workExp);
        payload.skills = skillNames;
        payload.experience = workExp.slice(0, 3).map(exp => ({
             role: exp.title || '', company: exp.company || '',
             highlights: (exp.achievements || []).slice(0, 3)
        }));
        payload.education = education.slice(0, 2).map(edu => ({
              degree: edu.degree || '', school: edu.institution || '',
              fieldOfStudy: edu.studyType || '',
         }));
        payload.accomplishments = extractTopAccomplishmentsFromResume(workExp);
        payload.linkedInProfileUrl = pInfo?.contact?.linkedIn || null;
        payload.id = data.id; // Pass resume ID
        payload.resume = data; // Include full resume object if needed downstream

    } else if ((dataSource === 'cv' || dataSource === 'both') && 'name' in sourceData && 'size' in sourceData) { // Check if it's CvFile
         const cv = sourceData as CvFile;
         payload.cvFilename = cv.name;
         payload.name = "Applicant (from CV File)"; // Placeholder name
         payload.id = cv.id; // Pass CV file ID
         payload.cv = cv; // Include cv object
         // TODO: Add actual CV content parsing here if available and needed for the prompt
         payload.summary = "Professional background outlined in the attached CV.";

    } else if ((dataSource === 'linkedin' || dataSource === 'both') && 'profileUrl' in sourceData) { // Check if it's LinkedInCoverLetterData (heuristic check)
        const li = sourceData as LinkedInCoverLetterData;
        payload.name = li.name || 'Applicant (from LinkedIn)';
        payload.title = li.title || '';
        payload.currentCompany = li.currentCompany || '';
        payload.yearsOfExperience = li.yearsOfExperience || 0;
        payload.summary = li.summary || '';
        payload.skills = li.topSkills || [];
        payload.experience = li.relevantExperience || [];
        payload.education = li.education || [];
        payload.accomplishments = li.accomplishments || [];
        payload.linkedInProfileUrl = li.profileUrl || null;
        payload.id = li.id; // Pass LinkedIn profile DB ID
        payload.linkedin = li; // Include full linkedin object
    }

   console.log("Prepared user profile payload:", payload);
   return payload;
}


/**
 * Generate a cover letter by calling the backend API.
 */
export async function generateCoverLetter(params: CoverLetterGenerationParams): Promise<string> {
    console.log("generateCoverLetter: Preparing payload...");
    // Pass the original resumeData to prepareUserProfilePayload
    const userProfilePayload = prepareUserProfilePayload(params.resumeData, params.dataSource);

    // Refine this check: Only throw error if absolutely no usable data was prepared
    // Allow generation even if some fields are missing, the prompt should handle it
    // if (Object.keys(userProfilePayload).length <= 1 && params.dataSource !== 'none') { // Check if only ID was set maybe
    //     console.error("Could not prepare sufficient user profile data from the selected source.", userProfilePayload);
    //     throw new Error("Could not prepare user profile data from the selected source.");
    // }

    console.log(`generateCoverLetter: Calling /api/generate with dataSource: ${params.dataSource}`);
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobDescription: params.jobDescription,
                jobTitle: params.jobTitle,
                companyName: params.companyName,
                tone: params.tone,
                userProfile: userProfilePayload, // Send the prepared payload
                dataSource: params.dataSource,
                regenerate: params.regenerate
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Generation API failed (Status: ${response.status})`);
        }
        if (!data.coverLetter) {
            throw new Error("Generation API returned no cover letter content.");
        }

        console.log("generateCoverLetter: Success.");
        return data.coverLetter;
    } catch (error) {
        console.error('Error calling /api/generate:', error);
        throw error; // Re-throw to be caught by calling component
    }
}


// --- REWRITTEN saveCoverLetter function ---
/**
 * Save a generated cover letter VIA THE BACKEND API.
 */
export async function saveCoverLetter(
    // content: string,
    params: { // Structure matching what the frontend (page.tsx) passes
        jobDescription?: string;
        jobTitle?: string | null;
        companyName?: string | null;
        tone?: string | 'professional';
        content?:string,
        sender?:SenderInfo
        recipient?:RecipientInfo
        // Ensure resumeData passed from frontend HAS an 'id' property if it's not null
        // This data comes from the `resumeData` state in the frontend component
        resumeData?: { id?: string | null } | DbResume | CvFile | LinkedInCoverLetterData | null;
        dataSource: string;
        template_id?: string
        id?:string
    },
    // templateId: string | null // Should be UUID string or null from frontend state
): Promise<string> { // Returns the new cover letter ID on success
    console.log("Calling API to save cover letter...");

    // Validate templateId format (basic check) before sending
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const finalTemplateId = (params.template_id && uuidRegex.test(params.template_id)) ? params.template_id : null;

    if (params.template_id && !finalTemplateId) {
        console.warn(`Invalid UUID format passed for params.template_id: "${params.template_id}". Saving as null.`);
    }

    // Extract resume_id carefully - check if resumeData exists and has an id
    // This needs refinement based on what 'resumeData' actually holds when save is called
    let resumeId = null;
    if (params.resumeData && typeof params.resumeData === 'object' && 'id' in params.resumeData && params.resumeData.id) {
        // Check if the source was specifically a resume from the DB
        // 'personal_info' might be a good indicator of DbResume type
        if('personal_info' in params.resumeData) {
             resumeId = params.resumeData.id;
        }
        // Add checks if sourceRecordId should come from CvFile or LinkedInProfile if needed
        // Example: else if ('filename' in params.resumeData) { /* maybe use CvFile id? */ }
    }

    

    console.log("Payload for /api/cover-letters/save:", params);

    try {
        // Now we always use the same endpoint since the save route handles both create and update
        const endpoint = '/api/cover-letters/save';
        
        console.log(`${params.id ? 'Updating' : 'Creating'} cover letter via API endpoint: ${endpoint}`);
        
        // Call the API endpoint with the same method (POST) for both create and update
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });
    
        const result = await response.json();

        console.log('the save result',result)
    
        if (!response.ok) {
            // Throw an error that the frontend can catch and display
            console.error(`API Error ${params.id ? 'updating' : 'saving'} cover letter:`, result);
            throw new Error(result.error || `Failed to ${params.id ? 'update' : 'save'} cover letter (Status: ${response.status})`);
        }
    
        if (!result.id) {
             // Handle cases where API returns success but no ID
             console.error(`API Error ${params.id ? 'updating' : 'saving'} cover letter: No ID returned`, result);
             throw new Error(`Failed to ${params.id ? 'update' : 'save'} cover letter (API did not return ID).`);
        }
    
        console.log(`Cover letter ${result.updated ? 'updated' : 'created'} via API, received ID:`, result.id);
        return result.id; // Return the ID from the API response
    
    } catch (error) {
        console.error(`Error calling save API:`, error);
        // Re-throw the error so the calling component (page.tsx) can handle it
        throw error;
    }
}