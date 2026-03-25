import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { emailService } from "@/services/emailService";
import crypto from "crypto";

const prisma = new PrismaClient();

// Generate a secure password reset token (10 minutes expiration)
function generatePasswordResetToken(userId: string, email: string): string {
  const secret =
    process.env.EMAIL_CONFIRMATION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "default-secret";
  const payload = {
    userId,
    email,
    timestamp: Date.now(),
    type: "password_reset", // Distinguish from email confirmation tokens
  };

  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(data);
  const signature = hmac.digest("hex");

  const token = Buffer.from(
    JSON.stringify({ ...payload, sig: signature })
  ).toString("base64url");
  return token;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists - only send reset link if user exists
    if (!user) {
      return NextResponse.json(
        {
          error: "No account found with this email address.",
        },
        { status: 404 }
      );
    }

    // Check if user signed up with Google (they can't reset password via email)
    if (user.provider === "google") {
      return NextResponse.json(
        {
          error:
            "We cannot generate password reset link for this email based on the account settings.",
          isGoogleSSO: true,
        },
        { status: 400 }
      );
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user.id, email);

    // Get base URL from request
    const host = req.headers.get("host");
    const protocol =
      req.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
    const origin =
      req.headers.get("origin") ||
      (host ? `${protocol}://${host}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // Send password reset email via Mailjet
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      user.name || "User",
      resetToken,
      origin
    );

    if (!emailSent) {
      return NextResponse.json(
        {
          error: "Failed to send password reset link. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Password reset link has been sent to your email. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
