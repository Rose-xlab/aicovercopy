// lib/linkedinUtils.ts
import { Database } from '@/types/supabase'; // Assuming your generated types

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

type Json = Database['public']['Tables']['linkedin_profiles']['Row']['education_json'];

// Define interface for API errors to include status
interface LinkedInApiError extends Error {
    status?: number;
}

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

/**
 * Refreshes an expired LinkedIn access token using a refresh token.
 * @param refreshToken - The refresh token from the stored profile.
 * @returns The new token data including access_token and new expires_at Date.
 * @throws If refresh fails or credentials are not configured.
 */
export async function refreshLinkedInToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_at: Date;
}> {
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
        console.error("LinkedIn client credentials missing in environment variables.");
        throw new Error("LinkedIn client credentials are not configured");
    }

    console.log("LinkedIn Utils: Attempting to refresh LinkedIn token...");
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("LinkedIn Utils: Token refresh failed:", response.status, errorText);
        const error: LinkedInApiError = new Error(`Failed to refresh LinkedIn token: ${errorText}`);
        error.status = response.status;
        throw error;
    }

    const tokenData: TokenRefreshResponse = await response.json();
    // Calculate expiration relative to *now*
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    console.log("LinkedIn Utils: Token refreshed successfully.");
    return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token, // Include if returned
        expires_at: expiresAt
    };
}


/**
 * Fetches comprehensive LinkedIn profile data using multiple OFFICIAL LinkedIn API calls.
 * Handles parallel requests and gracefully degrades if some endpoints fail.
 * NOTE: Requires appropriate scopes (e.g., openid, profile, email, r_liteprofile) granted by the user
 * AND potentially specific Product access approved in the LinkedIn Developer Portal.
 * @param accessToken - A valid LinkedIn access token.
 * @returns A structured object containing all fetched raw data (needs formatting).
 * @throws If essential basic profile data cannot be fetched (likely permissions issue).
 */
