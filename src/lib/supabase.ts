import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL or Anon Key is not defined in the environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,{ 
  auth: { persistSession: true }, // Ensure authentication is persisted
});
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).supabase = supabase;
}
