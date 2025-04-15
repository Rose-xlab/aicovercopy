// app/api/linkedin/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
// Import shared utilities for interacting with Official LinkedIn API
import { refreshLinkedInToken, fetchComprehensiveLinkedInData } from "@/lib/linkedinUtils";
// Import shared formatting utilities (ensure these match official API structure)
import {
    formatExperiences,
    formatEducations,
    formatSkills,
    formatCertifications,
    formatLanguages,
    formatProjects,
    getProfilePictureUrl
} from "@/lib/formattingUtils";

type Json = Database['public']['Tables']['linkedin_profiles']['Row']['education_json'];
type LinkedInProfileUpdate = Database['public']['Tables']['linkedin_profiles']['Update'];
type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];


export async function POST(request: NextRequest) {
    const start = Date.now();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    try {
        // 1. Check user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;
        console.log(`API Profile Sync: Request for user: ${userId}`);

        // 2. Get existing profile (including refresh token)
        const { data: currentProfile, error: fetchError } = await supabase
            .from("linkedin_profiles")
            .select("id, access_token, refresh_token, token_expires_at, profile_url, name") // Select needed fields
            .eq("user_id", userId)
            .eq("status", "connected")
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') { throw fetchError; }
        if (!currentProfile || !currentProfile.access_token) {
            return NextResponse.json({ error: "LinkedIn profile not connected or missing token." }, { status: 404 });
        }
        console.log(`API Profile Sync: Found connected profile ID: ${currentProfile.id}`);

        // 3. Check token expiry and refresh if needed (using util)
        let validAccessToken = currentProfile.access_token;
        let newExpirationDate = currentProfile.token_expires_at ? new Date(currentProfile.token_expires_at) : new Date(0);
        let needsTokenUpdate = false;
        let currentRefreshToken = currentProfile.refresh_token;

        if (newExpirationDate < new Date()) {
            console.log("API Profile Sync: Token expired, attempting refresh...");
            if (!currentProfile.refresh_token) {
                 await supabase.from('linkedin_profiles').update({ status: 'disconnected', access_token: null, refresh_token: null, token_expires_at: null }).eq('id', currentProfile.id);
                 return NextResponse.json({ error: "Connection expired (no refresh token)." }, { status: 401 });
            }
            try {
                const refreshed = await refreshLinkedInToken(currentProfile.refresh_token);
                validAccessToken = refreshed.access_token;
                newExpirationDate = refreshed.expires_at;
                currentRefreshToken = refreshed.refresh_token || currentRefreshToken;
                needsTokenUpdate = true;
                console.log("API Profile Sync: Token refresh successful.");
            } catch (refreshError: any) {
                console.error(`API Profile Sync: Token refresh failed for user ${userId}:`, refreshError);
                 await supabase.from('linkedin_profiles').update({ status: 'disconnected', access_token: null, refresh_token: null, token_expires_at: null }).eq('id', currentProfile.id);
                return NextResponse.json({ error: `LinkedIn token refresh failed: ${refreshError.message}. Please reconnect.` }, { status: 401 });
            }
        } else {
             console.log("API Profile Sync: Token is still valid.");
        }

        // 4. Fetch comprehensive data from LinkedIn API (using util)
        console.log("API Profile Sync: Fetching comprehensive data from LinkedIn API...");
        // Ensure your app has the necessary permissions (scopes/products) for these API calls
        const comprehensiveData = await fetchComprehensiveLinkedInData(validAccessToken);

        // 5. Format the fetched data (using utils)
        console.log("API Profile Sync: Formatting fetched data...");
        // Ensure formatters match the OFFICIAL LinkedIn API response structure
        const experience_json = formatExperiences(comprehensiveData.positions);
        const education_json = formatEducations(comprehensiveData.educations);
        const skills_json = formatSkills(comprehensiveData.skills);
        const certifications_json = formatCertifications(comprehensiveData.certifications);
        const languages_json = formatLanguages(comprehensiveData.languages);
        const projects_json = formatProjects(comprehensiveData.projects);
        const profile_picture_url = getProfilePictureUrl(comprehensiveData.basicProfile);
        const summary = comprehensiveData.summary || null;
        const headline = comprehensiveData.headline || null;
        const name = `${comprehensiveData.basicProfile?.localizedFirstName || ''} ${comprehensiveData.basicProfile?.localizedLastName || ''}`.trim() || currentProfile.name;
        const location = comprehensiveData.locationName || null;
        const position = comprehensiveData.currentPosition || null; // Extracted 'title' from current position
        const company = comprehensiveData.currentCompany || null; // Extracted 'company' name from current position

        // 6. **UPDATE** the profile in Supabase database
        // Ensure field names here match your DB columns exactly (check types/supabase.ts)
        const updatePayload: LinkedInProfileUpdate = {
            name: name,
            headline: headline,
            summary: summary,
            profile_picture_url: profile_picture_url,
            location: location,
            // FIXED: Changed 'occupation' to 'position' to match schema
            position: position,
            company: company,
            experience_json: experience_json as Json, // Ensure DB column name is correct
            education_json: education_json as Json,   // Ensure DB column name is correct
            skills_json: skills_json as Json,         // Ensure DB column name is correct
            certifications_json: certifications_json as Json, // Ensure DB column name is correct
            languages_json: languages_json as Json,   // Ensure DB column name is correct
            projects_json: projects_json as Json,     // Ensure DB column name is correct
            last_synced: new Date().toISOString(),
            status: 'connected',
            // Conditionally update token fields ONLY if they were refreshed
            ...(needsTokenUpdate && {
                 access_token: validAccessToken,
                 refresh_token: currentRefreshToken,
                 token_expires_at: newExpirationDate?.toISOString()
            })
        };

        console.log(`API Profile Sync: Updating profile ID ${currentProfile.id} in Supabase...`);
        const { data: updatedDbProfile, error: dbUpdateError } = await supabase
            .from('linkedin_profiles')
            .update(updatePayload)
            .eq('id', currentProfile.id) // Target specific profile ID
            .select('id, name, headline, status, last_synced')
            .single();

        if (dbUpdateError) {
            console.error("API Profile Sync: Error updating profile in Supabase:", dbUpdateError);
            return NextResponse.json({ error: 'Failed to save updated profile data', details: dbUpdateError.message }, { status: 500 });
        }
        if (!updatedDbProfile) {
             console.error("API Profile Sync: Update seemed successful but no profile data returned.");
             return NextResponse.json({ error: 'Failed save updated data (no profile found after update).' }, { status: 500 });
        }

        const duration = Date.now() - start;
        console.log(`API Profile Sync: Profile updated successfully. Duration: ${duration}ms`);

        // 7. Return success response
        return NextResponse.json({
             success: true,
             message: "LinkedIn profile data refreshed successfully.",
             profile: updatedDbProfile // Return snippet of updated profile
        });

    } catch (error: any) {
        const duration = Date.now() - start;
        console.error(`API Profile Sync: Unexpected error. Duration: ${duration}ms`, error);
        if (error.message.includes("Failed to fetch essential basic LinkedIn profile data")) {
             return NextResponse.json({ error: "Failed to fetch data from LinkedIn API. Check permissions/scopes.", details: error.message }, { status: 502 });
        }
        return NextResponse.json({ error: "Internal server error during profile sync", details: error.message }, { status: 500 });
    }
}