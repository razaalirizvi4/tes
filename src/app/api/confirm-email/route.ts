import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();

// Verify confirmation token
function verifyConfirmationToken(
  token: string
): { userId: string; email: string; valid: boolean } | null {
  try {
    const secret =
      process.env.EMAIL_CONFIRMATION_SECRET ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "default-secret";

    // Decode the token
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const payload = JSON.parse(decoded);

    // Extract signature
    const { sig, ...data } = payload;

    // Verify signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(JSON.stringify(data));
    const expectedSignature = hmac.digest("hex");

    if (sig !== expectedSignature) {
      return null; // Invalid signature
    }

    // Check token expiration (24 hours)
    const tokenAge = Date.now() - payload.timestamp;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (tokenAge > twentyFourHours) {
      return null; // Token expired
    }

    return {
      userId: payload.userId,
      email: payload.email,
      valid: true,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Confirmation token is required." },
        { status: 400 }
      );
    }

    // Verify token
    const tokenData = verifyConfirmationToken(token);

    if (!tokenData || !tokenData.valid) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation token." },
        { status: 400 }
      );
    }

    // Use Supabase Admin API to confirm the email
    // We need service role key for this
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Update user to confirm email
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(tokenData.userId, {
        email_confirm: true,
      });

    if (updateError || !updatedUser) {
      console.error("Error confirming email:", updateError);
      await prisma.$disconnect();
      return NextResponse.json(
        {
          error:
            "Failed to confirm email. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    // Get user role from Prisma to determine redirect
    const userInDb = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { role: true },
    });

    await prisma.$disconnect();

    const userRole = userInDb?.role || "CUSTOMER";
    const isCustomer = userRole === "CUSTOMER";

    return NextResponse.json(
      {
        message: isCustomer
          ? "Email confirmed successfully! You can now log in."
          : "Email confirmed successfully! Your application is under review.",
        success: true,
        role: userRole,
        redirectTo: isCustomer ? "/auth/login" : "/pending-approval",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email confirmation error:", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
