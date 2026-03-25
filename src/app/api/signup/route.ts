import { createClient } from "@supabase/supabase-js";
import { PrismaClient, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { emailService } from "@/services/emailService";
import crypto from "crypto";

const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase environment variables are not defined.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const prisma = new PrismaClient();

// Admin client for ensuring email is not confirmed
function getSupabaseAdmin() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not set - email confirmation enforcement may not work"
    );
    return null;
  }
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Generate a secure confirmation token
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

  // Combine payload and signature in a URL-safe format
  const token = Buffer.from(
    JSON.stringify({ ...payload, sig: signature })
  ).toString("base64url");
  return token;
}

export async function POST(req: Request) {
  try {
    // Get base URL from request headers or environment
    const host = req.headers.get("host");
    const protocol =
      req.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
    const origin =
      req.headers.get("origin") ||
      (host ? `${protocol}://${host}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const formData = await req.formData();
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const businessName = formData.get("businessName") as string;
    const vehicleType = formData.get("vehicleType") as string;
    const documents = formData.get("documents") as File;

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Required fields are missing." },
        { status: 400 }
      );
    }

    // Validate role
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: "Invalid user role." },
        { status: 400 }
      );
    }

    // Validate role-specific requirements
    if (role === UserRole.VENDOR && !businessName) {
      return NextResponse.json(
        { error: "Business name is required for vendors." },
        { status: 400 }
      );
    }

    if (role === UserRole.DRIVER && !vehicleType) {
      return NextResponse.json(
        { error: "Vehicle type is required for drivers." },
        { status: 400 }
      );
    }

    // Check if user exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    // if (existingUserByEmail) {
    //   return NextResponse.json(
    //     { error: "A user with this email already exists." },
    //     { status: 400 }
    //   );
    // }

    if (existingUserByEmail) {
      if (existingUserByEmail.provider === "google") {
        console.log("yes thereeeeeeeeeeeeeeeeeeeeeeeeee");
        return NextResponse.json(
          {
            error:
              "This email is already registered via Google. Please log in using Google.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    // Check if user exists by phone number (if provided)
    if (phoneNumber) {
      const existingUserByPhone = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (existingUserByPhone) {
        return NextResponse.json(
          { error: "A user with this phone number already exists." },
          { status: 400 }
        );
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return NextResponse.json(
          { error: "Invalid phone number format." },
          { status: 400 }
        );
      }
    }

    // Create Supabase user using Admin API to prevent Supabase from sending emails
    // We'll handle email confirmation via Mailjet only
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Server configuration error. SUPABASE_SERVICE_ROLE_KEY is required.",
        },
        { status: 500 }
      );
    }

    // Use Admin API to create user - this bypasses Supabase's email sending
    const { data: adminUserData, error: adminError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Email is NOT confirmed
        user_metadata: {
          name: name,
          role: role,
        },
      });

    if (adminError || !adminUserData?.user) {
      console.error(
        "Supabase Admin Error:",
        adminError?.message || "Unknown error"
      );
      return NextResponse.json(
        {
          error: `Failed to create user: ${
            adminError?.message || "Unknown error"
          }`,
        },
        { status: 400 }
      );
    }

    const supabaseId = adminUserData.user.id;
    console.log(
      "User created via Admin API (no Supabase email sent):",
      supabaseId
    );

    // Generate confirmation token
    const confirmationToken = generateConfirmationToken(supabaseId, email);

    // Send confirmation email via Mailjet
    try {
      const emailSent = await emailService.sendConfirmationEmail(
        email,
        name,
        confirmationToken,
        origin
      );
      if (!emailSent) {
        console.error("Failed to send confirmation email via Mailjet");
        // Don't fail signup if email fails, but log it
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue with signup even if email fails
    }

    // Handle document upload if provided
    let documentUrl = null;
    if (documents) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(`${supabaseId}/${documents.name}`, documents);

      if (uploadError) {
        console.error("Document upload error:", uploadError);
      } else {
        documentUrl = uploadData.path;
      }
    }

    // Check if user exists by email

    // Create user in Prisma with appropriate role and approval status
    const prismaUser = await prisma.user.create({
      data: {
        id: supabaseId,
        email,
        phoneNumber,
        name,
        role: role as UserRole,
        approvalStatus: role === UserRole.CUSTOMER ? "APPROVED" : "PENDING",
      },
    });

    // Create role-specific profiles
    if (role === UserRole.VENDOR) {
      await prisma.vendorProfile.create({
        data: {
          userId: supabaseId,
          businessName,
          documents: documentUrl ? { url: documentUrl } : undefined,
        },
      });
    } else if (role === UserRole.DRIVER) {
      await prisma.driver.create({
        data: {
          userId: supabaseId,
          vehicleType,
          documents: documentUrl ? { license: documentUrl } : undefined,
        },
      });
    }

    return NextResponse.json(
      {
        data: {
          ...prismaUser,
          approvalRequired: role !== UserRole.CUSTOMER,
        },
        message:
          role === UserRole.CUSTOMER
            ? "Account created successfully! Please check your email to confirm your account before logging in."
            : "Account created successfully! Your application is under review.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
