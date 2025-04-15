// services/LinkedinProfileService.ts

import { Database } from '@/types/supabase'; // Assuming your generated types

// Define the primary data structure expected from the DB/backend API
// Ensure this matches the structure returned by your API routes and stored in the DB
export interface LinkedInProfileData {
    id?: string; // Primary key from linkedin_profiles table
    user_id: string;
    profile_url: string | null;
    status: "connected" | "disconnected";
    name?: string | null;
    headline?: string | null;
    company?: string | null;
    // Use 'occupation' or 'position' consistently based on your DB schema
    occupation?: string | null;
    // position?: string | null;
    location?: string | null;
    summary?: string | null;
    // Use correct names for your JSON columns (e.g., experiences or experience_json)
    experiences?: any[] | null; // Consider defining a stricter type for ExperienceEntry
    // experience_json?: any[] | null;
    education?: any[] | null; // Consider defining EducationEntry type
    // education_json?: any[] | null;
    skills?: any[] | null; // Consider defining SkillEntry type
    // skills_json?: any[] | null;
    certifications?: any[] | null; // Consider defining CertificationEntry type
    // certifications_json?: any[] | null;
    projects?: any[] | null; // Consider defining ProjectEntry type
    // projects_json?: any[] | null;
    languages?: any[] | null; // Consider defining LanguageEntry type
    // languages_json?: any[] | null;
    last_synced?: string | null;
    linkedin_id?: string | null; // LinkedIn's own ID for the user
    // Token fields might not be needed directly in frontend components often
    // access_token?: string | null;
    // refresh_token?: string | null;
    // token_expires_at?: string | null;
}

// Custom Error class to potentially pass status code
class ServiceError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

/**
 * Extracts the username from a LinkedIn profile URL.
 * @param url - LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)
 * @returns Username string or null if invalid format.
 */
export function extractLinkedInUsername(url: string): string | null {
    if (!url) return null;
    try {
        // Regex to capture the part after /in/ until the next / or ? or end of string
        const match = url.match(/linkedin\.com\/in\/([^\/?]+)/);
        return (match && match[1]) ? match[1].trim() : null;
    } catch (error) {
        console.error("Service Error extracting LinkedIn username:", error);
        return null;
    }
}

/**
 * Calls the backend API to get the LinkedIn OAuth authorization URL.
 * @returns The authorization URL string to redirect the user to.
 * @throws If the backend API call fails or doesn't return a valid URL.
 */
export async function initiateLinkedInAuth(): Promise<string> {
    console.log("Service: Initiating LinkedIn auth via backend...");
    const response = await fetch('/api/linkedin/auth'); // GET request

    const data = await response.json(); // Attempt to parse JSON always

    if (!response.ok) {
        const errorMsg = data?.error || `Failed to initiate LinkedIn auth (Status: ${response.status})`;
        console.error(`Service Error initiateLinkedInAuth: ${response.status}`, data);
        throw new Error(errorMsg);
    }

    if (!data.authUrl) {
        console.error("Service Error initiateLinkedInAuth: No authUrl in response");
        throw new Error('Auth URL not provided by backend.');
    }
    console.log("Service: Auth URL received from backend.");
    return data.authUrl;
}

/**
 * Calls the backend API to import/sync profile data using Proxycurl via URL.
 * Assumes the backend route handles fetching, formatting, and DB update.
 * @param targetLinkedInUrl - The public LinkedIn profile URL.
 * @returns The result object from the backend API (e.g., { success: true, message: ..., last_synced: ... }).
 * @throws If the backend API call fails or returns an error structure.
 */
export async function importProfileViaProxycurlAPI(targetLinkedInUrl: string): Promise<{success: boolean; message?: string; last_synced?: string;}> {
     console.log(`Service: Calling backend Proxycurl import API for ${targetLinkedInUrl}`);
     const response = await fetch('/api/linkedin/import-proxycurl', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ targetLinkedInUrl }),
     });

     const result = await response.json(); // Attempt to parse JSON always

     if (!response.ok) {
         console.error(`Service Error importProfileViaProxycurlAPI: ${response.status}`, result);
         throw new Error(result.error || `Import via URL failed (Status: ${response.status})`);
     }
     console.log("Service: Backend Proxycurl import API call successful.");
     return result; // Return the success data { success: true, ... }
}

/**
 * Calls the backend API to refresh the stored LinkedIn profile data.
 * Assumes the backend '/api/linkedin/profile' route handles token refresh,
 * fetching from LinkedIn API, formatting, and updating the database.
 * @returns A partial profile object with updated fields (e.g., { id, name, last_synced }) returned by the backend.
 * @throws If the backend API call fails, potentially including status code.
 */
export async function refreshStoredLinkedInProfile(): Promise<Partial<LinkedInProfileData>> {
    // NOTE: This relies on '/api/linkedin/profile' being refactored correctly on the backend.
    console.log("Service: Calling backend to refresh stored LinkedIn profile via official API token...");
    const response = await fetch('/api/linkedin/profile', {
        method: 'POST', // Or GET? Ensure backend route matches
        headers: { 'Content-Type': 'application/json' },
        // Body may not be needed if backend uses session user ID
    });

    const data = await response.json(); // Attempt to parse JSON always

    if (!response.ok) {
         console.error(`Service Error refreshStoredLinkedInProfile: ${response.status}`, data);
         const errorMessage = data.error || `Failed to refresh profile (Status: ${response.status})`;
         // Throw a custom error containing the status code for specific handling in hooks/components
         throw new ServiceError(errorMessage, response.status);
    }
    console.log("Service: Backend profile refresh successful.");
    // Expect backend to return { success: true, profile: { ... } }
    return data.profile || {}; // Return the updated profile snippet
}

/**
 * Calls the backend API to generate a resume from a stored LinkedIn profile.
 * Assumes the backend '/api/resumes/from-linkedin' route is refactored correctly.
 * @param linkedInProfileId - The database ID (UUID) of the 'linkedin_profiles' record.
 * @returns The ID (UUID) of the newly created resume record.
 * @throws If the backend API call fails or doesn't return a resumeId.
 */
export async function generateResumeFromStoredProfile(linkedInProfileId: string): Promise<string> {
    // NOTE: This relies on '/api/resumes/from-linkedin' being refactored correctly on the backend.
     if (!linkedInProfileId) {
          throw new Error("LinkedIn Profile ID is required to generate resume.");
     }
     console.log(`Service: Calling backend to generate resume from DB profile ID: ${linkedInProfileId}`);
     const response = await fetch('/api/resumes/from-linkedin', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ linkedInProfileId }), // Send the DB ID
     });

     const data = await response.json(); // Attempt to parse JSON always

     if (!response.ok) {
         console.error(`Service Error generateResumeFromStoredProfile: ${response.status}`, data);
         throw new Error(data.error || `Failed to generate resume (Status: ${response.status})`);
     }

     if (!data.resumeId) {
         console.error("Service Error generateResumeFromStoredProfile: No resumeId in response");
         throw new Error("Backend did not return a resume ID after creation.");
     }

     console.log("Service: Backend resume generation successful. Resume ID:", data.resumeId);
     return data.resumeId;
}

// Note: Functions for data transformation (mapLinkedIn*, transformLinkedInData, parseDate*)
// and direct token handling (handleLinkedInCallback, refreshLinkedInToken standalone)
// have been removed as this logic should now reside primarily on the backend.
// The disconnectLinkedIn logic can remain in the hook as it's a direct DB update via Supabase client.