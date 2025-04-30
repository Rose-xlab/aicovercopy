// app/api/linkedin/import-proxycurl/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Your Supabase types
// Import your formatting functions (ensure path is correct)
import {
    formatExperiences,
    formatEducations,
    formatSkills,
    formatCertifications,
    formatLanguages,
    formatProjects,
    getProfilePictureUrl
} from '@/lib/formattingUtils'; // Utility file created previously

// Define types based on your Supabase schema
type Json = Database['public']['Tables']['linkedin_profiles']['Row']['education_json'];
// Use the Insert type for creating the payload for upsert, as it enforces required fields like profile_url
type LinkedInProfileInsert = Database['public']['Tables']['linkedin_profiles']['Insert'];
// Use the Update type just for reference if needed, but upsert primarily aligns with Insert structure + conflict target
type LinkedInProfileUpdate = Database['public']['Tables']['linkedin_profiles']['Update'];

const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY;
// Endpoint for Person Profile based on provided docs
const PROXYCURL_PERSON_ENDPOINT = 'https://nubela.co/proxycurl/api/v2/linkedin'; // From docs

export async function POST(request: NextRequest) {
    const start = Date.now();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // !! WARNING: Using this route relies on Proxycurl scraping, which violates LinkedIn ToS and carries risks. !!

    try {
        // 1. Check user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;
        console.log(`Import-Proxycurl: Request received for user: ${userId}`);

        // 2. Get target URL from request body
        let targetLinkedInUrl: string | undefined;
        try {
            const body = await request.json();
            targetLinkedInUrl = body.targetLinkedInUrl;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Validate URL format
        if (!targetLinkedInUrl || typeof targetLinkedInUrl !== 'string' || !targetLinkedInUrl.includes('linkedin.com/in/')) {
            return NextResponse.json({ error: 'Valid target LinkedIn profile URL (e.g., https://linkedin.com/in/...) is required' }, { status: 400 });
        }
        console.log(`Import-Proxycurl: Target URL: ${targetLinkedInUrl}`); // targetLinkedInUrl is confirmed string here

        // 3. Check for Proxycurl API Key
        if (!PROXYCURL_API_KEY) {
            console.error("Import-Proxycurl: PROXYCURL_API_KEY not set");
            return NextResponse.json({ error: 'Server configuration error: Missing API key' }, { status: 500 });
        }

        // 4. Call Proxycurl API
        console.log(`Import-Proxycurl: Calling Proxycurl API for ${targetLinkedInUrl}...`);
        const params = new URLSearchParams({
            linkedin_profile_url: targetLinkedInUrl,
            skills: 'include',
            use_cache: 'if-present'
        });
        const proxycurlUrlWithParams = `${PROXYCURL_PERSON_ENDPOINT}?${params.toString()}`;

        const proxycurlResponse = await fetch(proxycurlUrlWithParams, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${PROXYCURL_API_KEY}` }
        });

        const creditsUsed = proxycurlResponse.headers.get('X-Proxycurl-Credit-Cost');
        console.log(`Import-Proxycurl: Proxycurl call completed. Status: ${proxycurlResponse.status}. Credits Used: ${creditsUsed || 'N/A'}`);

        if (!proxycurlResponse.ok) { /* ... handle Proxycurl errors ... */
            let errorDetails: any = await proxycurlResponse.text();
            try { errorDetails = JSON.parse(errorDetails); } catch (e) { /* ignore */ }
            console.error(`Import-Proxycurl: Proxycurl API error: ${proxycurlResponse.status}`, errorDetails);
            let userMessage = 'Failed to fetch data from provider.';
            if (proxycurlResponse.status === 401) userMessage = 'Provider authentication failed (Invalid API Key?).';
            else if (proxycurlResponse.status === 403) userMessage = 'Provider access denied (Out of credits?).';
            else if (proxycurlResponse.status === 404) userMessage = 'Profile not found by provider.';
            else if (proxycurlResponse.status === 429) userMessage = 'Provider rate limit hit. Please try again later.';
            return NextResponse.json({ error: userMessage, status: proxycurlResponse.status, details: errorDetails }, { status: 502 });
        }

        const proxycurlData = await proxycurlResponse.json();
        console.log("Import-Proxycurl: Received data from Proxycurl.");

        if (!proxycurlData || !proxycurlData.public_identifier) {
            return NextResponse.json({ error: 'Received incomplete data from provider.' }, { status: 502 });
        }

        // 5. Format the data
        console.log("Import-Proxycurl: Formatting data...");
        const experience_json = formatExperiences(proxycurlData.experiences);
        const education_json = formatEducations(proxycurlData.education);
        const skills_json = formatSkills(proxycurlData.skills);
        const certifications_json = formatCertifications(proxycurlData.certifications);
        const languages_json = formatLanguages(proxycurlData.languages_and_proficiencies);
        const projects_json = formatProjects(proxycurlData.accomplishment_projects);
        const profile_picture_url = getProfilePictureUrl(proxycurlData);
        const summary = proxycurlData.summary || null;
        const headline = proxycurlData.headline || null;
        const name = proxycurlData.full_name || null;
        const location = proxycurlData.city ? `${proxycurlData.city}, ${proxycurlData.state || proxycurlData.country || ''}`.replace(/, $/,'').trim() : null;
        const position = proxycurlData.occupation || (proxycurlData.experiences?.[0]?.title || null); // Use occupation or fallback to first experience title
        const company = proxycurlData.experiences?.[0]?.company || null; // Best guess for current company

        // 6. Prepare data for Supabase Upsert
        // This object MUST match the structure expected by `linkedin_profiles` Insert/Update
        // Use snake_case for column names as defined in types/supabase.ts
        const dataToUpsert: LinkedInProfileInsert = {
            user_id: userId, // Required for conflict resolution
            linkedin_id: proxycurlData.public_identifier, // Map from Proxycurl
            profile_url: targetLinkedInUrl, // Required string - use the validated input URL
            name: name,
            headline: headline,
            summary: summary,
            profile_picture_url: profile_picture_url,
            location: location,
            position: position, // FIXED: Use 'position' column name
            company: company,
            experience_json: experience_json as Json, // Use DB column name
            education_json: education_json as Json,   // Use DB column name
            skills_json: skills_json as Json,         // Use DB column name
            certifications_json: certifications_json as Json, // Use DB column name
            languages_json: languages_json as Json,   // Use DB column name
            projects_json: projects_json as Json,     // Use DB column name
            last_synced: new Date().toISOString(),
            status: 'connected',
            // Ensure potentially null fields from Proxycurl are handled correctly
            access_token: null, // Clear any old OAuth tokens on Proxycurl import
            refresh_token: null,
            token_expires_at: null,
            profile_data: null // Clear or populate if needed
            // id: undefined // Let Supabase handle ID generation or update
        };

        console.log(`Import-Proxycurl: Upserting profile in Supabase for user: ${userId}`);
        // Use upsert with user_id conflict target
        const { data: upsertedProfile, error: upsertError } = await supabase
            .from('linkedin_profiles')
            .upsert(dataToUpsert, { onConflict: 'user_id'}) // Assumes user_id has UNIQUE constraint
            .select('id, last_synced') // Select minimal data back
            .single();

        if (upsertError) {
            console.error("Import-Proxycurl: Error upserting Supabase:", upsertError);
            return NextResponse.json({ error: 'Failed to save imported profile data', details: upsertError.message }, { status: 500 });
        }
        if (!upsertedProfile) {
             return NextResponse.json({ error: 'Failed save imported data (no profile found after upsert).' }, { status: 500 });
        }

        const duration = Date.now() - start;
        console.log(`Import-Proxycurl: Profile imported/upserted. DB ID: ${upsertedProfile.id}. Last synced: ${upsertedProfile.last_synced}. Duration: ${duration}ms`);

        // 7. Return Success Response to Frontend
        return NextResponse.json({
             success: true,
             message: 'Profile data imported successfully via URL.',
             last_synced: upsertedProfile.last_synced
        });

    } catch (error: any) {
        const duration = Date.now() - start;
        console.error(`Import-Proxycurl: Unexpected handler error. Duration: ${duration}ms`, error);
        return NextResponse.json({ error: 'An unexpected server error occurred during import.', details: error.message }, { status: 500 });
    }
}