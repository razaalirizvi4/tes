
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'


export async function GET() {
  try {
    const provider = 'facebook'; // Use 'facebook' as the provider
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${apiUrl}/auth/callback`, // Redirect after login
      },
    });

    if (error) {
      throw new Error(`Facebook OAuth failed: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
