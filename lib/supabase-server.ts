import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// For direct server-side access where cookies aren't needed
export const supabase = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This will be used only in Server Components or API routes
// We're not importing cookies directly here to avoid the "next/headers in Client Component" error
export async function getServerClient() {
  // Dynamic import to prevent the "next/headers in Client Component" error
  const { cookies } = await import('next/headers');
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
  
  return createServerComponentClient<Database>({ cookies });
}