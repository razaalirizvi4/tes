import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const SETTINGS_ID = "app-settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Fetch settings from database
    // Note: After running 'npx prisma generate', this will work with the Settings model
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settings = await (prisma as any).settings.findUnique({
      where: { id: SETTINGS_ID },
    });

    // If settings don't exist, create with defaults
    if (!settings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings = await (prisma as any).settings.create({
        data: {
          id: SETTINGS_ID,
        },
      });
    }

    console.log("GET settings - Returning:", {
      restaurantRadius: settings.restaurantRadius,
      type: typeof settings.restaurantRadius,
    });

    return NextResponse.json(
      {
        success: true,
        data: settings,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching settings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch settings: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get("sb-access-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Verify token and get user
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !supabaseUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    // Get user from database to check role
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Super Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Settings update request body:", body);
    const { restaurantRadius, ...otherSettings } = body;

    // Prepare update data
    // Type will be properly inferred after Prisma client regeneration
    const updateData: Record<string, unknown> = {};

    // Validate and update restaurant radius
    if (restaurantRadius !== undefined) {
      const radius = parseFloat(String(restaurantRadius));
      console.log("Parsed restaurant radius:", radius);
      if (isNaN(radius) || radius <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Restaurant radius must be a positive number",
          },
          { status: 400 }
        );
      }
      updateData.restaurantRadius = radius;
    }

    // Map other settings to the database schema
    // General Settings
    if (otherSettings.appName !== undefined)
      updateData.appName = otherSettings.appName;
    if (otherSettings.appLogo !== undefined)
      updateData.appLogo = otherSettings.appLogo;
    if (otherSettings.defaultCurrency !== undefined)
      updateData.defaultCurrency = otherSettings.defaultCurrency;
    if (otherSettings.timezone !== undefined)
      updateData.timezone = otherSettings.timezone;
    if (otherSettings.language !== undefined)
      updateData.language = otherSettings.language;
    if (otherSettings.maintenanceMode !== undefined)
      updateData.maintenanceMode = otherSettings.maintenanceMode;

    // System Settings
    if (otherSettings.maxFileUploadSize !== undefined)
      updateData.maxFileUploadSize = String(otherSettings.maxFileUploadSize);
    if (otherSettings.sessionTimeout !== undefined)
      updateData.sessionTimeout = String(otherSettings.sessionTimeout);
    if (otherSettings.enableApiRateLimit !== undefined)
      updateData.enableApiRateLimit = otherSettings.enableApiRateLimit;
    if (otherSettings.apiRateLimit !== undefined)
      updateData.apiRateLimit = String(otherSettings.apiRateLimit);
    if (otherSettings.enableCaching !== undefined)
      updateData.enableCaching = otherSettings.enableCaching;
    if (otherSettings.cacheExpiry !== undefined)
      updateData.cacheExpiry = String(otherSettings.cacheExpiry);

    // Payment Settings
    if (otherSettings.paymentGateway !== undefined)
      updateData.paymentGateway = otherSettings.paymentGateway;
    if (otherSettings.stripePublicKey !== undefined)
      updateData.stripePublicKey = otherSettings.stripePublicKey || "";
    if (otherSettings.stripeSecretKey !== undefined)
      updateData.stripeSecretKey = otherSettings.stripeSecretKey || "";
    if (otherSettings.paypalClientId !== undefined)
      updateData.paypalClientId = otherSettings.paypalClientId || "";
    if (otherSettings.paypalSecret !== undefined)
      updateData.paypalSecret = otherSettings.paypalSecret || "";
    if (otherSettings.enableCod !== undefined)
      updateData.enableCod = otherSettings.enableCod;
    if (otherSettings.transactionFee !== undefined)
      updateData.transactionFee = String(otherSettings.transactionFee);

    // Notification Settings
    if (otherSettings.emailNotifications !== undefined)
      updateData.emailNotifications = otherSettings.emailNotifications;
    if (otherSettings.smsNotifications !== undefined)
      updateData.smsNotifications = otherSettings.smsNotifications;
    if (otherSettings.pushNotifications !== undefined)
      updateData.pushNotifications = otherSettings.pushNotifications;
    if (otherSettings.orderNotifications !== undefined)
      updateData.orderNotifications = otherSettings.orderNotifications;
    if (otherSettings.systemNotifications !== undefined)
      updateData.systemNotifications = otherSettings.systemNotifications;

    // Security Settings
    if (otherSettings.requireTwoFactor !== undefined)
      updateData.requireTwoFactor = otherSettings.requireTwoFactor;
    if (otherSettings.passwordMinLength !== undefined)
      updateData.passwordMinLength = String(otherSettings.passwordMinLength);
    if (otherSettings.passwordRequireUppercase !== undefined)
      updateData.passwordRequireUppercase =
        otherSettings.passwordRequireUppercase;
    if (otherSettings.passwordRequireNumbers !== undefined)
      updateData.passwordRequireNumbers = otherSettings.passwordRequireNumbers;
    if (otherSettings.passwordRequireSpecial !== undefined)
      updateData.passwordRequireSpecial = otherSettings.passwordRequireSpecial;
    if (otherSettings.sessionMaxAge !== undefined)
      updateData.sessionMaxAge = String(otherSettings.sessionMaxAge);
    if (otherSettings.enableIpWhitelist !== undefined)
      updateData.enableIpWhitelist = otherSettings.enableIpWhitelist;

    // Integration Settings
    if (otherSettings.googleMapsApiKey !== undefined)
      updateData.googleMapsApiKey = otherSettings.googleMapsApiKey || "";
    if (otherSettings.twilioAccountSid !== undefined)
      updateData.twilioAccountSid = otherSettings.twilioAccountSid || "";
    if (otherSettings.twilioAuthToken !== undefined)
      updateData.twilioAuthToken = otherSettings.twilioAuthToken || "";
    if (otherSettings.awsAccessKey !== undefined)
      updateData.awsAccessKey = otherSettings.awsAccessKey || "";
    if (otherSettings.awsSecretKey !== undefined)
      updateData.awsSecretKey = otherSettings.awsSecretKey || "";

    // Log update data before database operation
    console.log("Updating settings with data:", updateData);

    // Upsert settings (create if doesn't exist, update if it does)
    // Note: After running 'npx prisma generate', this will work with proper types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedSettings = await (prisma as any).settings.upsert({
      where: { id: SETTINGS_ID },
      update: updateData,
      create: {
        id: SETTINGS_ID,
        ...updateData,
      },
    });

    console.log("Settings updated successfully:", updatedSettings);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("Error details:", errorDetails);

    return NextResponse.json(
      {
        success: false,
        error: `Failed to update settings: ${errorMessage}`,
        details:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
