// lib/linkedInCoverLetterTransformer.ts

import { Database } from '@/types/supabase';
// Assuming LinkedInCoverLetterData interface definition should live here
// (If you moved it to types/linkedintype.ts, adjust the export there and import here)
// import { LinkedInCoverLetterData } from '@/types/linkedintype';
import { v4 as uuidv4 } from 'uuid';

// Define the specific type for a profile row from your database
type DbLinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];

// Define types for the expected structure within the JSON columns
// These should align with the output of your lib/formattingUtils.ts functions
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
    id?: string;
    name: string; // Required field
    level?: string;
    category?: string;
}
interface CertificationObject {
    id?: string; name?: string; issuer?: string; issueDate?: string | null;
    expiryDate?: string | null; url?: string;
}
interface LanguageObject {
     id?: string; name?: string; level?: string;
}
interface ProjectObject {
    id?: string; name?: string; description?: string; startDate?: string | null;
    endDate?: string | null; isOngoing?: boolean; url?: string;
}

/**
 * Interface for LinkedIn data optimized specifically for cover letter generation prompt context.
 * FIXED: Added export keyword
 */
export interface LinkedInCoverLetterData {
    // Include the ID from the database profile table if needed downstream (e.g., for metadata)
    id?: string; // Database ID of the linkedin_profiles record
    name: string;
    title: string; // Headline or Current Role
    summary: string;
    currentRole: string;
    currentCompany: string;
    yearsOfExperience: number;
    topSkills: string[];
    relevantExperience: { // Typically top 3 recent experiences
        role: string;
        company: string;
        highlights: string[]; // Key achievements from that role
    }[];
    education: { // Simplified education structure
        degree: string;
        school: string;
        fieldOfStudy?: string;
    }[];
    certifications: string[]; // List of certification names
    accomplishments: string[]; // Top overall accomplishments extracted
    languages: string[]; // Fluent/Native languages
    profileUrl: string;
}


/**
 * Calculate years of experience from formatted work history.
 */
function calculateYearsOfExperience(experience: ExperienceObject[]): number {
    if (!Array.isArray(experience) || experience.length === 0) return 0;
    let totalMonths = 0;
    const currentDate = new Date();
    experience.forEach(job => {
        try {
            const startDate = job.startDate ? new Date(job.startDate) : null;
            const endDate = job.isOngoing ? currentDate : (job.endDate ? new Date(job.endDate) : null);
            if (startDate instanceof Date && !isNaN(startDate.getTime()) &&
                endDate instanceof Date && !isNaN(endDate.getTime())) {
                let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
                months -= startDate.getMonth(); months += endDate.getMonth();
                totalMonths += months >= 0 ? (months + 1) : 0;
            }
        } catch (error) { console.warn('Error calculating experience duration:', error); }
    });
    return totalMonths > 0 ? Math.round((totalMonths / 12) * 10) / 10 : 0;
}

/**
 * Extract the most relevant accomplishments from formatted work experiences.
 */
function extractTopAccomplishments(experience: ExperienceObject[]): string[] {
    if (!Array.isArray(experience)) return [];
    const allAchievements: string[] = [];
    experience.forEach(job => {
        if (Array.isArray(job.achievements)) {
            allAchievements.push(...job.achievements.filter((ach): ach is string => typeof ach === 'string'));
        }
    });
    return allAchievements
        .filter(achievement => achievement.length > 10)
        .sort((a: string, b: string) => { // Explicit types
            const aHasMetrics = /\d+%|\d+\s*%|\$\d+|\d+\+|\d+K|\d+M/i.test(a);
            const bHasMetrics = /\d+%|\d+\s*%|\$\d+|\d+\+|\d+K|\d+M/i.test(b);
            if (aHasMetrics && !bHasMetrics) return -1;
            if (!aHasMetrics && bHasMetrics) return 1;
            return b.length - a.length;
        })
        .slice(0, 5);
}

/**
 * Transform stored LinkedIn profile data into a format optimized for cover letter generation.
 * @param profile - Profile data object fetched from the database (linkedin_profiles row)
 * @returns Transformed data optimized for cover letter generation (LinkedInCoverLetterData) or null
 */
export function transformLinkedInProfileForCoverLetter(
    profile: DbLinkedInProfile | null
): LinkedInCoverLetterData | null {

    if (!profile) { return null; }

    // Safely extract and type data from JSON columns
    const experienceData: ExperienceObject[] = Array.isArray(profile.experience_json) ? profile.experience_json as ExperienceObject[] : [];
    const educationData: EducationObject[] = Array.isArray(profile.education_json) ? profile.education_json as EducationObject[] : [];
    const certificationData: CertificationObject[] = Array.isArray(profile.certifications_json) ? profile.certifications_json as CertificationObject[] : [];
    const languagesData: LanguageObject[] = Array.isArray(profile.languages_json) ? profile.languages_json as LanguageObject[] : [];
    const projectData: ProjectObject[] = Array.isArray(profile.projects_json) ? profile.projects_json as ProjectObject[] : [];

    // Type-safe handling for skills_json
    const rawSkillsJson = profile.skills_json;
    let skillsData: SkillObject[] = [];
    if (Array.isArray(rawSkillsJson)) {
        skillsData = rawSkillsJson
            .filter((skill: any): skill is { id?: string, name: string, level?: string, category?: string } =>
                typeof skill === 'object' && skill !== null && typeof skill.name === 'string'
            )
            .map((skill): SkillObject => ({
                id: typeof skill.id === 'string' ? skill.id : undefined,
                name: skill.name, // Known to be string here
                level: typeof skill.level === 'string' ? skill.level : 'Intermediate',
                category: typeof skill.category === 'string' ? skill.category : 'Professional'
            }));
    }

    // Get current role and company
    const currentRole = profile.position || (experienceData[0]?.title) || '';
    const currentCompany = profile.company || (experienceData[0]?.company) || '';

    // Extract top skills names
    const topSkills = skillsData
        .slice(0, 10)
        .map(skill => skill.name) // name should be guaranteed string from map above
        .filter(Boolean); // Ensure no empty strings just in case

    // Format education entries
    const education = educationData.map((edu) => ({
        degree: edu.degree || '',
        school: edu.institution || '',
        fieldOfStudy: edu.studyType || ''
    }));

    // Extract relevant experience with highlights
    const relevantExperience = experienceData
        .slice(0, 3)
        .map((exp) => ({
            role: exp.title || '',
            company: exp.company || '',
            highlights: exp.achievements || []
        }));

    // Extract certifications names
    const certifications = certificationData
        .map(cert => cert.name || '')
        .filter(Boolean);

    // Extract fluent/native language names
    const languages = languagesData
        .filter(lang => lang.level === 'Fluent' || lang.level === 'Native')
        .map(lang => lang.name || '')
        .filter(Boolean);

    // Extract name parts
    const nameParts = (profile.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';


    // Construct the output object matching LinkedInCoverLetterData interface
    const transformedData: LinkedInCoverLetterData = {
        id: profile.id, // Include the database ID
        name: profile.name || `${firstName} ${lastName}`.trim(),
        title: profile.headline || currentRole || '',
        summary: profile.summary || '',
        currentRole: currentRole,
        currentCompany: currentCompany,
        yearsOfExperience: calculateYearsOfExperience(experienceData),
        topSkills: topSkills,
        relevantExperience: relevantExperience,
        education: education,
        certifications: certifications,
        accomplishments: extractTopAccomplishments(experienceData),
        languages: languages,
        profileUrl: profile.profile_url || ''
    };

    return transformedData;
}