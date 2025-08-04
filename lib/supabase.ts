// lib/supabase.ts
import { getBrowserClient } from './supabase-browser';

// Export the browser client function with backward-compatible name
export const createBrowserClient = getBrowserClient;

// Export types for convenience
export type { Database } from '@/types/supabase';

// Note: Server client should be imported directly from supabase-server.ts
// in server components/route handlers to avoid bundling issues