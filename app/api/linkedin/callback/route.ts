// app/api/linkedin/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// LinkedIn OAuth 2.0 credentials
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;

// TypeScript interfaces
interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface LinkedInProfilePicture {
  "displayImage~"?: {
    elements?: Array<{
      identifiers?: Array<{
        identifier?: string;
      }>;
    }>;
  };
}

interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: LinkedInProfilePicture;
}

interface LinkedInEmailData {
  elements?: Array<{
    "handle~"?: {
      emailAddress?: string;
    };
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    // Get the stored state and user ID from cookies
    const cookieStore = cookies();
    const storedState = cookieStore.get("linkedin_oauth_state")?.value;
    const userId = cookieStore.get("linkedin_oauth_user_id")?.value;
    
    // Clear the cookies
    cookieStore.delete("linkedin_oauth_state");
    cookieStore.delete("linkedin_oauth_user_id");
    
    // Verify state parameter to prevent CSRF attacks
    if (state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_state`
      );
    }
    
    // Handle errors from LinkedIn
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${error}&error_description=${errorDescription}`
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_code`
      );
    }
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: LINKEDIN_REDIRECT_URI!,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("LinkedIn token exchange error:", errorText);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=token_exchange_failed`
      );
    }
    
    const tokenData: TokenResponse = await tokenResponse.json();
    
    // Get user profile data from LinkedIn
    const profileResponse = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!profileResponse.ok) {
      console.error("LinkedIn profile fetch error:", await profileResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=profile_fetch_failed`
      );
    }
    
    const profileData: LinkedInProfile = await profileResponse.json();
    
    // Get email address (requires r_emailaddress scope)
    const emailResponse = await fetch("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    let emailData: LinkedInEmailData = {};
    if (emailResponse.ok) {
      emailData = await emailResponse.json();
    }
    
    // Store the LinkedIn access token and profile data in the database
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
    
    // Extract email from the response
    const email = emailData?.elements?.[0]?.["handle~"]?.emailAddress || "";
    
    // Extract profile URL or construct it from LinkedIn ID
    const profileUrl = `https://www.linkedin.com/in/${profileData.id}`;
    
    // Get user's profile picture URL if available
    const profilePicture = profileData.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier || "";
    
    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_user_id`
      );
    }
    
    const { error: upsertError } = await supabase
      .from("linkedin_profiles")
      .upsert({
        user_id: userId,
        linkedin_id: profileData.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        profile_url: profileUrl,
        name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
        email: email,
        profile_picture_url: profilePicture,
        status: "connected",
        last_synced: new Date().toISOString(),
      })
      .eq("user_id", userId);
    
    if (upsertError) {
      console.error("Error storing LinkedIn profile:", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=database_error`
      );
    }
    
    // Redirect to settings page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?linkedin=connected`
    );
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=unknown_error`
    );
  }
}