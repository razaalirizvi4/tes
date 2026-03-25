import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables are not defined.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

// Verify password reset token
function verifyPasswordResetToken(
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

    // Verify it's a password reset token
    if (data.type !== "password_reset") {
      return null;
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(JSON.stringify(data));
    const expectedSignature = hmac.digest("hex");

    if (sig !== expectedSignature) {
      return null; // Invalid signature
    }

    // Check token expiration (10 minutes)
    const tokenAge = Date.now() - payload.timestamp;
    const tenMinutes = 10 * 60 * 1000;

    if (tokenAge > tenMinutes) {
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

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Verify token
    const tokenData = verifyPasswordResetToken(token);

    if (!tokenData || !tokenData.valid) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired reset token. The link expires in 10 minutes. Please request a new password reset link.",
        },
        { status: 400 }
      );
    }

    // Update password using Admin API
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(tokenData.userId, {
        password: newPassword,
      });

    if (updateError || !updatedUser) {
      console.error("Error updating password:", updateError);
      await prisma.$disconnect();
      return NextResponse.json(
        {
          error:
            "Failed to update password. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    await prisma.$disconnect();

    return NextResponse.json(
      {
        message:
          "Your password has been reset successfully. You can now sign in with your new password.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

// Validate token endpoint
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required." },
        { status: 200 }
      );
    }

    // Verify token using our custom verification
    const tokenData = verifyPasswordResetToken(token);

    if (!tokenData || !tokenData.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid or expired token. The link expires in 10 minutes.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Error validating token." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
