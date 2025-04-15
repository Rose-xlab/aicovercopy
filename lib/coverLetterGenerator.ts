// lib/coverLetterGenerator.ts

import { Database } from '@/types/supabase';
import { LinkedInCoverLetterData } from '@/lib/linkedInCoverLetterTransformer';
import { createBrowserClient } from '@/lib/supabase';

// Define types based on Supabase schema or expected structures
type DbResume = Database['public']['Tables']['resumes']['Row'];
type Json = Database['public']['Tables']['resumes']['Row']['personal_info'];
interface CvFile { id: string; name: string; content?: string; /* ... other fields */ }

// Expected structure within DbResume JSON columns
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
// Updated SkillObject to reflect potential structure within JSON
interface SkillObject {
    id?: string;
    name?: string | null; // Allow name to be potentially null from DB Json
    level?: string;
    category?: string;
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
    resumeData: DbResume | CvFile | null;
    dataSource: 'cv' | 'linkedin' | 'both' | 'none';
    regenerate?: boolean;
}

/**
 * Data structure sent TO the /api/generate route (prepared data)
 */
interface UserProfilePayload {
    name?: string; title?: string; summary?: string; currentRole?: string;
    currentCompany?: string; yearsOfExperience?: number; skills?: string[]; // Expects array of strings
    experience?: { role?: string; company?: string; highlights?: string[] }[];
    education?: { degree?: string; school?: string; fieldOfStudy?: string }[];
    accomplishments?: string[]; cvFilename?: string; linkedInProfileUrl?: string | null;
}

// Helper to calculate years of experience
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

 // Helper to extract top accomplishments
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
 * Prepares the user profile payload to be sent to the /api/generate endpoint.
 */
export function prepareUserProfilePayload(
    resumeData: DbResume | CvFile | null,
    dataSource: 'cv' | 'linkedin' | 'both' | 'none'
): UserProfilePayload {
    const payload: UserProfilePayload = {};
    if (!resumeData) return payload;

    if (dataSource === 'cv' && 'name' in resumeData && typeof resumeData.name === 'string') {
        const cv = resumeData as CvFile;
        payload.cvFilename = cv.name;
        payload.name = "Applicant from CV";
        payload.title = "Professional";
        // TODO: Add CV content parsing logic here to populate payload better

    } else if ((dataSource === 'linkedin' || dataSource === 'both') && 'personal_info' in resumeData) {
        const data = resumeData as DbResume;
        const pInfo = data.personal_info as ResumePersonalInfo | null;
        const workExp = (Array.isArray(data.work_experience) ? data.work_experience : []) as ExperienceObject[];
        const education = (Array.isArray(data.education) ? data.education : []) as EducationObject[];
        // FIXED: Safely process skills from Json | null type
        const rawSkills = data.skills;
        let skillNames: string[] = [];
        if (Array.isArray(rawSkills)) {
            skillNames = rawSkills
                .map((skill: any): string | null => {
                    // Handle if skill is just a string OR an object with a name property
                    if (typeof skill === 'string') {
                        return skill.trim();
                    } else if (typeof skill === 'object' && skill !== null && typeof skill.name === 'string') {
                        return skill.name.trim();
                    }
                    return null; // Ignore other types
                })
                .filter((name): name is string => !!name) // Filter out nulls/empty strings
                .slice(0, 15); // Limit
        }
        payload.skills = skillNames; // Assign the processed string array


        payload.name = `${pInfo?.firstName || ''} ${pInfo?.lastName || ''}`.trim() || data.title || 'Applicant';
        payload.title = pInfo?.title || workExp[0]?.title || '';
        payload.summary = pInfo?.summary || '';
        payload.currentRole = workExp.find(j => j.isOngoing)?.title || workExp[0]?.title || '';
        payload.currentCompany = workExp.find(j => j.isOngoing)?.company || workExp[0]?.company || '';
        payload.yearsOfExperience = calculateYearsFromResume(workExp);
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
    }

    // Handle 'both' case more explicitly if needed

    return payload;
}

/**
 * Generate a cover letter by calling the backend API.
 */
export async function generateCoverLetter(params: CoverLetterGenerationParams): Promise<string> {
    console.log("generateCoverLetter: Preparing payload...");
    const userProfilePayload = prepareUserProfilePayload(params.resumeData, params.dataSource);
    
    if (Object.keys(userProfilePayload).length === 0 && params.dataSource !== 'none') {
        throw new Error("Could not prepare user profile data from the selected source.");
    }
    
    console.log(`generateCoverLetter: Calling /api/generate with dataSource: ${params.dataSource}`);
    try {
        // IMPORTANT FIX: Updated parameter name from 'resumeData' to 'userProfile' to match API expectations
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobDescription: params.jobDescription,
                jobTitle: params.jobTitle,
                companyName: params.companyName,
                tone: params.tone,
                userProfile: userProfilePayload, // Changed from 'resumeData' to 'userProfile'
                dataSource: params.dataSource,
                regenerate: params.regenerate
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Failed (Status: ${response.status})`);
        }
        if (!data.coverLetter) {
            throw new Error("API returned no cover letter content.");
        }
        
        console.log("generateCoverLetter: Success.");
        return data.coverLetter;
    } catch (error) {
        console.error('Error calling /api/generate:', error);
        throw error;
    }
}

/**
 * Save a generated cover letter.
 * RECOMMENDED: Move the Supabase insert logic to a backend API route.
 */
export async function saveCoverLetter(/* ... params ... */): Promise<string> {
    console.warn("Direct client-side saving in saveCoverLetter is discouraged.");
    // ... (rest of saveCoverLetter function remains the same)
    const content = arguments[0]; const params = arguments[1]; const templateId = arguments[2]; // Get arguments
    try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');
        const sourceRecordId = params.resumeData?.id || null;
        const { data, error } = await supabase.from('cover_letters').insert({
                user_id: session.user.id, job_description: params.jobDescription, job_title: params.jobTitle,
                company_name: params.companyName, content: content, tone: params.tone || 'professional',
                data_source: params.dataSource, template_id: templateId || null, created_at: new Date().toISOString(),
                resume_id: sourceRecordId, status: 'completed'
            }).select('id').single();
        if (error) throw error;
        if (!data?.id) throw new Error("Failed to save cover letter (no ID returned).");
        console.log("Cover letter saved with ID:", data.id);
        return data.id;
    } catch (error) { console.error('Error saving cover letter:', error); throw error; }
}