// app/api/linkedin/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// LinkedIn OAuth 2.0 credentials
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

/**
 * API route to refresh LinkedIn access token
 * 
 * POST /api/linkedin/refresh
 * Body: { refreshToken: string }
 * 
 * Returns:
 * - access_token: new access token
 * - refresh_token: new refresh token (if available)
 * - expires_in: token expiration in seconds
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
    
    // Get refresh token from request
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }
    
    // Exchange refresh token for new access token
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!,
      }),
    });
    
    if (!response.ok) {
      // Get the error details
      const errorText = await response.text();
      console.error("LinkedIn token refresh error:", response.status, errorText);
      
      // Special case for invalid/expired refresh token
      if (response.status === 400 && errorText.includes("invalid_grant")) {
        // Update the user's LinkedIn profile to show disconnected status
        await supabase
          .from("linkedin_profiles")
          .update({
            status: "disconnected",
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
            last_synced: new Date().toISOString()
          })
          .eq("user_id", session.user.id);
          
        return NextResponse.json(
          { error: "LinkedIn refresh token has expired. Please reconnect your account." },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to refresh token: ${errorText}` },
        { status: response.status }
      );
    }
    
    const tokenData = await response.json();
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));
    
    // Update the user's LinkedIn profile with the new tokens
    const { data: updatedProfile, error: updateError } = await supabase
      .from("linkedin_profiles")
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Keep old refresh token if not provided
        token_expires_at: expiresAt.toISOString(),
        last_synced: new Date().toISOString()
      })
      .eq("user_id", session.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating LinkedIn profile with new tokens:", updateError);
      return NextResponse.json(
        { error: "Failed to update LinkedIn profile: " + updateError.message },
        { status: 500 }
      );
    }
    
    // Return the new token data
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      expires_at: expiresAt.toISOString(),
      profile_id: updatedProfile.id
    });
  } catch (error: any) {
    console.error("Error refreshing LinkedIn token:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred: " + error.message },
      { status: 500 }
    );
  }
}