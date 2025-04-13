// app/api/linkedin/data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// LinkedIn API endpoints
const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

/**
 * API route to fetch detailed LinkedIn profile data using an access token
 * 
 * POST /api/linkedin/data
 * Headers: 
 * - Authorization: Bearer <access_token>
 * Body (optional): { profileId: string }
 * 
 * Returns a comprehensive LinkedIn profile data object
 */
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
    
    // Get access token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header with Bearer token is required" },
        { status: 401 }
      );
    }
    
    const accessToken = authHeader.substring(7);
    
    // Optional profile ID from request body
    const body = await request.json();
    const profileId = body.profileId;
    
    // Fetch comprehensive profile data
    const profileData = await fetchComprehensiveLinkedInData(accessToken, profileId);
    
    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error("Error fetching LinkedIn data:", error);
    
    // Handle expired or invalid token
    if (error.status === 401) {
      return NextResponse.json(
        { error: "LinkedIn access token expired or invalid" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn data: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * Fetch comprehensive LinkedIn profile data using multiple API calls
 */
async function fetchComprehensiveLinkedInData(accessToken: string, profileId?: string) {
  try {
    console.log("Fetching comprehensive LinkedIn data", profileId ? `for profile ${profileId}` : "");
    
    // Initialize object to hold all data
    const profileData: any = {};
    
    // ========== Basic Profile ==========
    let profileEndpoint = `${LINKEDIN_API_URL}/me`;
    if (profileId) {
      profileEndpoint = `${LINKEDIN_API_URL}/people/${profileId}`;
    }
    
    // Initial request for basic profile
    const basicProfileResponse = await fetch(
      `${profileEndpoint}?projection=(id,localizedFirstName,localizedLastName,headline,vanityName,profilePicture(displayImage~:playableStreams))`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    if (!basicProfileResponse.ok) {
      throw { status: basicProfileResponse.status, message: `Basic profile request failed: ${basicProfileResponse.statusText}` };
    }
    
    const basicProfile = await basicProfileResponse.json();
    Object.assign(profileData, basicProfile);
    
    // ========== Email Address ==========
    try {
      const emailResponse = await fetch(
        `${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        if (emailData.elements && emailData.elements.length > 0) {
          profileData.email = emailData.elements[0]["handle~"]?.emailAddress || null;
        }
      }
    } catch (emailError) {
      console.warn("Failed to fetch LinkedIn email:", emailError);
      // Non-critical, continue
    }
    
    // ========== Full Profile / Summary ==========
    try {
      const fullProfileResponse = await fetch(
        `${profileEndpoint}?projection=(summary,industryName,locationName,positions,geoCountryName,geoLocation)`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (fullProfileResponse.ok) {
        const fullProfile = await fullProfileResponse.json();
        Object.assign(profileData, fullProfile);
      }
    } catch (summaryError) {
      console.warn("Failed to fetch LinkedIn full profile:", summaryError);
      // Non-critical, continue
    }
    
    // ========== Positions (Experience) ==========
    try {
      const positionsResponse = await fetch(
        `${profileEndpoint}/positions?count=100`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (positionsResponse.ok) {
        const positions = await positionsResponse.json();
        profileData.positions = positions;
        
        // Set current position and company for convenience
        if (positions.elements && positions.elements.length > 0) {
          const latestPosition = positions.elements.find((p: any) => !p.endDate);
          if (latestPosition) {
            profileData.currentPosition = latestPosition.title;
            profileData.currentCompany = latestPosition.companyName;
          } else {
            // If no current position, use the most recent
            profileData.currentPosition = positions.elements[0].title;
            profileData.currentCompany = positions.elements[0].companyName;
          }
        }
      }
    } catch (positionsError) {
      console.warn("Failed to fetch LinkedIn positions:", positionsError);
      // Non-critical, continue
    }
    
    // ========== Education ==========
    try {
      const educationResponse = await fetch(
        `${profileEndpoint}/educations`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (educationResponse.ok) {
        const education = await educationResponse.json();
        profileData.educations = education;
      }
    } catch (educationError) {
      console.warn("Failed to fetch LinkedIn education:", educationError);
      // Non-critical, continue
    }
    
    // ========== Skills ==========
    try {
      const skillsResponse = await fetch(
        `${profileEndpoint}/skills`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (skillsResponse.ok) {
        const skills = await skillsResponse.json();
        profileData.skills = skills;
      }
    } catch (skillsError) {
      console.warn("Failed to fetch LinkedIn skills:", skillsError);
      // Non-critical, continue
    }
    
    // ========== Languages ==========
    try {
      const languagesResponse = await fetch(
        `${profileEndpoint}/languages?q=member&projection=(elements*(language~(name),proficiency))`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (languagesResponse.ok) {
        const languages = await languagesResponse.json();
        profileData.languages = languages;
      }
    } catch (languagesError) {
      console.warn("Failed to fetch LinkedIn languages:", languagesError);
      // Non-critical, continue
    }
    
    // ========== Certifications ==========
    try {
      const certificationsResponse = await fetch(
        `${profileEndpoint}/certifications`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (certificationsResponse.ok) {
        const certifications = await certificationsResponse.json();
        profileData.certifications = certifications;
      }
    } catch (certificationsError) {
      console.warn("Failed to fetch LinkedIn certifications:", certificationsError);
      // Non-critical, continue
    }
    
    // ========== Projects ==========
    try {
      const projectsResponse = await fetch(
        `${profileEndpoint}/projects`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        profileData.projects = projects;
      }
    } catch (projectsError) {
      console.warn("Failed to fetch LinkedIn projects:", projectsError);
      // Non-critical, continue
    }
    
    // Format profile URL if not already present
    if (!profileData.profileUrl && profileData.vanityName) {
      profileData.profileUrl = `https://www.linkedin.com/in/${profileData.vanityName}`;
    } else if (!profileData.profileUrl && profileData.id) {
      profileData.profileUrl = `https://www.linkedin.com/in/${profileData.id}`;
    }
    
    // Make both formats of field names available for compatibility
    profileData.profile_url = profileData.profileUrl || profileData.profile_url;
    
    return profileData;
  } catch (error) {
    console.error("Error fetching comprehensive LinkedIn data:", error);
    throw error;
  }
}