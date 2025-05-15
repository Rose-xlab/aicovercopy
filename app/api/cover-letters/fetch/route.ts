// File: app/api/cover-letters/fetch/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { CoverLetter } from '@/types/cover-letter';

export const dynamic = 'force-dynamic';

// Helper function to map database response to CoverLetter interface
function mapDatabaseToCoverLetter(dbCoverLetter: any): CoverLetter {
    return {
        id: dbCoverLetter.id,
        userId: dbCoverLetter.user_id,
        templateId: dbCoverLetter.template_id || undefined,
        jobDescription: dbCoverLetter.job_description,
        content: dbCoverLetter.content,
        tone: dbCoverLetter.tone || 'professional',
        createdAt: dbCoverLetter.created_at ? new Date(dbCoverLetter.created_at) : null,
        jobTitle: dbCoverLetter.job_title,
        companyName: dbCoverLetter.company_name,
        dataSource: dbCoverLetter.data_source as 'cv' | 'linkedin' | 'none' | 'both',
        // Extract sender and recipient info if available in metadata
        sender: dbCoverLetter.sender || undefined,
        recipient: dbCoverLetter.recipient || {
        companyName: dbCoverLetter.company_name || undefined
        }
    };
}

// GET handler to fetch all cover letters for the authenticated user
export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

        // Authenticate user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse URL to check for query parameters
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        // If an ID is provided, fetch a single cover letter
        if (id) {
            const { data, error } = await supabase
                .from('cover_letters')
                .select('*')
                .eq('id', id)
                .eq('user_id', session.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // Not found
                    return NextResponse.json(
                        { error: 'Cover letter not found or you do not have access' },
                        { status: 404 }
                    );
                }
                console.error(`Error fetching cover letter ${id}:`, error);
                throw error;
            }

            if (!data) {
                return NextResponse.json(
                    { error: 'Cover letter not found or you do not have access' },
                    { status: 404 }
                );
            }

            // Map database response to CoverLetter interface
            const coverLetter = mapDatabaseToCoverLetter(data);
            return NextResponse.json(coverLetter);
        }

        // Otherwise, fetch all cover letters for the user
        // Parse pagination parameters if provided
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Fetch cover letters with pagination
        const { data, error, count } = await supabase
            .from('cover_letters')
            .select('*', { count: 'exact' })
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching cover letters:', error);
            throw error;
        }

        // Map each cover letter to the expected format
        const coverLetters = data?.map(mapDatabaseToCoverLetter) || [];

        // Return the data with pagination metadata
        return NextResponse.json({
            data: coverLetters,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error: any) {
        console.error('Error in cover letters fetch API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch cover letters' },
            { status: 500 }
        );
    }
}

// POST handler for fetching a specific cover letter by ID
export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

        // Authenticate user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse the request body to get the cover letter ID
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Cover letter ID is required' }, { status: 400 });
        }

        // Fetch the specific cover letter
        const { data, error } = await supabase
            .from('cover_letters')
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                return NextResponse.json(
                    { error: 'Cover letter not found or you do not have access' },
                    { status: 404 }
                );
            }
            console.error(`Error fetching cover letter ${id}:`, error);
            throw error;
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Cover letter not found or you do not have access' },
                { status: 404 }
            );
        }

        // Map database response to CoverLetter interface
        const coverLetter = mapDatabaseToCoverLetter(data);
        return NextResponse.json(coverLetter);

    } catch (error: any) {
        console.error('Error fetching specific cover letter:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid request body format.' }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to fetch cover letter' },
            { status: 500 }
        );
    }
}