export async function fetchComprehensiveLinkedInData(accessToken: string): Promise<any> {
    const headers = { Authorization: `Bearer ${accessToken}`, 'cache-control': 'no-cache', 'X-Restli-Protocol-Version': '2.0.0' };
    const results: any = {};

    console.log("LinkedIn Utils: Fetching comprehensive data from Official LinkedIn API...");

    // Define API requests
    const requests = [
        { key: 'basicProfile', url: `${LINKEDIN_API_URL}/me?projection=(id,localizedFirstName,localizedLastName,headline,profilePicture(displayImage~:playableStreams))` },
        { key: 'email', url: `${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))` },
        { key: 'profileDetails', url: `${LINKEDIN_API_URL}/me?projection=(summary,location:(countryCode,preferredLocale,postalCode),industryName)` },
        { key: 'positions', url: `${LINKEDIN_API_URL}/me/positions?count=50` },
        { key: 'educations', url: `${LINKEDIN_API_URL}/me/educations?count=50` },
        { key: 'skills', url: `${LINKEDIN_API_URL}/me/skills?count=100` },
        { key: 'certifications', url: `${LINKEDIN_API_URL}/me/certifications?count=50` },
        { key: 'languages', url: `${LINKEDIN_API_URL}/me/languages?q=member&projection=(elements*(language~(name),proficiency))` },
        { key: 'projects', url: `${LINKEDIN_API_URL}/me/projects?count=50` },
    ];

    // Execute requests in parallel
    const promises = requests.map(req =>
        fetch(req.url, { headers })
            .then(async (response) => {
                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error body');
                    const error: LinkedInApiError = new Error(`LinkedIn API Error for ${req.key}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0,200)}`);
                    error.status = response.status;
                    return { key: req.key, error: error, ok: false };
                }
                const text = await response.text();
                if (!text) return { key: req.key, data: null, ok: true };
                try {
                    return { key: req.key, data: JSON.parse(text), ok: true };
                } catch (e) {
                    console.error(`Error parsing JSON for ${req.key}:`, e);
                    const error: LinkedInApiError = new Error(`JSON Parsing Error for ${req.key}`);
                    return { key: req.key, error: error, ok: false };
                }
            })
            .catch(networkError => {
                console.error(`Network error fetching ${req.key}:`, networkError);
                const error: LinkedInApiError = new Error(`Network Error for ${req.key}: ${networkError.message}`);
                return { key: req.key, error: error, ok: false };
            })
    );

    // Process results
    const responses = await Promise.allSettled(promises);
    responses.forEach((response, index) => {
        const req = requests[index];
        if (response.status === 'fulfilled') {
            const value = response.value; // value is { key, ok, data?, error? }
            if (value.ok) {
                // FIXED: Add check for 'data' property before accessing
                if ('data' in value) {
                    results[req.key] = value.data; // Assign data (could be null)
                    if (value.data) { // Log only if data is not null
                        console.log(`LinkedIn Utils: Successfully processed data for ${req.key}.`);
                    } else {
                        console.log(`LinkedIn Utils: Successfully fetched ${req.key}, but response body was empty.`);
                    }
                } else {
                    // This case indicates an issue if ok=true but data prop missing (e.g., JSON parse failed but wasn't caught correctly)
                    console.warn(`LinkedIn Utils: Fulfilled/OK response for ${req.key} missing 'data' property unexpectedly.`);
                    results[req.key] = null;
                }
            } else {
                // Handle ok=false case (API error, JSON parse error, Network error from catch)
                console.warn(`LinkedIn Utils: API call or processing for ${req.key} failed gracefully. Status: ${value.error?.status || 'N/A'}`);
                results[req.key] = null; // Indicate failure
            }
        } else { // status === 'rejected'
            console.error(`LinkedIn Utils: Promise rejected for ${req.key}: ${response.reason}`);
            results[req.key] = null; // Indicate failure
        }
    });

    // Combine / Augment results (ensure null checks)
    const combinedResults: any = { ...results };
    combinedResults.email = results.email?.elements?.[0]?.["handle~"]?.emailAddress || null;

    if (results.profileDetails) {
        combinedResults.summary = results.profileDetails.summary || null;
        combinedResults.headline = results.profileDetails.headline || results.basicProfile?.headline || null;
        combinedResults.locationName = results.profileDetails.location?.preferredLocale?.country || results.profileDetails?.location?.countryCode || null;
        combinedResults.vanityName = results.profileDetails.vanityName || results.basicProfile?.vanityName || null;
    } else {
        combinedResults.headline = results.basicProfile?.headline || null;
        combinedResults.vanityName = results.basicProfile?.vanityName || null;
    }
    combinedResults.profileUrl = combinedResults.vanityName
       ? `https://www.linkedin.com/in/${combinedResults.vanityName}`
       : (results.basicProfile?.id ? `https://www.linkedin.com/in/${results.basicProfile.id}` : '');

    if (results.positions?.elements?.length > 0) {
        const latestPosition = results.positions.elements.find((p: any) => !p.timePeriod?.endDate);
        const mostRecentPosition = results.positions.elements[0];
        const current = latestPosition || mostRecentPosition;
        if (current) {
             combinedResults.currentPosition = current.title || null;
             combinedResults.currentCompany = current.company?.name || current.companyName || null;
        }
    }

    // CRITICAL CHECK: Ensure basic profile ID was fetched successfully
    if (!results.basicProfile || !results.basicProfile.id) {
        console.error("LinkedIn Utils CRITICAL: Failed to fetch essential basic profile data (ID, names) from LinkedIn API. Check permissions/scopes (e.g., 'openid', 'profile', 'r_liteprofile').");
        throw new Error("Failed to fetch essential basic LinkedIn profile data from API.");
    }

    console.log("LinkedIn Utils: Comprehensive data fetched.");
    // Return the raw results object containing keys like basicProfile, email, positions etc.
    return results; // Return the object containing fetched data under respective keys
}