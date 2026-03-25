import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { restaurantId, action, openingFloat, cashAmount, reason } =
      await request.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID required" },
        { status: 400 }
      );
    }

    // Check permissions
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      ![
        "POS_CASHIER",
        "POS_MANAGER",
        "VENDOR",
        "ADMIN",
        "SUPER_ADMIN",
      ].includes(userData?.role || "")
    ) {
      return NextResponse.json(
        { error: `User role (${userData?.role}) not authorized` },
        { status: 403 }
      );
    }

    // Verify restaurant access
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ...(userData?.role === "VENDOR" && { vendor: { userId: user.id } }),
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or access denied for this user" },
        { status: 404 }
      );
    }

    if (action === "open") {
      // Check if shift already open
      const existingShift = await prisma.shift.findFirst({
        where: {
          restaurantId,
          closedAt: null,
        },
      });

      if (existingShift) {
        return NextResponse.json(
          { error: "Shift already open" },
          { status: 400 }
        );
      }

      // Allow 0 float but validate number
      if (
        openingFloat === undefined ||
        openingFloat === null ||
        openingFloat < 0
      ) {
        return NextResponse.json(
          { error: "Valid opening float required" },
          { status: 400 }
        );
      }

      const shift = await prisma.shift.create({
        data: {
          restaurantId,
          userId: user.id,
          openingFloat,
        },
      });

      return NextResponse.json(shift);
    } else if (action === "cash-in" || action === "cash-out") {
      const shift = await prisma.shift.findFirst({
        where: {
          restaurantId,
          closedAt: null,
        },
      });

      if (!shift) {
        return NextResponse.json(
          { error: "No open shift found" },
          { status: 400 }
        );
      }

      if (!cashAmount || cashAmount <= 0) {
        return NextResponse.json(
          { error: "Valid cash amount required" },
          { status: 400 }
        );
      }

      // Create cash transaction
      await prisma.cashTransaction.create({
        data: {
          shiftId: shift.id,
          type: action === "cash-in" ? "IN" : "OUT",
          amount: cashAmount,
          reason: reason || "",
          createdBy: user.id,
        },
      });

      // Update shift totals
      const updateData =
        action === "cash-in"
          ? { cashIn: { increment: cashAmount } }
          : { cashOut: { increment: cashAmount } };

      const updatedShift = await prisma.shift.update({
        where: { id: shift.id },
        data: updateData,
      });

      return NextResponse.json(updatedShift);
    } else if (action === "close") {
      const shift = await prisma.shift.findFirst({
        where: {
          restaurantId,
          closedAt: null,
        },
        include: {
          transactions: true,
        },
      });

      if (!shift) {
        return NextResponse.json(
          { error: "No open shift found" },
          { status: 400 }
        );
      }

      if (cashAmount === undefined || cashAmount === null || cashAmount < 0) {
        return NextResponse.json(
          { error: "Valid closing amount required" },
          { status: 400 }
        );
      }

      // Calculate totals
      const cashIn = shift.transactions
        .filter((t) => t.type === "IN")
        .reduce((sum, t) => sum + t.amount, 0);

      const cashOut = shift.transactions
        .filter((t) => t.type === "OUT")
        .reduce((sum, t) => sum + t.amount, 0);

      // Get POS payments for cash/card/QR totals
      const posOrders = await prisma.pOSOrder.findMany({
        where: {
          restaurantId,
          createdAt: {
            gte: shift.openedAt,
          },
        },
        include: {
          payments: true,
        },
      });

      let cashSales = 0,
        cardSales = 0,
        qrSales = 0;
      posOrders.forEach((order) => {
        order.payments.forEach((payment) => {
          if (payment.method === "cash") cashSales += payment.amount;
          else if (payment.method === "card") cardSales += payment.amount;
          else if (payment.method === "qr") qrSales += payment.amount;
        });
      });

      const closedShift = await prisma.shift.update({
        where: { id: shift.id },
        data: {
          closedAt: new Date(),
          closingAmount: cashAmount, // This is expected vs actual? User passes Actual.
          // The schema probably expects 'closingAmount'.
          cashIn,
          cashOut,
          cashSales,
          cardSales,
          qrSales,
        },
      });

      return NextResponse.json(closedShift);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing shift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID required" },
        { status: 400 }
      );
    }

    // Check permissions
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const shift = await prisma.shift.findFirst({
      where: {
        restaurantId,
        closedAt: null,
        ...(userData?.role === "VENDOR" && {
          restaurant: { vendor: { userId: user.id } },
        }),
      },
      include: {
        transactions: true,
      },
    });

    if (shift) {
      // Calculate current totals on the fly for the UI
      const posOrders = await prisma.pOSOrder.findMany({
        where: {
          restaurantId,
          createdAt: {
            gte: shift.openedAt,
          },
          status: { not: "CANCELLED" }, // Exclude cancelled orders
        },
        include: {
          payments: true,
        },
      });

      let cashSales = 0,
        cardSales = 0,
        qrSales = 0;
      posOrders.forEach((order) => {
        order.payments.forEach((payment) => {
          if (payment.method === "cash") cashSales += payment.amount;
          else if (payment.method === "card") cardSales += payment.amount;
          else if (payment.method === "qr") qrSales += payment.amount;
        });
      });

      const cashIn = shift.transactions
        .filter((t) => t.type === "IN")
        .reduce((sum, t) => sum + t.amount, 0);

      const cashOut = shift.transactions
        .filter((t) => t.type === "OUT")
        .reduce((sum, t) => sum + t.amount, 0);

      const expectedCash = shift.openingFloat + cashSales + cashIn - cashOut;

      return NextResponse.json({
        ...shift,
        cashSales,
        cardSales,
        qrSales,
        expectedCash,
      });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
