import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Define more specific JSON types for better type safety
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// LinkedIn API endpoints
const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

// Type definitions for LinkedIn Profile in our database
interface LinkedInProfileDB {
  id: string;
  user_id: string;
  linkedin_id?: string | null;
  access_token: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  status: "connected" | "disconnected";
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  profile_url?: string | null;
  profile_picture_url?: string | null;
  email?: string | null;
  summary?: string | null;
  position?: string | null;
  company?: string | null;
  experience_json?: Json;
  education_json?: Json;
  skills_json?: Json;
  certifications_json?: Json;
  languages_json?: Json;
  last_synced?: string | null;
}

// Type definitions for LinkedIn API responses
interface LinkedInBasicProfile {
  id?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  headline?: string;
  vanityName?: string;
  profilePicture?: {
    "displayImage~"?: {
      elements?: Array<{
        data?: {
          "com.linkedin.digitalmedia.mediaartifact.StillImage"?: {
            storageSize?: {
              width: number;
            };
          };
        };
        identifiers?: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

interface LinkedInEmailResponse {
  elements?: Array<{
    "handle~"?: {
      emailAddress: string;
    };
  }>;
}

interface LinkedInSummaryResponse {
  summary?: string;
}

interface LinkedInPosition {
  title?: string;
  companyName?: string;
  company?: {
    name?: string;
  };
  location?: {
    name?: string;
  };
  locationName?: string;
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
}

interface LinkedInPositionsResponse {
  elements?: LinkedInPosition[];
}

interface LinkedInEducation {
  schoolName?: string;
  degreeName?: string;
  fieldOfStudy?: string;
  notes?: string;
  activities?: string;
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
}

interface LinkedInEducationsResponse {
  elements?: LinkedInEducation[];
}

interface LinkedInSkill {
  name?: string;
  skill?: {
    name?: string;
  };
}

interface LinkedInSkillsResponse {
  elements?: LinkedInSkill[];
}

interface LinkedInCertification {
  name?: string;
  authority?: string;
  company?: string;
  url?: string;
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
}

interface LinkedInCertificationsResponse {
  elements?: LinkedInCertification[];
}

interface LinkedInLanguage {
  name?: string;
  proficiency?: {
    level?: string;
  } | string;
}

interface LinkedInLanguagesResponse {
  elements?: LinkedInLanguage[];
}

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { username } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    
    // First check if this user already has a LinkedIn profile
    const { data: linkedInProfile, error: fetchError } = await supabase
      .from("linkedin_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching LinkedIn profile:", fetchError);
      return NextResponse.json(
        { error: "Database error: " + fetchError.message },
        { status: 500 }
      );
    }
    
    // If profile exists with valid access token
    if (linkedInProfile && linkedInProfile.access_token) {
      console.log("Found existing LinkedIn profile with access token");
      
      // Ensure proper typing of the profile data
      const typedProfile = linkedInProfile as LinkedInProfileDB;
      
      // Check if token is expired
      if (typedProfile.token_expires_at && new Date(typedProfile.token_expires_at) < new Date()) {
        console.log("LinkedIn token expired, needs refresh");
        
        // If we have a refresh token, try to refresh the access token
        if (typedProfile.refresh_token) {
          try {
            const refreshedTokens = await refreshLinkedInToken(typedProfile.refresh_token);
            
            // Update the profile with new tokens
            const { data: updatedProfile, error: updateError } = await supabase
              .from("linkedin_profiles")
              .update({
                access_token: refreshedTokens.access_token,
                refresh_token: refreshedTokens.refresh_token || typedProfile.refresh_token,
                token_expires_at: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString()
              })
              .eq("id", typedProfile.id)
              .select()
              .single();
              
            if (updateError) throw updateError;
            
            // Now fetch the latest data with the new token
            const linkedInData = await fetchLinkedInData(refreshedTokens.access_token);
            
            // Merge the LinkedIn API data with our database record and ensure status is properly typed
            const response = {
              ...updatedProfile,
              ...linkedInData,
              status: updatedProfile.status as "connected" | "disconnected",
              last_synced: new Date().toISOString()
            };
            
            return NextResponse.json(response);
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            return NextResponse.json(
              { error: "LinkedIn token expired. Please reconnect your profile." },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "LinkedIn token expired and no refresh token. Please reconnect your profile." },
            { status: 401 }
          );
        }
      }
      
      // Token is still valid, fetch the latest data
      try {
        const linkedInData = await fetchLinkedInData(typedProfile.access_token);
        
        // Merge the LinkedIn API data with our database record and ensure status is properly typed
        const response = {
          ...typedProfile,
          ...linkedInData,
          status: typedProfile.status as "connected" | "disconnected",
          last_synced: new Date().toISOString()
        };
        
        return NextResponse.json(response);
      } catch (apiError: any) {
        console.error("Error fetching LinkedIn data:", apiError);
        
        // If unauthorized or token invalid, prompt to reconnect
        if (apiError.status === 401) {
          return NextResponse.json(
            { error: "LinkedIn token invalid. Please reconnect your profile." },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { error: "Failed to fetch LinkedIn data: " + apiError.message },
          { status: 500 }
        );
      }
    } else {
      // No profile or no access token, direct user to authenticate
      console.log("No LinkedIn profile or access token, redirect to auth");
      return NextResponse.json(
        { error: "LinkedIn profile not connected. Please authenticate with LinkedIn." },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("LinkedIn profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// Function to refresh LinkedIn access token
async function refreshLinkedInToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
  const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
  
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    throw new Error("LinkedIn client credentials are not configured");
  }
  
  console.log("Refreshing LinkedIn token...");
  
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("LinkedIn token refresh error:", error);
    throw new Error("Failed to refresh LinkedIn token: " + error);
  }
  
  return await response.json();
}

// Function to fetch real LinkedIn data using an access token
async function fetchLinkedInData(accessToken: string) {
  try {
    console.log("Fetching LinkedIn data with access token");
    
    // Comprehensive API calls to get all profile data
    const apiRequests = [
      // Basic profile
      fetch(`${LINKEDIN_API_URL}/me?projection=(id,localizedFirstName,localizedLastName,headline,vanityName,profilePicture(displayImage~:playableStreams))`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Email address
      fetch(`${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Profile summary
      fetch(`${LINKEDIN_API_URL}/people/~?projection=(summary)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Experience
      fetch(`${LINKEDIN_API_URL}/me/positions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Education
      fetch(`${LINKEDIN_API_URL}/me/educations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Skills
      fetch(`${LINKEDIN_API_URL}/me/skills`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Certifications
      fetch(`${LINKEDIN_API_URL}/me/certifications`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      
      // Languages
      fetch(`${LINKEDIN_API_URL}/me/languages`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ];
    
    // Execute all requests in parallel
    const responses = await Promise.allSettled(apiRequests);
    
    // Process responses
    let basicProfile: LinkedInBasicProfile = {};
    let email: LinkedInEmailResponse = {};
    let summary: LinkedInSummaryResponse = {};
    let positions: LinkedInPositionsResponse = {};
    let educations: LinkedInEducationsResponse = {};
    let skills: LinkedInSkillsResponse = {};
    let certifications: LinkedInCertificationsResponse = {};
    let languages: LinkedInLanguagesResponse = {};
    
    // Process each response
    try {
      const basicProfileResponse = responses[0];
      if (basicProfileResponse.status === 'fulfilled' && basicProfileResponse.value.ok) {
        basicProfile = await basicProfileResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing basic profile:", error);
    }
    
    try {
      const emailResponse = responses[1];
      if (emailResponse.status === 'fulfilled' && emailResponse.value.ok) {
        email = await emailResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing email:", error);
    }
    
    try {
      const summaryResponse = responses[2];
      if (summaryResponse.status === 'fulfilled' && summaryResponse.value.ok) {
        summary = await summaryResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing summary:", error);
    }
    
    try {
      const positionsResponse = responses[3];
      if (positionsResponse.status === 'fulfilled' && positionsResponse.value.ok) {
        positions = await positionsResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing positions:", error);
    }
    
    try {
      const educationsResponse = responses[4];
      if (educationsResponse.status === 'fulfilled' && educationsResponse.value.ok) {
        educations = await educationsResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing educations:", error);
    }
    
    try {
      const skillsResponse = responses[5];
      if (skillsResponse.status === 'fulfilled' && skillsResponse.value.ok) {
        skills = await skillsResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing skills:", error);
    }
    
    try {
      const certificationsResponse = responses[6];
      if (certificationsResponse.status === 'fulfilled' && certificationsResponse.value.ok) {
        certifications = await certificationsResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing certifications:", error);
    }
    
    try {
      const languagesResponse = responses[7];
      if (languagesResponse.status === 'fulfilled' && languagesResponse.value.ok) {
        languages = await languagesResponse.value.json();
      }
    } catch (error) {
      console.error("Error processing languages:", error);
    }
    
    // Extract email address
    let emailAddress = '';
    if (email?.elements?.[0]?.["handle~"]?.emailAddress) {
      emailAddress = email.elements[0]["handle~"].emailAddress;
    }
    
    // Build profile URL if not present
    const profileUrl = basicProfile.vanityName 
      ? `https://www.linkedin.com/in/${basicProfile.vanityName}`
      : basicProfile.id ? `https://www.linkedin.com/in/${basicProfile.id}` : '';
    
    // Return compiled data
    return {
      linkedin_id: basicProfile.id || '',
      name: `${basicProfile.localizedFirstName || ''} ${basicProfile.localizedLastName || ''}`.trim(),
      firstName: basicProfile.localizedFirstName || '',
      lastName: basicProfile.localizedLastName || '',
      headline: basicProfile.headline || '',
      profile_url: profileUrl,
      profile_picture_url: getProfilePictureUrl(basicProfile),
      email: emailAddress,
      summary: summary.summary || '',
      
      // Format positions/experiences
      positions: positions,
      experience_json: formatExperiences(positions),
      
      // Current position and company
      position: positions?.elements?.[0]?.title || '',
      company: positions?.elements?.[0]?.company?.name || '',
      
      // Other profile data
      educations: educations,
      education_json: formatEducations(educations),
      
      skills: skills,
      skills_json: formatSkills(skills),
      
      certifications: certifications,
      certifications_json: formatCertifications(certifications),
      
      languages: languages,
      languages_json: formatLanguages(languages),
      
      // Timestamp for sync
      last_synced: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching LinkedIn data:", error);
    throw error;
  }
}

// Helper function to extract profile picture URL
function getProfilePictureUrl(profileData: LinkedInBasicProfile): string | null {
  try {
    // Navigate the nested structure to get profile picture
    if (profileData.profilePicture && 
        profileData.profilePicture["displayImage~"] && 
        profileData.profilePicture["displayImage~"].elements && 
        profileData.profilePicture["displayImage~"].elements.length > 0) {
      
      // Find the highest resolution image
      const images = profileData.profilePicture["displayImage~"].elements;
      
      // Sort by width (descending) and get the first one
      images.sort((a, b) => 
        ((b.data?.["com.linkedin.digitalmedia.mediaartifact.StillImage"]?.storageSize?.width || 0) - 
         (a.data?.["com.linkedin.digitalmedia.mediaartifact.StillImage"]?.storageSize?.width || 0))
      );
      
      return images[0]?.identifiers?.[0]?.identifier || null;
    }
    return null;
  } catch (error) {
    console.error("Error extracting profile picture:", error);
    return null;
  }
}

// Helper functions to format different sections
function formatExperiences(data: LinkedInPositionsResponse): any[] {
  if (!data?.elements || !Array.isArray(data.elements)) return [];
  
  return data.elements.map((position: LinkedInPosition, index: number) => {
    // Parse dates
    let startDate = '';
    let endDate = null;
    let isOngoing = false;
    
    if (position.timePeriod?.startDate) {
      const startMonth = position.timePeriod.startDate.month?.toString().padStart(2, '0') || '01';
      const startYear = position.timePeriod.startDate.year?.toString() || '';
      if (startYear) {
        startDate = `${startYear}-${startMonth}`;
      }
    }
    
    if (position.timePeriod?.endDate) {
      const endMonth = position.timePeriod.endDate.month?.toString().padStart(2, '0') || '12';
      const endYear = position.timePeriod.endDate.year?.toString() || '';
      if (endYear) {
        endDate = `${endYear}-${endMonth}`;
      }
    } else {
      isOngoing = true;
    }
    
    // Format dateRange for display
    const dateRange = startDate ? (
      isOngoing ? `${startDate} - Present` : (endDate ? `${startDate} - ${endDate}` : startDate)
    ) : '';
    
    return {
      id: `exp-${index}`,
      title: position.title || '',
      company: position.companyName || position.company?.name || '',
      location: position.location?.name || position.locationName || '',
      description: position.description || '',
      dateRange,
      startDate,
      endDate,
      isOngoing
    };
  });
}

function formatEducations(data: LinkedInEducationsResponse): any[] {
  if (!data?.elements || !Array.isArray(data.elements)) return [];
  
  return data.elements.map((education: LinkedInEducation, index: number) => {
    // Parse dates
    let startDate = '';
    let endDate = null;
    let isOngoing = false;
    
    if (education.timePeriod?.startDate) {
      const startMonth = education.timePeriod.startDate.month?.toString().padStart(2, '0') || '01';
      const startYear = education.timePeriod.startDate.year?.toString() || '';
      if (startYear) {
        startDate = `${startYear}-${startMonth}`;
      }
    }
    
    if (education.timePeriod?.endDate) {
      const endMonth = education.timePeriod.endDate.month?.toString().padStart(2, '0') || '12';
      const endYear = education.timePeriod.endDate.year?.toString() || '';
      if (endYear) {
        endDate = `${endYear}-${endMonth}`;
      }
    } else {
      isOngoing = true;
    }
    
    // Format dateRange for display
    const dateRange = startDate ? (
      isOngoing ? `${startDate} - Present` : (endDate ? `${startDate} - ${endDate}` : startDate)
    ) : '';
    
    return {
      id: `edu-${index}`,
      school: education.schoolName || '',
      degree: education.degreeName || '',
      fieldOfStudy: education.fieldOfStudy || '',
      dateRange,
      startDate,
      endDate,
      isOngoing,
      description: education.notes || education.activities || ''
    };
  });
}

function formatSkills(data: LinkedInSkillsResponse): any[] {
  if (!data?.elements || !Array.isArray(data.elements)) return [];
  
  return data.elements.map((skill: LinkedInSkill, index: number) => {
    const skillName = skill.name || skill.skill?.name || '';
    
    // Categorize skill
    let category = 'Other';
    if (/javascript|python|java|c\+\+|ruby|php|html|css|sql|react|angular|vue|node/i.test(skillName)) {
      category = 'Technical';
    } else if (/design|photoshop|illustrator|figma|ui|ux/i.test(skillName)) {
      category = 'Design';
    } else if (/management|leadership|strategy|business|marketing|sales/i.test(skillName)) {
      category = 'Business';
    } else if (/communication|teamwork|problem.solving|critical/i.test(skillName)) {
      category = 'Soft Skills';
    }
    
    return {
      id: `skill-${index}`,
      name: skillName,
      proficiency: 'Intermediate',
      category
    };
  });
}

function formatCertifications(data: LinkedInCertificationsResponse): any[] {
  if (!data?.elements || !Array.isArray(data.elements)) return [];
  
  return data.elements.map((cert: LinkedInCertification, index: number) => {
    // Parse dates
    let date = '';
    let expiryDate = '';
    
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
      name: cert.name || '',
      issuer: cert.authority || cert.company || '',
      date,
      expiryDate,
      url: cert.url || ''
    };
  });
}

function formatLanguages(data: LinkedInLanguagesResponse): any[] {
  if (!data?.elements || !Array.isArray(data.elements)) return [];
  
  return data.elements.map((lang: LinkedInLanguage, index: number) => {
    // Map LinkedIn proficiency to our format
    let proficiency = 'Conversational';
    
    if (lang.proficiency) {
      const level = typeof lang.proficiency === 'string' ? lang.proficiency : lang.proficiency.level || '';
      
      if (/elementary/i.test(level)) {
        proficiency = 'Basic';
      } else if (/limited/i.test(level)) {
        proficiency = 'Conversational';
      } else if (/professional/i.test(level)) {
        proficiency = 'Fluent';
      } else if (/native|bilingual/i.test(level)) {
        proficiency = 'Native';
      }
    }
    
    return {
      id: `lang-${index}`,
      name: lang.name || '',
      proficiency
    };
  });
}