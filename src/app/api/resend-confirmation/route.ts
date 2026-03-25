import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { emailService } from "@/services/emailService";

import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

// Generate a secure confirmation token (same as in signup)
function generateConfirmationToken(userId: string, email: string): string {
  const secret =
    process.env.EMAIL_CONFIRMATION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "default-secret";
  const payload = {
    userId,
    email,
    timestamp: Date.now(),
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

    // Find user in Prisma
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Check if email is already confirmed
    const { data: supabaseUser } = await supabaseAdmin.auth.admin.getUserById(
      user.id
    );

    if (supabaseUser?.user?.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email is already confirmed. You can log in now." },
        { status: 400 }
      );
    }

    // Generate new confirmation token
    const confirmationToken = generateConfirmationToken(user.id, email);

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

    // Send confirmation email via Mailjet
    const emailSent = await emailService.sendConfirmationEmail(
      email,
      user.name || "User",
      confirmationToken,
      origin
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send confirmation email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Confirmation email sent successfully! Please check your inbox.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend confirmation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

