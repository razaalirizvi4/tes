import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getUser() {
  const cookieStore = await cookies();
  const headerList = await headers();

  try {
    const cookieToken = cookieStore.get("sb-access-token")?.value;
    if (cookieToken) {
      const { data: { user }, error: cookieError } = await supabase.auth.getUser(cookieToken);
      if (!cookieError && user) return user;
    }

    // Try cookie-based auth with server component client
    const serverSupabase = createServerComponentClient({ cookies: () => cookieStore as any });
    const { data: { user: cookieUser } } = await serverSupabase.auth.getUser();
    if (cookieUser) return cookieUser;

    // If no user found via cookies, try token from Authorization header
    const authHeader = headerList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Use the direct Supabase client to get user from token
      const { data: { user: headerUser }, error: headerError } = await supabase.auth.getUser(token);
      if (!headerError && headerUser) {
        return headerUser;
      }
    }

    return null;
  } catch (error) {
    console.error("Auth Error:", error);
    return null;
  }
}