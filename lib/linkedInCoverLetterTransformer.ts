// lib/linkedInCoverLetterTransformer.ts
import { EnhancedLinkedInProfile } from '@/types/linkedintype';

/**
 * Interface for LinkedIn data optimized for cover letter generation
 */
export interface LinkedInCoverLetterData {
  name: string;
  title: string;
  summary: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  topSkills: string[];
  relevantExperience: {
    role: string;
    company: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    school: string;
    fieldOfStudy?: string;
  }[];
  certifications: string[];
  accomplishments: string[];
  languages: string[];
  profileUrl: string;
}

/**
 * Calculate years of experience from LinkedIn work history
 * @param experience Array of work experiences from LinkedIn
 * @returns Total years of experience
 */
function calculateYearsOfExperience(experience: any[]): number {
  if (!experience || !Array.isArray(experience) || experience.length === 0) {
    return 0;
  }

  let totalMonths = 0;
  const currentDate = new Date();

  experience.forEach(job => {
    try {
      const startDate = job.startDate ? new Date(job.startDate) : null;
      const endDate = job.endDate ? new Date(job.endDate) : 
                     (job.isOngoing ? currentDate : null);

      if (startDate && endDate) {
        // Calculate months between dates
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += months > 0 ? months : 0;
      }
    } catch (error) {
      console.warn('Error calculating experience duration:', error);
    }
  });

  // Convert months to years (rounded to 1 decimal place)
  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Extract the most relevant accomplishments from work experiences
 * @param experience Array of work experiences from LinkedIn
 * @returns Array of most impressive accomplishments
 */
function extractTopAccomplishments(experience: any[]): string[] {
  if (!experience || !Array.isArray(experience)) {
    return [];
  }

  const allAchievements: string[] = [];

  // Collect all achievements from work experience
  experience.forEach(job => {
    if (job.achievements && Array.isArray(job.achievements)) {
      allAchievements.push(...job.achievements);
    }
  });

  // Sort achievements by length (longer ones are often more detailed and impressive)
  // and take the top 5
  return allAchievements
    .filter(achievement => achievement.length > 10) // Filter out very short achievements
    .sort((a, b) => {
      // Prioritize achievements with metrics (numbers, percentages)
      const aHasMetrics = /\d+%|\d+\s*%|\$\d+|\d+\+|\d+K|\d+M/i.test(a);
      const bHasMetrics = /\d+%|\d+\s*%|\$\d+|\d+\+|\d+K|\d+M/i.test(b);
      
      if (aHasMetrics && !bHasMetrics) return -1;
      if (!aHasMetrics && bHasMetrics) return 1;
      
      // If both have or don't have metrics, prefer longer ones
      return b.length - a.length;
    })
    .slice(0, 5);
}

/**
 * Transform LinkedIn profile data into a format optimized for cover letter generation
 * @param profile LinkedIn profile data
 * @returns Transformed data optimized for cover letter generation
 */
export function transformLinkedInProfileForCoverLetter(
  profile: EnhancedLinkedInProfile | any
): LinkedInCoverLetterData {
  // Handle both snake_case and camelCase properties
  const experienceData = profile.experience_json || profile.experienceJson || [];
  const educationData = profile.education_json || profile.educationJson || [];
  const skillsData = profile.skills_json || profile.skillsJson || [];
  const languagesData = profile.languages_json || profile.languagesJson || [];
  const certificationData = profile.certifications_json || profile.certificationsJson || [];
  
  // Get current role and company
  const currentRole = profile.position || profile.currentPosition || 
                     (experienceData[0]?.title) || '';
  const currentCompany = profile.company || profile.currentCompany || 
                       (experienceData[0]?.company) || '';
                       
  // Extract top skills (prioritize those with higher proficiency levels)
  const topSkills = skillsData
    .sort((a: any, b: any) => {
      const proficiencyOrder = { 'Expert': 1, 'Advanced': 2, 'Intermediate': 3, 'Beginner': 4 };
      const aLevel = a.level || a.proficiency || 'Intermediate';
      const bLevel = b.level || b.proficiency || 'Intermediate';
      return (proficiencyOrder[aLevel] || 5) - (proficiencyOrder[bLevel] || 5);
    })
    .slice(0, 10)
    .map((skill: any) => skill.name);
    
  // Format education entries
  const education = educationData.map((edu: any) => ({
    degree: edu.degree || '',
    school: edu.school || edu.institution || '',
    fieldOfStudy: edu.fieldOfStudy || ''
  }));
  
  // Extract relevant experience with highlights
  const relevantExperience = experienceData
    .slice(0, 3) // Focus on most recent 3 positions
    .map((exp: any) => ({
      role: exp.title || '',
      company: exp.company || '',
      highlights: exp.achievements || []
    }));
    
  // Extract certifications
  const certifications = certificationData
    .map((cert: any) => cert.name || '')
    .filter(Boolean);
    
  // Extract languages
  const languages = languagesData
    .filter((lang: any) => lang.proficiency === 'Fluent' || lang.proficiency === 'Native')
    .map((lang: any) => lang.name);
    
  return {
    name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    title: profile.headline || currentRole,
    summary: profile.summary || '',
    currentRole,
    currentCompany,
    yearsOfExperience: calculateYearsOfExperience(experienceData),
    topSkills,
    relevantExperience,
    education,
    certifications,
    accomplishments: extractTopAccomplishments(experienceData),
    languages,
    profileUrl: profile.profile_url || profile.profileUrl || ''
  };
}