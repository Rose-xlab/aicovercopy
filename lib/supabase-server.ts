// lib/supabase-server.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export function getServerClient() {
  const cookieStore = cookies();
  
  return createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore 
  });
}