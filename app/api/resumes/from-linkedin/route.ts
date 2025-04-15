// app/api/resumes/from-linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
// Import the ACTUAL resume creation logic utility
import { createResumeFromLinkedInData } from '@/lib/resumeUtils';

type LinkedInProfile = Database['public']['Tables']['linkedin_profiles']['Row'];

export async function POST(request: NextRequest) {
    const start = Date.now();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    try {
        // 1. Get User ID
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        let userId: string | undefined;
        if (session) { userId = session.user.id; }
        // Handle X-Auth-User-Id header if needed from specific callers like callback
        // const serverAuthUserId = request.headers.get('X-Auth-User-Id');
        // if (!userId && serverAuthUserId) { userId = serverAuthUserId }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log(`API Resume From DB: Request for user: ${userId}`);

        // 2. Get LinkedIn Profile Database ID from request body
        let linkedInProfileId: string | undefined;
        try {
            const body = await request.json();
            linkedInProfileId = body.linkedInProfileId;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        if (!linkedInProfileId) {
            return NextResponse.json({ error: 'LinkedIn Profile ID (from database) is required' }, { status: 400 });
        }
        console.log(`API Resume From DB: Using stored profile ID: ${linkedInProfileId}`);

        // 3. Fetch the COMPLETE LinkedIn profile data FROM YOUR DATABASE
        console.log(`API Resume From DB: Fetching profile from database...`);
        const { data: storedProfile, error: dbFetchError } = await supabase
            .from('linkedin_profiles')
            .select('*') // Fetch all columns needed by createResumeFromLinkedInData
            .eq('id', linkedInProfileId)
            .eq('user_id', userId) // Security check: ensure profile belongs to user
            .single(); // Expect exactly one

        if (dbFetchError) {
            console.error("API Resume From DB: Error fetching stored profile:", dbFetchError);
            if (dbFetchError.code === 'PGRST116') {
                 return NextResponse.json({ error: 'Stored LinkedIn profile not found or does not belong to user.' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Database error fetching profile data', details: dbFetchError.message }, { status: 500 });
        }
        console.log(`API Resume From DB: Found stored profile "${storedProfile.name}".`);

        // 4. Call the centralized resume creation utility function
        console.log(`API Resume From DB: Calling resume creation utility...`);
        // Pass the full profile row fetched from the database
        const resumeResult = await createResumeFromLinkedInData(
            supabase,
            userId,
            storedProfile // Pass the complete profile record from DB
        );

        const duration = Date.now() - start;

        // 5. Return the result from the utility function
        if (resumeResult.success && resumeResult.resumeId) {
            console.log(`API Resume From DB: Resume creation successful. ID: ${resumeResult.resumeId}. Duration: ${duration}ms`);
            return NextResponse.json({
                success: true,
                resumeId: resumeResult.resumeId,
                message: 'Resume successfully created from stored LinkedIn profile'
            });
        } else {
            console.error(`API Resume From DB: Resume creation utility failed. Error: ${resumeResult.error}. Duration: ${duration}ms`);
            return NextResponse.json(
                { error: `Failed to create resume: ${resumeResult.error || 'Unknown utility error'}` },
                { status: 500 }
            );
        }

    } catch (error: any) {
        const duration = Date.now() - start;
        console.error(`API Resume From DB: Unexpected handler error. Duration: ${duration}ms`, error);
        return NextResponse.json(
            { error: 'An unexpected server error occurred.', details: error.message },
            { status: 500 }
        );
    }
}