// app/api/linkedin/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase"; // Assuming your generated types are here
import { createResumeFromLinkedInData } from "@/lib/resumeUtils"; // Import the new utility function

// LinkedIn OAuth 2.0 credentials
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;


// Helper function (can remain here or move to utils)
function getProfilePictureUrl(profileData: any): string | null {
    try {
        if (profileData?.profilePicture?.["displayImage~"]?.elements?.length > 0) {
            const elements = profileData.profilePicture["displayImage~"].elements;
            elements.sort((a: any, b: any) => {
                const aWidth = a.data?.["com.linkedin.digitalmedia.mediaartifact.StillImage"]?.storageSize?.width || 0;
                const bWidth = b.data?.["com.linkedin.digitalmedia.mediaartifact.StillImage"]?.storageSize?.width || 0;
                return bWidth - aWidth;
            });
            return elements[0]?.identifiers?.[0]?.identifier || null;
        }
        return null;
    } catch (error) {
        console.error("Error extracting profile picture URL:", error);
        return null;
    }
}

// Helper function (can remain here or move to utils)
async function fetchLinkedInProfileData(accessToken: string) {
    try {
        const response = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch LinkedIn profile: ${response.status} ${response.statusText}`);
        }
        const profileData = await response.json();
        console.log("LinkedIn UserInfo response:", JSON.stringify(profileData, null, 2));

        // Map OpenID Connect fields
        return {
            id: profileData.sub,
            localizedFirstName: profileData.given_name || "",
            localizedLastName: profileData.family_name || "",
            headline: profileData.headline || "", // May not be available via userinfo
            vanityName: profileData.preferred_username || "", // May not be available via userinfo
            email: profileData.email || "",
            profile_url: profileData.preferred_username
                ? `https://www.linkedin.com/in/${profileData.preferred_username}`
                : `https://www.linkedin.com/in/${profileData.sub}`, // Fallback to sub ID for URL
             profilePictureData: profileData.picture // Pass raw picture URL
        };
    } catch (error) {
        console.error("Error fetching LinkedIn profile data:", error);
        throw error;
    }
}


export async function GET(request: NextRequest): Promise<NextResponse> {
    const cookieStore = cookies(); // Initialize cookieStore early
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        console.log("LinkedIn callback received:", { code: !!code, state: !!state, error });

        const storedState = cookieStore.get("linkedin_oauth_state")?.value;
        const userId = cookieStore.get("linkedin_oauth_user_id")?.value;

        console.log("Stored state:", storedState);
        console.log("State match:", state === storedState);

        // Clear cookies immediately after reading
        cookieStore.delete("linkedin_oauth_state");
        cookieStore.delete("linkedin_oauth_user_id");

        // State validation (strict in production)
        if (process.env.NODE_ENV !== "development" && state !== storedState) {
            console.error("State mismatch in production:", { received: state, stored: storedState });
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=invalid_state`);
        }
        if (process.env.NODE_ENV === "development" && state !== storedState) {
             console.warn("State mismatch in development, proceeding anyway...");
        }

        if (error) {
            console.error("LinkedIn auth error:", error, errorDescription);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=${error}&desc=${errorDescription}`);
        }
        if (!code) {
            console.error("Missing authorization code");
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=missing_code`);
        }

        // --- Token Exchange ---
        console.log("Exchanging code for tokens...");
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

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("LinkedIn token exchange error:", tokenResponse.status, errorText);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=token_exchange_failed`);
        }
        const tokenData = await tokenResponse.json();
        console.log("Token data received:", { access_token: !!tokenData.access_token, id_token: !!tokenData.id_token, expires_in: tokenData.expires_in });

        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // --- Fetch Profile ---
        console.log("Fetching profile data...");
        const profileData = await fetchLinkedInProfileData(tokenData.access_token);

        // --- User ID Check ---
        let finalUserId = userId;
        if (!finalUserId) {
            console.warn("Missing user ID in cookies. Trying to recover from session (dev only).");
             if (process.env.NODE_ENV === "development") {
                const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                     finalUserId = session.user.id;
                     console.log("Recovered user ID from session:", finalUserId);
                } else {
                     console.error("Failed to recover user ID from session.");
                     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=missing_user_id`);
                }
             } else {
                 console.error("Missing user ID in production.");
                 return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=missing_user_id`);
             }
        }

        // --- Process Profile & Create Resume ---
        console.log("Processing LinkedIn profile for user:", finalUserId);
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

        const linkedInProfileDataToStore = {
            user_id: finalUserId,
            linkedin_id: profileData.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            token_expires_at: expiresAt.toISOString(),
            profile_url: profileData.profile_url,
            name: `${profileData.localizedFirstName || ''} ${profileData.localizedLastName || ''}`.trim(),
            email: profileData.email || "",
            headline: profileData.headline || "",
            profile_picture_url: profileData.profilePictureData, // Use raw URL from userinfo
            status: "connected" as const, // Explicitly type status
            last_synced: new Date().toISOString(),
            // Initialize other fields potentially fetched later as null or empty arrays
            experience_json: [],
            education_json: [],
            skills_json: [],
            certifications_json: [],
            languages_json: [],
            projects_json: [],
            summary: null,
            position: null,
            company: null,
            location: null,
        };

        console.log("Storing/Updating LinkedIn profile in database...");
        const { data: storedLinkedInProfile, error: upsertError } = await supabase
            .from("linkedin_profiles")
            .upsert(linkedInProfileDataToStore, { onConflict: 'user_id' }) // Upsert based on user_id conflict
            .select()
            .single();

        if (upsertError) {
            console.error("Error storing LinkedIn profile:", upsertError);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=database_error&reason=${upsertError.code}`);
        }

        console.log("LinkedIn profile stored successfully. Profile ID:", storedLinkedInProfile.id);

        // --- Direct Resume Creation ---
        console.log("Attempting direct resume creation...");
        // Pass the newly stored/updated profile data to the creation function
        const resumeResult = await createResumeFromLinkedInData(
            supabase,
            finalUserId,
            storedLinkedInProfile // Pass the complete profile record from the upsert result
        );

        if (resumeResult.success && resumeResult.resumeId) {
            console.log("Direct resume creation successful. Resume ID:", resumeResult.resumeId);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes/${resumeResult.resumeId}?source=linkedin`);
        } else {
            console.error("Direct resume creation failed:", resumeResult.error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?linkedin=connected&resume=failed&reason=${encodeURIComponent(resumeResult.error || 'Unknown')}`);
        }

    } catch (error: any) {
        console.error("LinkedIn callback general error:", error);
        // Distinguish API errors from programming errors if possible
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resumes?error=callback_failed&reason=${encodeURIComponent(errorMessage)}`);
    }
}