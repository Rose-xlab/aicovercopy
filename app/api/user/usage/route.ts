import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getUserSubscriptionTier } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-client';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Get the user's subscription tier (e.g., 'FREE', 'PRO')
    const tier = await getUserSubscriptionTier(user.id);

    // 2. Get the usage limits for that tier using the CORRECT property name
    const limit = SUBSCRIPTION_PLANS[tier]?.limits.coverLetters ?? 0;

    // 3. Get the user's current usage count from the correct database table.
    // NOTE: I've changed the table name from 'generations' to 'cover_letters'.
    // Please verify this is the correct table name in your Supabase project.
    const { count: usage, error: usageError } = await supabase
      .from('cover_letters') // <-- VERIFY THIS TABLE NAME
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (usageError) {
      throw usageError;
    }

    // 4. Return the user's current usage and their limit
    return NextResponse.json({
      usage: usage ?? 0,
      limit: limit,
    });

  } catch (error: any) {
    console.error('Error fetching user usage:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}