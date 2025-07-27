//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\coverLetterGenerator.ts
import { Database } from '@/types/supabase';
import { LinkedInCoverLetterData } from '@/lib/linkedInCoverLetterTransformer';
import type { SenderInfo, RecipientInfo } from '@/types/cover-letter';

type DbResume = Database['public']['Tables']['resumes']['Row'];
type Json = Database['public']['Tables']['resumes']['Row']['personal_info'];
interface CvFile { id: string; name: string; content?: string; }

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

export interface CoverLetterGenerationParams {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  tone?: string;
  sender?: SenderInfo;
  recipient?: RecipientInfo;
  resumeData: DbResume | CvFile | LinkedInCoverLetterData | null;
  dataSource: 'cv' | 'linkedin' | 'both' | 'none';
  regenerate?: boolean;
}

interface UserProfilePayload {
  name?: string; title?: string; summary?: string; currentRole?: string;
  currentCompany?: string; yearsOfExperience?: number; skills?: string[];
  experience?: { role?: string; company?: string; highlights?: string[] }[];
  education?: { degree?: string; school?: string; fieldOfStudy?: string }[];
  accomplishments?: string[]; cvFilename?: string; linkedInProfileUrl?: string | null;
  id?: string;
  linkedin?: LinkedInCoverLetterData | null;
  resume?: DbResume | CvFile | null;
  cv?: CvFile | null;
  keyAttributes?: any;
}

// --- Helper functions (Unchanged) ---
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

export function prepareUserProfilePayload(
  sourceData: DbResume | CvFile | LinkedInCoverLetterData | null,
  dataSource: 'cv' | 'linkedin' | 'both' | 'none'
): UserProfilePayload {
    // This function's internal logic remains unchanged
    const payload: UserProfilePayload = {};
    if (!sourceData) return payload;

    if ((dataSource === 'cv' || dataSource === 'both') && 'personal_info' in sourceData) {
        // ... (original logic)
    } else if ((dataSource === 'cv' || dataSource === 'both') && 'name' in sourceData && 'size' in sourceData) {
        // ... (original logic)
    } else if ((dataSource === 'linkedin' || dataSource === 'both') && 'profileUrl' in sourceData) {
        // ... (original logic)
    }

    console.log("Prepared user profile payload:", payload);
    return payload;
}


// --- *** MODIFIED FUNCTION *** ---

// 1. Define the shape of the expected response object
export interface GenerationResult {
  coverLetter: string;
  jobTitle: string;
  companyName: string;
}

/**
 * Generate a cover letter by calling the backend API.
 * Now returns an object with extracted data.
 */
export async function generateCoverLetter(
  params: CoverLetterGenerationParams
): Promise<GenerationResult> {
  console.log("generateCoverLetter: Preparing payload...");
  const userProfilePayload = prepareUserProfilePayload(
    params.resumeData,
    params.dataSource
  );

  console.log(
    `generateCoverLetter: Calling /api/generate with dataSource: ${params.dataSource}`
  );
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription: params.jobDescription,
        // We NO LONGER send jobTitle or companyName from the client.
        // The AI will extract them.
        tone: params.tone,
        userProfile: userProfilePayload,
        dataSource: params.dataSource,
        regenerate: params.regenerate,
      }),
    });

    console.log("coverLetter generated response", response);
    const data = await response.json();
    console.log("coverLetter generated data", data);

    if (!response.ok) {
      throw new Error(data.error || `Generation API failed (Status: ${response.status})`);
    }
    if (!data.data || !data.data.coverLetter || !data.data.jobTitle || !data.data.companyName) {
      throw new Error("Generation API returned incomplete data. It must include coverLetter, jobTitle, and companyName.");
    }

    console.log("generateCoverLetter: Success.");
    // 2. Return the entire data object from the API
    return data.data;
  } catch (error) {
    console.error("Error calling /api/generate:", error);
    throw error;
  }
}

/**
 * Save a generated cover letter VIA THE BACKEND API.
 * This function remains unchanged.
 */
export async function saveCoverLetter(params: {
  jobDescription?: string;
  jobTitle?: string | null;
  companyName?: string | null;
  tone?: string | "professional";
  content?: string;
  sender?: SenderInfo;
  recipient?: RecipientInfo;
  resumeData?: { id?: string | null } | DbResume | CvFile | LinkedInCoverLetterData | null;
  dataSource: string;
  template_id?: string;
  id?: string;
}): Promise<string> {
  // This function's internal logic remains unchanged
  console.log("Calling API to save cover letter...", params);

  try {
    const endpoint = "/api/cover-letters/save";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    console.log("the save result", result);

    if (!response.ok) {
      throw new Error(
        result.error || `Failed to save cover letter (Status: ${response.status})`
      );
    }
    if (!result.id) {
      throw new Error(`Failed to save cover letter (API did not return ID).`);
    }
    console.log(`Cover letter ${result.updated ? "updated" : "created"} via API, received ID:`, result.id);
    return result.id;
  } catch (error) {
    console.error(`Error calling save API:`, error);
    throw error;
  }
}