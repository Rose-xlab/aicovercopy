// lib/coverLetterGenerator.ts
import { transformLinkedInProfileForCoverLetter, LinkedInCoverLetterData } from './linkedInCoverLetterTransformer';
import { createBrowserClient } from '@/lib/supabase';

/**
 * Data structure for generating a cover letter
 */
export interface CoverLetterGenerationParams {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  tone?: string;
  resumeData?: any; // Can be either CV or LinkedIn resume data
  dataSource: 'cv' | 'linkedin' | 'both' | 'none';
  regenerate?: boolean;
}

/**
 * Enhanced user profile data to send to the API
 */
interface EnhancedUserProfile {
  resume?: any;
  linkedin?: LinkedInCoverLetterData;
  keyAttributes?: {
    yearsOfExperience?: number;
    skills?: string[];
    accomplishments?: string[];
    education?: any[];
    currentRole?: string;
    currentCompany?: string;
  };
}

/**
 * Process resume data and prepare it for cover letter generation
 */
export function prepareResumeForCoverLetter(resumeData: any, dataSource: 'cv' | 'linkedin' | 'both' | 'none'): EnhancedUserProfile {
  const profile: EnhancedUserProfile = {
    keyAttributes: {}
  };
  
  // Add resume data if available
  if (resumeData) {
    // Always include the full resume data
    profile.resume = resumeData;
    
    // Extract key attributes from resume for better AI processing
    if (resumeData.personal_info || resumeData.personalInfo) {
      const personalInfo = resumeData.personal_info || resumeData.personalInfo;
      
      // Add current role and company
      profile.keyAttributes!.currentRole = personalInfo.title || '';
      
      // Add education info
      const education = resumeData.education || [];
      if (education.length > 0) {
        profile.keyAttributes!.education = education;
      }
    }
    
    // Add work experience data
    const workExperience = resumeData.work_experience || resumeData.workExperience || [];
    if (workExperience.length > 0) {
      // Calculate years of experience
      let totalMonths = 0;
      workExperience.forEach((job: any) => {
        const startDate = job.startDate ? new Date(job.startDate) : null;
        const endDate = job.endDate ? new Date(job.endDate) : 
                      (job.isOngoing ? new Date() : null);
                      
        if (startDate && endDate) {
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
          totalMonths += months > 0 ? months : 0;
        }
      });
      
      profile.keyAttributes!.yearsOfExperience = Math.round((totalMonths / 12) * 10) / 10;
      
      // Extract all achievements
      const allAchievements: string[] = [];
      workExperience.forEach((job: any) => {
        if (job.achievements && Array.isArray(job.achievements)) {
          allAchievements.push(...job.achievements);
        }
      });
      
      if (allAchievements.length > 0) {
        profile.keyAttributes!.accomplishments = allAchievements.slice(0, 5);
      }
    }
    
    // Add skills data
    const skills = resumeData.skills || [];
    if (skills.length > 0) {
      profile.keyAttributes!.skills = skills.map((skill: any) => skill.name || skill);
    }
  }
  
  // If this is a LinkedIn-sourced resume, add enhanced LinkedIn data
  if (dataSource === 'linkedin' && resumeData.source === 'linkedin') {
    // Transform raw LinkedIn data into optimized format for cover letter
    profile.linkedin = transformLinkedInProfileForCoverLetter(resumeData);
  }
  
  return profile;
}

/**
 * Generate a cover letter using the API
 */
export async function generateCoverLetter(params: CoverLetterGenerationParams): Promise<string> {
  try {
    // Prepare enhanced user profile data
    const userProfile = prepareResumeForCoverLetter(params.resumeData, params.dataSource);
    
    // Call the API to generate the letter
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: params.jobDescription,
        jobTitle: params.jobTitle,
        companyName: params.companyName,
        userProfile,
        tone: params.tone || 'professional',
        regenerate: params.regenerate || false,
        dataSource: params.dataSource
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate cover letter');
    }
    
    const data = await response.json();
    return data.coverLetter;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}

/**
 * Save a generated cover letter to the database
 */
export async function saveCoverLetter(
  content: string, 
  params: CoverLetterGenerationParams, 
  templateId?: string | null
): Promise<string> {
  try {
    const supabase = createBrowserClient();
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    // Insert into database
    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: session.user.id,
        job_description: params.jobDescription,
        job_title: params.jobTitle,
        company_name: params.companyName,
        content: content,
        tone: params.tone || 'professional',
        data_source: params.dataSource,
        template_id: templateId || null,
        created_at: new Date().toISOString(),
        // Store reference to resume if available
        resume_id: params.resumeData?.id || null,
        status: 'completed'
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error saving cover letter:', error);
    throw error;
  }
}