import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path to match your Prisma setup

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

      // Check if tokens are valid
      console.log("Received tokens:", { access_token, refresh_token });

    // Get authenticated user from Supabase
    const { data: user, error } = await supabase.auth.getUser(access_token);
    if (error || !user?.user) {
      return NextResponse.json({ error: "Failed to retrieve user" }, { status: 401 });
    }
    const supabaseUser = user.user;


    // Check if user already exists in Prisma database
    let existingUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id }, // Make sure this matches your schema!
    });

   

    if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            id: supabaseUser.id, // Ensure this UUID matches Supabase
            email: supabaseUser.email ?? "unknown@example.com",
            name: supabaseUser.user_metadata?.name || "Unknown",
            phoneNumber: supabaseUser.phone || null,
            dob: null, // Set this later if needed
            role: "CUSTOMER",
            provider:"google",
            approvalStatus: null, // Only for drivers/vendors
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      
        console.log("Created New User:", existingUser);
      }
    console.log(existingUser,"existingUser")


    return NextResponse.json({ user: existingUser }, { status: 200 });
  } catch (error) {
    // console.error("Error handling auth callback:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
