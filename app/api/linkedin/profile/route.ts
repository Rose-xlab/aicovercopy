// app/api/linkedin/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

interface RequestBody {
  username: string;
}

interface LinkedInProfile {
  id: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  headline?: string;
  vanityName?: string;
  profilePicture?: any;
}

interface LinkedInPositionsData {
  elements?: Array<{
    title?: string;
    company?: {
      name?: string;
    };
    timePeriod?: any;
    location?: string;
  }>;
}

interface LinkedInSkillsData {
  elements?: Array<{
    name?: string;
    level?: string;
  }>;
}

interface LinkedInEducationsData {
  elements?: Array<{
    schoolName?: string;
    degree?: string;
    fieldOfStudy?: string;
    timePeriod?: any;
    activities?: string;
    notes?: string;
  }>;
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
    const body: RequestBody = await request.json();
    const { username } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    
    // Get the LinkedIn profile from the database
    const { data: linkedinProfile, error: fetchError } = await supabase
      .from("linkedin_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: "LinkedIn profile not found or not connected" },
        { status: 404 }
      );
    }
    
    // Check if access token is expired
    const tokenExpiresAt = new Date(linkedinProfile.token_expires_at);
    const now = new Date();
    
    if (now > tokenExpiresAt) {
      // Token is expired, need to refresh or reconnect
      return NextResponse.json(
        { error: "LinkedIn access token expired. Please reconnect your account." },
        { status: 401 }
      );
    }
    
    // Use the access token to fetch profile data from LinkedIn API
    const profileResponse = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,headline,profilePicture(displayImage~:playableStreams),vanityName)", {
      headers: {
        Authorization: `Bearer ${linkedinProfile.access_token}`,
      },
    });
    
    if (!profileResponse.ok) {
      console.error("LinkedIn profile fetch error:", await profileResponse.text());
      return NextResponse.json(
        { error: "Failed to fetch profile data from LinkedIn" },
        { status: 500 }
      );
    }
    
    const basicProfile: LinkedInProfile = await profileResponse.json();
    
    // Fetch additional data - position/employment
    const positionsResponse = await fetch("https://api.linkedin.com/v2/positions?q=member&projection=(elements*(title,company(name),timePeriod,location))", {
      headers: {
        Authorization: `Bearer ${linkedinProfile.access_token}`,
      },
    });
    
    let positions: LinkedInPositionsData = { elements: [] };
    if (positionsResponse.ok) {
      const positionsData = await positionsResponse.json();
      positions.elements = positionsData.elements || [];
    }
    
    // Fetch skills
    const skillsResponse = await fetch("https://api.linkedin.com/v2/skills?q=member&projection=(elements*(name,level))", {
      headers: {
        Authorization: `Bearer ${linkedinProfile.access_token}`,
      },
    });
    
    let skills: LinkedInSkillsData = { elements: [] };
    if (skillsResponse.ok) {
      const skillsData = await skillsResponse.json();
      skills.elements = skillsData.elements || [];
    }
    
    // Fetch education
    const educationResponse = await fetch("https://api.linkedin.com/v2/educations?q=member&projection=(elements*(schoolName,degree,fieldOfStudy,timePeriod,activities,notes))", {
      headers: {
        Authorization: `Bearer ${linkedinProfile.access_token}`,
      },
    });
    
    let educations: LinkedInEducationsData = { elements: [] };
    if (educationResponse.ok) {
      const educationData = await educationResponse.json();
      educations.elements = educationData.elements || [];
    }
    
    // Combine all profile data
    const combinedProfile = {
      ...basicProfile,
      positions,
      skills,
      educations,
      accessToken: linkedinProfile.access_token,
      expiresAt: linkedinProfile.token_expires_at,
      displayName: `${basicProfile.localizedFirstName || ''} ${basicProfile.localizedLastName || ''}`.trim(),
      profileUrl: `https://www.linkedin.com/in/${basicProfile.vanityName || basicProfile.id}`,
    };
    
    // Update the last_synced timestamp in the database
    await supabase
      .from("linkedin_profiles")
      .update({
        last_synced: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);
    
    return NextResponse.json(combinedProfile);
  } catch (error) {
    console.error("LinkedIn profile API error:", error);
    return NextResponse.json(
      { error: "Failed to process LinkedIn profile request" },
      { status: 500 }
    );
  }
}