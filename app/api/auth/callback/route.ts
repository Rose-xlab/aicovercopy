// app/api/auth/callback/route.ts
// You can DELETE this file entirely, or keep it minimal for email confirmations only

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // This route is not used for OAuth - just redirect to dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}