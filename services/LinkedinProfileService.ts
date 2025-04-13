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
  proficiency?: string;
}

interface LinkedInSkills {
  values?: LinkedInSkill[];
}

interface LinkedInCertification {
  name?: string;
  authority?: string;
  timePeriod?: {
    startDate?: {
      month?: number;
      year?: number;
    };
    endDate?: {
      month?: number;
      year?: number;
    };
  };
  licenseNumber?: string;
  url?: string;
}

interface LinkedInCertifications {
  values?: LinkedInCertification[];
}

interface LinkedInProject {
  title?: string;
  description?: string;
  timePeriod?: {
    startDate?: {
      month?: number;
      year?: number;
    };
    endDate?: {
      month?: number;
      year?: number;
    };
  };
  url?: string;
}

interface LinkedInProjects {
  values?: LinkedInProject[];
}

interface LinkedInLanguage {
  name?: string;
  proficiency?: {
    level?: string;
    name?: string;
  };
}

interface LinkedInLanguages {
  values?: LinkedInLanguage[];
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
  certifications?: LinkedInCertifications;
  projects?: LinkedInProjects;
  languages?: LinkedInLanguages;
  location?: {
    name?: string;
  };
  // Token-related fields
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

// Define types for our app's LinkedIn profile data
export interface ExperienceEntry {
  id?: string;
  title: string;
  company?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  description?: string;
  location?: string;
  achievements?: string[];
}

export interface EducationEntry {
  id?: string;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  description?: string;
}

export interface SkillEntry {
  id?: string;
  name: string;
  proficiency?: string;
  category?: string;
}

export interface CertificationEntry {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  url?: string;
}

export interface ProjectEntry {
  id?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  technologies?: string[];
}

export interface LanguageEntry {
  id?: string;
  name: string;
  proficiency: string;
}

export interface LinkedInProfileData {
  id?: string;
  user_id: string;
  profile_url: string;
  status: "connected" | "disconnected";
  name?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  company?: string;
  position?: string;
  location?: string;
  summary?: string;
  experience_json?: ExperienceEntry[];
  education_json?: EducationEntry[];
  skills_json?: SkillEntry[];
  certifications_json?: CertificationEntry[];
  projects_json?: ProjectEntry[];
  languages_json?: LanguageEntry[];
  last_synced: string;
  access_token?: string;
  refresh_token?: string;
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
 * Parses a LinkedIn date range into standardized start and end dates
 * @param dateRange LinkedIn date range string (e.g., "Jun 2020 - Present")
 * @returns Object with parsed startDate and endDate in YYYY-MM format
 */
export function parseLinkedInDateRange(dateRange?: string): { 
  startDate: string; 
  endDate: string | null;
  isOngoing: boolean;
} {
  // Default return object
  const result = {
    startDate: "",
    endDate: null as string | null,
    isOngoing: false
  };
  
  if (!dateRange) return result;
  
  try {
    // Common date range formats:
    // "Jun 2020 - Present" or "Jun 2020 - Dec 2021" or "2020 - 2021" or "2020 - Present"
    const parts = dateRange.split(' - ');
    if (parts.length !== 2) return result;
    
    const startDateStr = parts[0].trim();
    const endDateStr = parts[1].trim();
    
    // Check if ongoing (present)
    const isOngoing = endDateStr.toLowerCase() === 'present';
    result.isOngoing = isOngoing;
    
    // Parse start date
    const startDate = parseLinkedInDate(startDateStr);
    if (startDate) {
      result.startDate = startDate;
    }
    
    // Parse end date if not ongoing
    if (!isOngoing) {
      const endDate = parseLinkedInDate(endDateStr);
      if (endDate) {
        result.endDate = endDate;
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing date range:", error);
    return result;
  }
}

/**
 * Parse a LinkedIn date string into YYYY-MM format
 * @param dateStr Date string in various formats
 * @returns Formatted date in YYYY-MM format or empty string
 */
function parseLinkedInDate(dateStr: string): string {
  try {
    // Handle various input formats
    
    // Format: "Jun 2020" (Month Year)
    const monthYearRegex = /^([a-zA-Z]{3})\s+(\d{4})$/;
    let match = dateStr.match(monthYearRegex);
    if (match) {
      const month = getMonthNumber(match[1]);
      const year = match[2];
      if (month && year) {
        return `${year}-${month.toString().padStart(2, '0')}`;
      }
    }
    
    // Format: "06/2020" (MM/YYYY)
    const numericMonthYearRegex = /^(\d{1,2})\/(\d{4})$/;
    match = dateStr.match(numericMonthYearRegex);
    if (match) {
      const month = match[1].padStart(2, '0');
      const year = match[2];
      return `${year}-${month}`;
    }
    
    // Format: Just year "2020"
    const yearOnlyRegex = /^(\d{4})$/;
    match = dateStr.match(yearOnlyRegex);
    if (match) {
      return `${match[1]}-01`; // Default to January for year-only
    }
    
    // Format: Full date "Jun 15, 2020"
    const fullDateRegex = /^([a-zA-Z]{3})\s+(\d{1,2}),\s+(\d{4})$/;
    match = dateStr.match(fullDateRegex);
    if (match) {
      const month = getMonthNumber(match[1]);
      const year = match[3];
      if (month && year) {
        return `${year}-${month.toString().padStart(2, '0')}`;
      }
    }
    
    return "";
  } catch (error) {
    console.error("Error parsing date:", error, dateStr);
    return "";
  }
}

/**
 * Convert month name to number
 * @param monthName Three-letter month abbreviation
 * @returns Month number (1-12) or null if invalid
 */
function getMonthNumber(monthName: string): number | null {
  const months: { [key: string]: number } = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  
  const key = monthName.toLowerCase().substring(0, 3);
  return months[key] || null;
}

/**
 * Fetches LinkedIn profile data using the LinkedIn API
 * @param profileUrl - LinkedIn profile URL
 * @returns LinkedIn profile data
 */
export async function fetchLinkedInProfile(profileUrl: string): Promise<LinkedInProfileData> {
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
    
    const profileData = await response.json();
    
    // Transform API data to our application format
    return transformLinkedInData(profileData);
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error);
    throw error;
  }
}

/**
 * Transform raw LinkedIn API data to our application format
 */
function transformLinkedInData(apiData: any): LinkedInProfileData {
  if (!apiData) return {} as LinkedInProfileData;
  
  // Extract name parts if available
  let firstName = "", lastName = "";
  if (apiData.name) {
    const nameParts = apiData.name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // If apiData already conforms to our LinkedInProfileData format, just return it
  if (apiData.experience_json || apiData.education_json) {
    return {
      ...apiData,
      firstName: firstName || apiData.firstName,
      lastName: lastName || apiData.lastName
    };
  }
  
  // Otherwise transform from raw API format
  return {
    id: apiData.id,
    user_id: apiData.user_id || '',
    profile_url: apiData.profile_url || apiData.profileUrl || '',
    status: apiData.status || "connected",
    name: apiData.name || apiData.displayName || `${apiData.localizedFirstName || ''} ${apiData.localizedLastName || ''}`.trim(),
    firstName: apiData.localizedFirstName || firstName,
    lastName: apiData.localizedLastName || lastName,
    headline: apiData.headline || '',
    company: apiData.company || (apiData.positions?.values?.[0]?.company?.name) || '',
    position: apiData.position || (apiData.positions?.values?.[0]?.title) || '',
    location: apiData.location?.name || apiData.location || '',
    summary: apiData.summary || '',
    experience_json: mapLinkedInExperience(apiData.positions),
    education_json: mapLinkedInEducation(apiData.educations),
    skills_json: mapLinkedInSkills(apiData.skills),
    certifications_json: mapLinkedInCertifications(apiData.certifications),
    projects_json: mapLinkedInProjects(apiData.projects),
    languages_json: mapLinkedInLanguages(apiData.languages),
    last_synced: apiData.last_synced || new Date().toISOString(),
    access_token: apiData.access_token || apiData.accessToken,
    refresh_token: apiData.refresh_token || apiData.refreshToken,
    token_expires_at: apiData.token_expires_at || apiData.expiresAt,
  };
}

/**
 * Initiates OAuth flow for LinkedIn
 * @returns Authorization URL to redirect the user
 */
export async function initiateLinkedInAuth(): Promise<string> {
  try {
    console.log("Initiating LinkedIn auth...");
    
    const response = await fetch('/api/linkedin/auth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log("LinkedIn auth response status:", response.status);
    
    if (!response.ok) {
      let errorMessage = "Failed to initiate LinkedIn authentication";
      try {
        // Try to parse as JSON first
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error("Error response:", errorData);
      } catch (e) {
        // If not JSON, get as text
        const errorText = await response.text();
        console.error("Error response body (text):", errorText);
        errorMessage += `: ${response.status} - ${errorText.substring(0, 100)}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Auth URL received:", data.authUrl ? "✅ Present" : "❌ Missing");
    
    if (!data.authUrl) {
      throw new Error('Auth URL not provided in the response');
    }
    
    return data.authUrl;
  } catch (error: any) {
    console.error("LinkedIn auth initiation error:", error);
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
 * Refreshes LinkedIn access token
 * @param refreshToken - The refresh token to use
 * @returns New token data
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<any> {
  try {
    const response = await fetch('/api/linkedin/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to refresh LinkedIn token");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error refreshing LinkedIn token:", error);
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
    
    // If we have a current profile with access token and it's not expired, use it
    if (currentProfile && currentProfile.access_token) {
      // Check if token has expired
      const tokenExpiresAt = currentProfile.token_expires_at;
      const now = new Date();
      const expiryDate = new Date(tokenExpiresAt);
      
      if (expiryDate <= now) {
        // Token expired, try to refresh
        if (currentProfile.refresh_token) {
          try {
            const refreshData = await refreshLinkedInToken(currentProfile.refresh_token);
            
            // Update the profile with new tokens
            const { data: updatedProfile, error: updateError } = await supabase
              .from("linkedin_profiles")
              .update({
                access_token: refreshData.access_token,
                refresh_token: refreshData.refresh_token || currentProfile.refresh_token,
                token_expires_at: refreshData.expires_at
              })
              .eq("id", currentProfile.id)
              .select()
              .single();
              
            if (updateError) throw updateError;
            
            // Continue with the updated profile
            const freshProfileData = await fetchFreshProfileData(updatedProfile, urlToFetch);
            return await saveProfileData(supabase, user.id, freshProfileData, updatedProfile);
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            throw new Error("Your LinkedIn connection has expired. Please reconnect your account.");
          }
        } else {
          throw new Error("LinkedIn token expired and no refresh token available. Please reconnect your account.");
        }
      } else {
        // Token still valid, fetch fresh data
        const freshProfileData = await fetchFreshProfileData(currentProfile, urlToFetch);
        return await saveProfileData(supabase, user.id, freshProfileData, currentProfile);
      }
    } else {
      // No valid profile with token, fetch fresh data using the API
      try {
        const freshProfileData = await fetchLinkedInProfile(urlToFetch);
        return await saveProfileData(supabase, user.id, freshProfileData, currentProfile);
      } catch (apiError) {
        console.error("Error fetching LinkedIn profile via API:", apiError);
        throw new Error("Failed to connect to LinkedIn. Please try again or reconnect your account.");
      }
    }
  } catch (error) {
    console.error("Error syncing LinkedIn profile:", error);
    throw error;
  }
}

/**
 * Helper function to fetch fresh LinkedIn data
 */
async function fetchFreshProfileData(profile: any, profileUrl: string): Promise<any> {
  try {
    // If we have an access token, use it to make a direct API call
    if (profile.access_token) {
      const response = await fetch('/api/linkedin/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.access_token}`
        },
        body: JSON.stringify({ profileId: profile.linkedin_id })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch LinkedIn data with access token");
      }
      
      return await response.json();
    } else {
      // Fallback to public profile fetching
      return await fetchLinkedInProfile(profileUrl);
    }
  } catch (error) {
    console.error("Error fetching fresh profile data:", error);
    throw error;
  }
}

/**
 * Helper function to save profile data to database
 */
async function saveProfileData(
  supabase: SupabaseClient,
  userId: string,
  freshData: any,
  existingProfile: any
): Promise<LinkedInProfileData> {
  const timestamp = new Date().toISOString();
  
  // Merge fresh data with existing tokens if needed
  const profileToSave: LinkedInProfileData = {
    ...freshData,
    user_id: userId,
    last_synced: timestamp,
    // Keep existing tokens if they're not in the fresh data
    access_token: freshData.access_token || (existingProfile ? existingProfile.access_token : undefined),
    refresh_token: freshData.refresh_token || (existingProfile ? existingProfile.refresh_token : undefined),
    token_expires_at: freshData.token_expires_at || (existingProfile ? existingProfile.token_expires_at : undefined),
    status: "connected"
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
}

/**
 * Maps LinkedIn API experience data to our format
 * @param positions - LinkedIn positions data
 * @returns Formatted experience array
 */
function mapLinkedInExperience(positions?: LinkedInPositions): ExperienceEntry[] {
  if (!positions || !positions.values) return [];
  
  return positions.values.map((position, index) => {
    // Parse dates
    let startDate = "";
    let endDate = null;
    let isOngoing = false;
    
    if (position.startDate) {
      const month = position.startDate.month?.toString().padStart(2, '0') || '01';
      const year = position.startDate.year?.toString() || '';
      if (year) {
        startDate = `${year}-${month}`;
      }
    }
    
    if (position.endDate) {
      const month = position.endDate.month?.toString().padStart(2, '0') || '01';
      const year = position.endDate.year?.toString() || '';
      if (year) {
        endDate = `${year}-${month}`;
      }
    } else {
      isOngoing = true;
    }
    
    // Format date range for display
    let dateRange = '';
    if (startDate) {
      dateRange = startDate;
      if (endDate) {
        dateRange += ` - ${endDate}`;
      } else if (isOngoing) {
        dateRange += ' - Present';
      }
    }
    
    // Extract achievements from description if available
    const achievements: string[] = [];
    const description = position.description || '';
    
    // Try to identify bullet points or numbered lists in description
    const bulletRegex = /[\n\r][\s]*[-•*][\s]*(.*?)(?=[\n\r]|$)/g;
    const numberedRegex = /[\n\r][\s]*\d+\.[\s]*(.*?)(?=[\n\r]|$)/g;
    
    let match;
    while ((match = bulletRegex.exec(description)) !== null) {
      if (match[1].trim()) {
        achievements.push(match[1].trim());
      }
    }
    
    while ((match = numberedRegex.exec(description)) !== null) {
      if (match[1].trim()) {
        achievements.push(match[1].trim());
      }
    }
    
    // If no clear bullet points, try to extract sentences that look like achievements
    if (achievements.length === 0) {
      const sentences = description.split(/[.!?][\s\n\r]+/);
      sentences.forEach(sentence => {
        // Look for sentences that start with action verbs and are relatively short
        const trimmed = sentence.trim();
        if (trimmed.length > 10 && trimmed.length < 150 && /^[A-Z][a-z]+ed|^[A-Z][a-z]+d\b|^[A-Z][a-z]+ted/.test(trimmed)) {
          achievements.push(trimmed);
        }
      });
    }
    
    // Clean up description by removing extracted achievements
    let cleanDescription = description;
    if (achievements.length > 0) {
      achievements.forEach(achievement => {
        cleanDescription = cleanDescription.replace(achievement, '');
      });
      
      // Clean up leftover bullet points or numbers
      cleanDescription = cleanDescription
        .replace(/[\n\r][\s]*[-•*][\s]*(?=[\n\r]|$)/g, '\n')
        .replace(/[\n\r][\s]*\d+\.[\s]*(?=[\n\r]|$)/g, '\n')
        .trim();
    }
    
    return {
      id: `exp-${index}`,
      title: position.title || "",
      company: position.company?.name,
      dateRange,
      startDate,
      endDate,
      isOngoing,
      description: cleanDescription,
      location: position.location,
      achievements: achievements.length > 0 ? achievements : undefined
    };
  });
}

/**
 * Maps LinkedIn API education data to our format
 * @param educations - LinkedIn educations data
 * @returns Formatted education array
 */
function mapLinkedInEducation(educations?: LinkedInEducations): EducationEntry[] {
  if (!educations || !educations.values) return [];
  
  return educations.values.map((education, index) => {
    // Parse dates
    let startDate = "";
    let endDate = null;
    let isOngoing = false;
    
    if (education.startDate) {
      const month = education.startDate.month?.toString().padStart(2, '0') || '01';
      const year = education.startDate.year?.toString() || '';
      if (year) {
        startDate = `${year}-${month}`;
      }
    }
    
    if (education.endDate) {
      const month = education.endDate.month?.toString().padStart(2, '0') || '01';
      const year = education.endDate.year?.toString() || '';
      if (year) {
        endDate = `${year}-${month}`;
      }
    } else {
      isOngoing = true;
    }
    
    // Format date range for display
    let dateRange = '';
    if (startDate) {
      dateRange = startDate;
      if (endDate) {
        dateRange += ` - ${endDate}`;
      } else if (isOngoing) {
        dateRange += ' - Present';
      }
    }
    
    return {
      id: `edu-${index}`,
      school: education.schoolName || "",
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      dateRange,
      startDate,
      endDate,
      isOngoing,
      description: education.notes
    };
  });
}

/**
 * Maps LinkedIn API skills data to our format
 * @param skills - LinkedIn skills data
 * @returns Formatted skills array
 */
function mapLinkedInSkills(skills?: LinkedInSkills): SkillEntry[] {
  if (!skills || !skills.values) {
    // Handle case where skills might be a simple string array
    if (Array.isArray(skills)) {
      return skills.map((skill, index) => ({
        id: `skill-${index}`,
        name: typeof skill === 'string' ? skill : skill.name || '',
        proficiency: 'Intermediate',
        category: categorizeSkill(typeof skill === 'string' ? skill : skill.name || '')
      }));
    }
    return [];
  }
  
  return skills.values.map((skillObj, index) => {
    const skillName = skillObj.skill?.name || "";
    
    return {
      id: `skill-${index}`,
      name: skillName,
      proficiency: skillObj.proficiency || 'Intermediate',
      category: categorizeSkill(skillName)
    };
  });
}

/**
 * Simple skill categorization based on common patterns
 */
function categorizeSkill(skillName: string): string {
  const lowerSkill = skillName.toLowerCase();
  
  // Tech/programming categories
  if (/javascript|python|java|c\+\+|ruby|php|swift|html|css|sql|react|angular|vue|node|express|django|ruby on rails|aws|azure|google cloud|docker|kubernetes|devops/i.test(lowerSkill)) {
    return 'Technical';
  }
  
  // Design/creative categories
  if (/design|photoshop|illustrator|indesign|figma|sketch|ui|ux|user interface|user experience|creative|adobe/i.test(lowerSkill)) {
    return 'Design';
  }
  
  // Business/management categories
  if (/management|leadership|strategy|business|marketing|sales|analytics|project management|agile|scrum|product|entrepreneurship/i.test(lowerSkill)) {
    return 'Business';
  }
  
  // Languages
  if (/english|spanish|french|german|chinese|japanese|russian|arabic|portuguese|italian/i.test(lowerSkill)) {
    return 'Language';
  }
  
  // Soft skills
  if (/communication|teamwork|problem.solving|critical thinking|creativity|adaptability|time management|collaboration|interpersonal|presentation/i.test(lowerSkill)) {
    return 'Soft Skills';
  }
  
  // Default category if no match
  return 'Other';
}

/**
 * Maps LinkedIn API certifications data to our format
 * @param certifications - LinkedIn certifications data
 * @returns Formatted certifications array
 */
function mapLinkedInCertifications(certifications?: LinkedInCertifications): CertificationEntry[] {
  if (!certifications || !certifications.values) return [];
  
  return certifications.values.map((cert, index) => {
    // Parse date
    let date = "";
    let expiryDate = "";
    
    if (cert.timePeriod?.startDate) {
      const month = cert.timePeriod.startDate.month?.toString().padStart(2, '0') || '01';
      const year = cert.timePeriod.startDate.year?.toString() || '';
      if (year) {
        date = `${year}-${month}`;
      }
    }
    
    if (cert.timePeriod?.endDate) {
      const month = cert.timePeriod.endDate.month?.toString().padStart(2, '0') || '01';
      const year = cert.timePeriod.endDate.year?.toString() || '';
      if (year) {
        expiryDate = `${year}-${month}`;
      }
    }
    
    return {
      id: `cert-${index}`,
      name: cert.name || "",
      issuer: cert.authority || "",
      date,
      expiryDate: expiryDate || undefined,
      url: cert.url
    };
  });
}

/**
 * Maps LinkedIn API projects data to our format
 * @param projects - LinkedIn projects data
 * @returns Formatted projects array
 */
function mapLinkedInProjects(projects?: LinkedInProjects): ProjectEntry[] {
  if (!projects || !projects.values) return [];
  
  return projects.values.map((project, index) => {
    // Parse dates
    let startDate = "";
    let endDate = "";
    
    if (project.timePeriod?.startDate) {
      const month = project.timePeriod.startDate.month?.toString().padStart(2, '0') || '01';
      const year = project.timePeriod.startDate.year?.toString() || '';
      if (year) {
        startDate = `${year}-${month}`;
      }
    }
    
    if (project.timePeriod?.endDate) {
      const month = project.timePeriod.endDate.month?.toString().padStart(2, '0') || '01';
      const year = project.timePeriod.endDate.year?.toString() || '';
      if (year) {
        endDate = `${year}-${month}`;
      }
    }
    
    // Try to extract technologies from the description
    const technologies: string[] = [];
    if (project.description) {
      // Look for technology keywords in description
      const techKeywords = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift',
        'HTML', 'CSS', 'SQL', 'React', 'Angular', 'Vue', 'Node.js', 'Express',
        'Django', 'Flask', 'Rails', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
        'MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'GraphQL', 'REST API'
      ];
      
      techKeywords.forEach(tech => {
        if (project.description!.includes(tech)) {
          technologies.push(tech);
        }
      });
    }
    
    return {
      id: `proj-${index}`,
      name: project.title || "",
      description: project.description || "",
      startDate,
      endDate,
      url: project.url,
      technologies
    };
  });
}

/**
 * Maps LinkedIn API languages data to our format
 * @param languages - LinkedIn languages data
 * @returns Formatted languages array
 */
function mapLinkedInLanguages(languages?: LinkedInLanguages): LanguageEntry[] {
  if (!languages || !languages.values) return [];
  
  return languages.values.map((lang, index) => {
    // Map LinkedIn proficiency levels to our format
    let proficiency = 'Conversational';
    if (lang.proficiency?.level) {
      switch (lang.proficiency.level.toLowerCase()) {
        case 'elementary':
          proficiency = 'Basic';
          break;
        case 'limited_working':
          proficiency = 'Conversational';
          break;
        case 'professional_working':
          proficiency = 'Fluent';
          break;
        case 'full_professional':
        case 'native_or_bilingual':
          proficiency = 'Native';
          break;
      }
    }
    
    return {
      id: `lang-${index}`,
      name: lang.name || "",
      proficiency
    };
  });
}