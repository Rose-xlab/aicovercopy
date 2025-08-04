// lib/supabase-browser.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase'; // Ensure this path is correct

// Declare the client variable but do not initialize it.
// This is safe to run on the server.
let client: ReturnType<typeof createClientComponentClient<Database>> | undefined;

export const getBrowserClient = () => {
  // If the client is already created, return it.
  if (client) {
    return client;
  }

  // If not, create it. This will only happen on the client side
  // when called from the useState initializer.
  // The library automatically reads the NEXT_PUBLIC_ variables.
  client = createClientComponentClient<Database>();

  return client;
};