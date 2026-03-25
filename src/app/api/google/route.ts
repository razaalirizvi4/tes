import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'


export async function GET() {
  try {
    const provider = 'google';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${apiUrl}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(`Google OAuth failed: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error) {
      // Handle known error type
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Handle unexpected error type
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}
