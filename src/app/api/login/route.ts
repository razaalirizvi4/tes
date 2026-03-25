import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Parse the incoming JSON request body
    const { email, password } = await req.json();
    console.log("Request Body:", { email, password });

    // Check if both email and password are provided
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required." }),
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const { data: supabaseUser, error: supabaseError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (supabaseError) {
      console.error("Supabase Authentication Error:", supabaseError.message);

      // Check if error is due to unconfirmed email
      if (
        supabaseError.message?.toLowerCase().includes("email") &&
        (supabaseError.message?.toLowerCase().includes("confirm") ||
          supabaseError.message?.toLowerCase().includes("verify"))
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Please verify your email address before logging in. Check your inbox for the confirmation email.",
          }),
          { status: 403 }
        );
      }

      // Return a 401 Unauthorized response if credentials are invalid
      if (supabaseError.message?.toLowerCase().includes("invalid")) {
        return new Response(
          JSON.stringify({ error: "Invalid email or password." }),
          { status: 401 }
        );
      }

      // Handle other potential errors
      return new Response(JSON.stringify({ error: supabaseError.message }), {
        status: 500,
      });
    }

    // CRITICAL: Check if email is confirmed - this MUST be checked
    // Supabase returns email_confirmed_at as null/undefined if not confirmed
    const emailConfirmed = supabaseUser.user?.email_confirmed_at;

    if (!emailConfirmed) {
      console.log("❌ Login BLOCKED - email not confirmed for:", email);
      // Sign out the user immediately if they somehow got a session
      if (supabaseUser.session) {
        await supabase.auth.signOut();
      }
      return new Response(
        JSON.stringify({
          error:
            "Please verify your email address before logging in. Check your inbox for the confirmation email. If you didn't receive it, please check your spam folder or contact support.",
          requiresEmailVerification: true,
          email: email, // Include email for the verification page
        }),
        { status: 403 }
      );
    }

    console.log(
      "✅ Email confirmed for:",
      email,
      "Confirmed at:",
      emailConfirmed
    );
    // Get complete user data with role-specific profiles
    const userInDb = await prisma.user.findUnique({
      where: { email: email },
      include: {
        vendorProfile: true,
        driver: true,
      },
    });

    if (!userInDb) {
      console.error("User not found in Prisma DB:", email);
      return new Response(
        JSON.stringify({ error: "User not found in the database." }),
        { status: 404 }
      );
    }

    // If everything is fine, set cookies and return complete user data
    return new Response(
      JSON.stringify({
        data: {
          ...supabaseUser,
          user: {
            ...userInDb,
            role: userInDb.role,
            approvalStatus: userInDb.approvalStatus,
            // Only include relevant profile based on role
            ...(userInDb.role === "VENDOR"
              ? { vendorProfile: userInDb.vendorProfile }
              : {}),
            ...(userInDb.role === "DRIVER" ? { driver: userInDb.driver } : {}),
          },
        },
        message: "Login successful!",
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `sb-access-token=${supabaseUser.session?.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
        },
      }
    );
  } catch (error) {
    console.error("Unexpected Error:", error);
    return new Response(
      JSON.stringify({
        error: "Something went wrong. Please try again later.",
      }),
      { status: 500 }
    );
  }
}
