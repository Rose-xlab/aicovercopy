// lib/formattingUtils.ts

import { v4 as uuidv4 } from 'uuid';

// Define a generic JSON type if not importing from elsewhere
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Helper function to safely parse Proxycurl date objects { day, month, year }
// Returns YYYY-MM format or null
function parseProxycurlDate(dateObj: any): string | null {
    if (dateObj && dateObj.year) {
        const month = String(dateObj.month || 1).padStart(2, '0');
        return `${dateObj.year}-${month}`;
    }
    return null;
}


/**
 * Formats Proxycurl experiences data into the structure expected for experience_json.
 * Input: The 'experiences' array from Proxycurl Person Profile response
 */
export function formatExperiences(experiencesData: any): Json[] {
    if (!experiencesData || !Array.isArray(experiencesData)) {
        console.warn("formatExperiences received invalid or no data:", experiencesData);
        return [];
    }
    return experiencesData.map((pos: any, index: number) => {
        const startDate = parseProxycurlDate(pos.starts_at);
        const endDate = parseProxycurlDate(pos.ends_at);
        return {
            id: `exp-${index}-${uuidv4()}`,
            title: pos.title || '',
            company: pos.company || '', // Proxycurl uses 'company'
            location: pos.location || '',
            description: pos.description || '',
            startDate: startDate,
            endDate: endDate,
            isOngoing: !endDate && !!startDate
        };
    });
}

/**
 * Formats Proxycurl education data into the structure expected for education_json.
 * Input: The 'education' array from Proxycurl Person Profile response
 */
export function formatEducations(educationData: any): Json[] {
    if (!educationData || !Array.isArray(educationData)) {
         console.warn("formatEducations received invalid or no data:", educationData);
        return [];
    }
    return educationData.map((edu: any, index: number) => {
        const startDate = parseProxycurlDate(edu.starts_at);
        const endDate = parseProxycurlDate(edu.ends_at);
        return {
            id: `edu-${index}-${uuidv4()}`,
            institution: edu.school || '', // Proxycurl uses 'school'
            studyType: edu.field_of_study || '', // Proxycurl uses 'field_of_study'
            degree: edu.degree_name || '', // Proxycurl uses 'degree_name'
            startDate: startDate,
            endDate: endDate,
            isOngoing: !endDate && !!startDate,
            description: edu.description || edu.activities_and_societies || '' // Proxycurl has 'activities_and_societies'
        };
    });
}

/**
 * Formats Proxycurl skills data (assuming it's an array of strings when requested).
 * Requires Proxycurl API call includes 'skills=include'. Verify exact response structure.
 * Input: The 'skills' array from Proxycurl Person Profile response (e.g., ["Java", "Python"])
 */
