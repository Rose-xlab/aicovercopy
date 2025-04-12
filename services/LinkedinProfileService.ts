// services/LinkedinProfileService.ts

import { createBrowserClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

// Define types for LinkedIn API responses
interface LinkedInDateRange {
  startDate?: {
    month?: number;
    year?: number;
  };
  endDate?: {
    month?: number;
    year?: number;
  };
}

interface LinkedInPosition {
  title?: string;
  company?: {
    name?: string;
  };
  startDate?: {
    month?: number;
    year?: number;
  };
  endDate?: {
    month?: number;
    year?: number;
  };
  description?: string;
  location?: string;
}

interface LinkedInPositions {
  values?: LinkedInPosition[];
}

interface LinkedInEducation {
  schoolName?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: {
    month?: number;
    year?: number;
  };
  endDate?: {
    month?: number;
    year?: number;
  };
  notes?: string;
}

interface LinkedInEducations {
  values?: LinkedInEducation[];
}

interface LinkedInSkill {
  skill?: {
    name?: string;
  };
}

interface LinkedInSkills {
  values?: LinkedInSkill[];
}

interface LinkedInProfile {
  id?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  headline?: string;
  summary?: string;
  vanityName?: string;
  displayName?: string;
  profileUrl?: string;
  positions?: LinkedInPositions;
  educations?: LinkedInEducations;
  skills?: LinkedInSkills;
  location?: {
    name?: string;
  };
  accessToken?: string;
  expiresAt?: string;
}

// Define types for our app's LinkedIn profile data
export interface ExperienceEntry {
  title: string;
  company?: string;
  dateRange?: string;
  description?: string;
  location?: string;
}

export interface EducationEntry {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  dateRange?: string;
  description?: string;
}

export interface LinkedInProfileData {
  id?: string;
  user_id: string;
  profile_url: string;
  status: "connected" | "disconnected";
  name?: string;
  headline?: string;
  company?: string;
  position?: string;
  location?: string;
  summary?: string;
  experience_json?: ExperienceEntry[];
  education_json?: EducationEntry[];
  skills_json?: string[];
  last_synced: string;
  access_token?: string;
  token_expires_at?: string;
}

/**
 * Extracts the username from a LinkedIn profile URL
 * @param url - LinkedIn profile URL
 * @returns Username or null if invalid URL
 */
export function extractLinkedInUsername(url: string): string | null {
  try {
    // Handle different LinkedIn URL formats
    const regex = /linkedin\.com\/in\/([^\/\?]+)/;
    const match = url.match(regex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  } catch (error) {
    console.error("Error extracting LinkedIn username:", error);
    return null;
  }
}

/**
 * Fetches LinkedIn profile data using the LinkedIn API
 * @param profileUrl - LinkedIn profile URL
 * @returns LinkedIn profile data
 */
export async function fetchLinkedInProfile(profileUrl: string): Promise<LinkedInProfile> {
  const username = extractLinkedInUsername(profileUrl);
  
  if (!username) {
    throw new Error("Invalid LinkedIn profile URL");
  }
  
  try {
    // Call your backend API that handles the OAuth flow and API call to LinkedIn
    const response = await fetch(`/api/linkedin/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch LinkedIn profile");
    }
    
    const profileData: LinkedInProfile = await response.json();
    return profileData;
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error);
    throw error;
  }
}

/**
 * Initiates OAuth flow for LinkedIn
 * @returns Authorization URL to redirect the user
 */
export async function initiateLinkedInAuth(): Promise<string> {
  try {
    const response = await fetch('/api/linkedin/auth');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to initiate LinkedIn authentication");
    }
    
    const { authUrl } = await response.json();
    return authUrl;
  } catch (error) {
    console.error("Error initiating LinkedIn auth:", error);
    throw error;
  }
}

/**
 * Handles LinkedIn OAuth callback and retrieves access token
 * @param code - Authorization code from LinkedIn callback
 * @returns Token data including access token
 */
export async function handleLinkedInCallback(code: string): Promise<any> {
  try {
    const response = await fetch('/api/linkedin/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to complete LinkedIn authentication");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error handling LinkedIn callback:", error);
    throw error;
  }
}

/**
 * Syncs LinkedIn profile with database
 * @param supabase - Supabase client
 * @param user - Current user object
 * @param profileUrl - Optional profile URL to override existing one
 * @returns Enhanced LinkedIn profile data
 */
export async function syncLinkedInProfile(
  supabase: SupabaseClient, 
  user: { id: string }, 
  profileUrl: string | null = null
): Promise<LinkedInProfileData> {
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  try {
    // Get current profile from database
    const { data: currentProfile, error: fetchError } = await supabase
      .from("linkedin_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
      
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }
    
    // Use provided URL or existing one
    const urlToFetch = profileUrl || (currentProfile ? currentProfile.profile_url : null);
    
    if (!urlToFetch) {
      throw new Error("No LinkedIn profile URL available");
    }
    
    // Fetch fresh data from LinkedIn API
    const freshProfileData = await fetchLinkedInProfile(urlToFetch);
    
    // Prepare data for database
    const timestamp = new Date().toISOString();
    const profileToSave: LinkedInProfileData = {
      user_id: user.id,
      profile_url: urlToFetch,
      status: "connected",
      last_synced: timestamp,
      name: freshProfileData.localizedFirstName && freshProfileData.localizedLastName 
        ? `${freshProfileData.localizedFirstName} ${freshProfileData.localizedLastName}` 
        : freshProfileData.displayName || "Unknown",
      headline: freshProfileData.headline || "",
      access_token: freshProfileData.accessToken,
      token_expires_at: freshProfileData.expiresAt,
      // Add other fields from LinkedIn API response
      company: freshProfileData.positions?.values?.[0]?.company?.name,
      position: freshProfileData.positions?.values?.[0]?.title,
      location: freshProfileData.location?.name,
      summary: freshProfileData.summary,
      experience_json: mapLinkedInExperience(freshProfileData.positions),
      education_json: mapLinkedInEducation(freshProfileData.educations),
      skills_json: mapLinkedInSkills(freshProfileData.skills)
    };
    
    // Update or insert into database
    const { data: savedProfile, error: saveError } = await supabase
      .from("linkedin_profiles")
      .upsert(profileToSave)
      .select()
      .single();
      
    if (saveError) {
      throw saveError;
    }
    
    return savedProfile;
  } catch (error) {
    console.error("Error syncing LinkedIn profile:", error);
    throw error;
  }
}

/**
 * Maps LinkedIn API experience data to our format
 * @param positions - LinkedIn positions data
 * @returns Formatted experience array
 */
function mapLinkedInExperience(positions?: LinkedInPositions): ExperienceEntry[] {
  if (!positions || !positions.values) return [];
  
  return positions.values.map(position => ({
    title: position.title || "",
    company: position.company?.name,
    dateRange: formatDateRange(position.startDate, position.endDate),
    description: position.description,
    location: position.location
  }));
}

/**
 * Maps LinkedIn API education data to our format
 * @param educations - LinkedIn educations data
 * @returns Formatted education array
 */
function mapLinkedInEducation(educations?: LinkedInEducations): EducationEntry[] {
  if (!educations || !educations.values) return [];
  
  return educations.values.map(education => ({
    school: education.schoolName || "",
    degree: education.degree,
    fieldOfStudy: education.fieldOfStudy,
    dateRange: formatDateRange(education.startDate, education.endDate),
    description: education.notes
  }));
}

/**
 * Maps LinkedIn API skills data to our format
 * @param skills - LinkedIn skills data
 * @returns Formatted skills array
 */
function mapLinkedInSkills(skills?: LinkedInSkills): string[] {
  if (!skills || !skills.values) return [];
  
  return skills.values.map(skill => skill.skill?.name || "").filter(name => name !== "");
}

/**
 * Formats date range from LinkedIn format
 * @param startDate - LinkedIn start date
 * @param endDate - LinkedIn end date
 * @returns Formatted date range
 */
function formatDateRange(
  startDate?: { month?: number; year?: number }, 
  endDate?: { month?: number; year?: number }
): string {
  let start = '';
  let end = '';
  
  if (startDate) {
    start = startDate.month && startDate.year 
      ? `${startDate.month}/${startDate.year}` 
      : startDate.year?.toString() || '';
  }
  
  if (endDate) {
    end = endDate.month && endDate.year 
      ? `${endDate.month}/${endDate.year}` 
      : endDate.year?.toString() || 'Present';
  } else {
    end = 'Present';
  }
  
  return start && end ? `${start} - ${end}` : '';
}