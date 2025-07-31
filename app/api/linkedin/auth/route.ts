// app/api/linkedin/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import crypto from 'crypto';

// LinkedIn OAuth 2.0 credentials
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

export async function GET(request: NextRequest) {
  try {
    // Log environment variables to debug
    console.log("LinkedIn Auth - Environment check:", {
      clientIdExists: !!LINKEDIN_CLIENT_ID,
      redirectUriExists: !!LINKEDIN_REDIRECT_URI,
      redirectUri: LINKEDIN_REDIRECT_URI,
      nodeEnv: process.env.NODE_ENV || "not set"
    });
    
    // This is for READING incoming cookies to initialize Supabase
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
    
    // Generate a random state parameter to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString('hex');
    console.log("Generated secure state parameter:", state);
    
    // Updated scopes matching what's available in LinkedIn Developer Console
    const scopes = ['openid', 'profile', 'email'];
    const encodedScopes = encodeURIComponent(scopes.join(' '));
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI!)}&state=${state}&scope=${encodedScopes}`;
    
    console.log("Generated LinkedIn auth URL:", authUrl.substring(0, 100) + "...");
    
    // ✅ FIX: Create the response object first
    const response = NextResponse.json({ authUrl });

    // ✅ FIX: Set cookies on the OUTGOING response, not the incoming request
    response.cookies.set("linkedin_oauth_state", state, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });
    
    response.cookies.set("linkedin_oauth_user_id", session.user.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });
    
    // ✅ FIX: Return the response object with the cookies attached
    return response;

  } catch (error) {
    console.error("LinkedIn auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate LinkedIn authentication", details: String(error) },
      { status: 500 }
    );
  }
}
