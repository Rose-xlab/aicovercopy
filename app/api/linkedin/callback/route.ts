// app/api/linkedin/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import { createResumeFromLinkedInData } from "@/lib/resumeUtils";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

// Helper function to fetch profile data
async function fetchLinkedInProfileData(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch LinkedIn profile: ${response.status} ${errorBody}`);
  }
  const profileData = await response.json();
  return {
    id: profileData.sub,
    localizedFirstName: profileData.given_name || "",
    localizedLastName: profileData.family_name || "",
    headline: profileData.headline || "",
    email: profileData.email || "",
    profile_url: profileData.preferred_username
      ? `https://www.linkedin.com/in/${profileData.preferred_username}`
      : `https://www.linkedin.com/in/${profileData.sub}`,
    profilePictureData: profileData.picture
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes`;
  let redirectUrl = new URL(baseUrl);

  try {
    // ✅ FIX: Call cookies() directly to get values. No 'await', no intermediate variable.
    const storedState = cookies().get("linkedin_oauth_state")?.value;
    let userId = cookies().get("linkedin_oauth_user_id")?.value;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (state !== storedState) throw new Error("State mismatch. CSRF attack may be in progress.");
    if (errorParam) throw new Error(`LinkedIn auth error: ${errorDescription || errorParam}`);
    if (!code) throw new Error("Missing authorization code from LinkedIn.");

    // --- All initial checks passed, proceed ---
    
    // Exchange code for token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: LINKEDIN_REDIRECT_URI!,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
    
    const tokenData = await tokenResponse.json();
    const profileData = await fetchLinkedInProfileData(tokenData.access_token);
    
    // ✅ FIX: Pass the 'cookies' function directly to the client. This is the cleanest way.
    const supabase = createRouteHandlerClient<Database>({ cookies });

    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) userId = session.user.id;
      else throw new Error("Could not determine user ID from session.");
    }
    
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    const linkedInProfileDataToStore = {
      user_id: userId,
      linkedin_id: profileData.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt.toISOString(),
      profile_url: profileData.profile_url,
      name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`.trim(),
      email: profileData.email,
      headline: profileData.headline,
      profile_picture_url: profileData.profilePictureData,
      status: "connected" as const,
      last_synced: new Date().toISOString(),
    };

    const { data: storedLinkedInProfile, error: upsertError } = await supabase
      .from("linkedin_profiles")
      .upsert(linkedInProfileDataToStore, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;
    
    const resumeResult = await createResumeFromLinkedInData(supabase, userId, storedLinkedInProfile);

    if (resumeResult.success && resumeResult.resumeId) {
      redirectUrl = new URL(`${baseUrl}/${resumeResult.resumeId}`);
      redirectUrl.searchParams.set('source', 'linkedin');
    } else {
      throw new Error(resumeResult.error || 'Resume creation failed after LinkedIn connect.');
    }

  } catch (error: any) {
    console.error("LinkedIn callback handler failed:", error);
    redirectUrl = new URL(baseUrl);
    redirectUrl.searchParams.set('error', 'callback_failed');
    redirectUrl.searchParams.set('reason', error.message || 'An unknown error occurred.');
  }

  // Create the final response and DELETE cookies from it.
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete("linkedin_oauth_state");
  response.cookies.delete("linkedin_oauth_user_id");

  return response;
}
