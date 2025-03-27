'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Creates a default profile for a new user
 * 
 * This function should be called after user registration is complete
 * It ensures that each user has a corresponding profile in the profiles table
 */
export async function createUserProfile(userId: string) {
  const supabase = createServerComponentClient({ cookies });
  
  // Check if a profile already exists for this user
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
  
  // If the profile already exists, we don't need to create it
  if (existingProfile) return;
  
  // Otherwise, create a default profile
  await supabase.from('profiles').insert({
    id: userId,
    full_name: '',
    email: '', // This will be updated later from auth
    phone: '',
    location: '',
    professional_summary: '',
    updated_at: new Date().toISOString(),
  });
}