export function formatSkills(skillsData: any): Json[] {
    // ** ASSUMPTION: skillsData is expected to be an array of strings **
    // ** Verify the actual structure returned by Proxycurl when using 'skills=include' **
    if (!skillsData || !Array.isArray(skillsData)) {
         console.warn("formatSkills received invalid or no data (ensure 'skills=include' was used?):", skillsData);
        return [];
    }
    return skillsData
        .filter(skill => typeof skill === 'string' && skill.trim() !== '')
        .map((skillName: string, index: number) => {
            let category = 'Professional'; // Default category
            // Basic categorization (refine as needed)
             if (/\b(cloud|aws|azure|gcp|docker|kubernetes|terraform)\b/i.test(skillName)) category = 'Cloud & DevOps';
            else if (/\b(javascript|typescript|python|java|c#|c\+\+|ruby|php|swift|kotlin|go)\b/i.test(skillName)) category = 'Programming Languages';
            else if (/\b(react|angular|vue|node|django|flask|spring|\.net)\b/i.test(skillName)) category = 'Frameworks & Libraries';
            else if (/\b(sql|postgres|mysql|mongodb|database)\b/i.test(skillName)) category = 'Databases';
            else if (/\b(agile|scrum|management|leadership|communication|teamwork)\b/i.test(skillName)) category = 'Methodologies & Soft Skills';
            else if (/\b(design|photoshop|illustrator|figma|ui|ux)\b/i.test(skillName)) category = 'Design';

            return {
                id: `skill-${index}-${uuidv4()}`,
                name: skillName,
                level: 'Intermediate', // Proxycurl likely doesn't provide level
                category: category
            };
        });
}

/**
 * Formats Proxycurl certifications data into the structure expected for certifications_json.
 * Input: The 'certifications' array from Proxycurl Person Profile response
 */
export function formatCertifications(certificationsData: any): Json[] {
    if (!certificationsData || !Array.isArray(certificationsData)) {
         console.warn("formatCertifications received invalid or no data:", certificationsData);
        return [];
    }
    return certificationsData.map((cert: any, index: number) => {
        const issueDate = parseProxycurlDate(cert.starts_at); // Proxycurl uses starts_at here too
        const expiryDate = parseProxycurlDate(cert.ends_at);
        return {
            id: `cert-${index}-${uuidv4()}`,
            name: cert.name || '',
            issuer: cert.authority || '', // Proxycurl uses 'authority'
            issueDate: issueDate,
            expiryDate: expiryDate, // Often null in docs example
            url: cert.url || ''
        };
    });
}

/**
 * Formats Proxycurl languages data into the structure expected for languages_json.
 * Input: The 'languages_and_proficiencies' array from Proxycurl response
 */
export function formatLanguages(languagesData: any): Json[] {
    // Note: Proxycurl response key is 'languages_and_proficiencies' in docs
    if (!languagesData || !Array.isArray(languagesData)) {
        console.warn("formatLanguages received invalid or no data:", languagesData);
        return [];
    }
    return languagesData.map((lang: any, index: number) => {
        let level = 'Conversational'; // Default level
        const proficiency = lang.proficiency || ''; // Proxycurl uses enum string like 'NATIVE_OR_BILINGUAL'

        if (typeof proficiency === 'string') {
            if (proficiency === 'ELEMENTARY') level = 'Basic';
            else if (proficiency === 'LIMITED_WORKING') level = 'Conversational';
            else if (proficiency === 'PROFESSIONAL_WORKING') level = 'Fluent';
            else if (proficiency === 'FULL_PROFESSIONAL') level = 'Fluent';
            else if (proficiency === 'NATIVE_OR_BILINGUAL') level = 'Native';
        }

        return {
            id: `lang-${index}-${uuidv4()}`,
            name: lang.name || '', // Proxycurl uses 'name'
            level: level
        };
    });
}

/**
 * Formats Proxycurl projects data into the structure expected for projects_json.
 * Input: The 'accomplishment_projects' array from Proxycurl response
 */
export function formatProjects(projectsData: any): Json[] {
    // Note: Proxycurl response key is 'accomplishment_projects' in docs
    if (!projectsData || !Array.isArray(projectsData)) {
         console.warn("formatProjects received invalid or no data:", projectsData);
        return [];
    }
    return projectsData.map((proj: any, index: number) => {
        const startDate = parseProxycurlDate(proj.starts_at);
        const endDate = parseProxycurlDate(proj.ends_at);
        return {
            id: `proj-${index}-${uuidv4()}`,
            name: proj.title || '', // Proxycurl uses 'title' for project name
            description: proj.description || '',
            url: proj.url || '', // Proxycurl uses 'url'
            startDate: startDate,
            endDate: endDate,
            isOngoing: !endDate && !!startDate
        };
    });
}

/**
 * Extracts the profile picture URL directly from the Proxycurl profile data.
 * @param proxycurlProfileData - The root profile object from Proxycurl response.
 * @returns The URL string or null.
 */
export function getProfilePictureUrl(proxycurlProfileData: any): string | null {
    // Proxycurl provides 'profile_pic_url' directly based on docs example
    return proxycurlProfileData?.profile_pic_url || null;
}