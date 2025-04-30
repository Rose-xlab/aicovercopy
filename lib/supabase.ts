import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Check if environment variables are set
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// For client components (with cookie handling)
export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
};