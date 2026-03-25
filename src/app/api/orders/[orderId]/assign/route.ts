import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getUser();
    if (!user?.role?.includes('ADMIN')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { driverId } = data;

    if (!driverId) {
      return new NextResponse("Driver ID is required", { status: 400 });
    }

    // Check if order exists and is pending
    const order = await prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM "Order" WHERE id = ${(await params).orderId}
    `;

    if (!order.length) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order[0].status !== 'PENDING') {
      return new NextResponse("Order is not pending", { status: 400 });
    }

    // Check if driver exists and is available
    const driver = await prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM "Driver" WHERE id = ${driverId}
    `;

    if (!driver.length) {
      return new NextResponse("Driver not found", { status: 404 });
    }

    if (driver[0].status !== 'ONLINE') {
      return new NextResponse("Driver is not available", { status: 400 });
    }

    // Prevent assigning when driver already has an active order linked
    const driverActive = await prisma.$queryRaw<{ activeOrderId: string | null }[]>`
      SELECT "activeOrderId" FROM "Driver" WHERE id = ${driverId}
    `;
    if (driverActive[0]?.activeOrderId) {
      return new NextResponse("Driver already has an active order", { status: 400 });
    }

    // Then check if driver exists and is available
    const existingDriver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        status: 'ONLINE'
      }
    });

    if (!existingDriver) {
      return new NextResponse("Driver not found or not available", { status: 400 });
    }

    // Update using raw SQL to avoid type issues
    await prisma.$transaction([
      prisma.$executeRaw`
        UPDATE "Order"
        SET status = 'ACCEPTED', "driverId" = ${driverId}, "assignedAt" = NOW()
        WHERE id = ${(await params).orderId}
      `,
      prisma.$executeRaw`
        UPDATE "Driver"
        SET status = 'BUSY', "activeOrderId" = ${(await params).orderId}
        WHERE id = ${driverId}
      `
    ]);

    // Get updated order details
    const updatedOrder = await prisma.$queryRaw<{ id: string; status: string; assignedAt: Date }[]>`
      SELECT id, status, "assignedAt" FROM "Order" WHERE id = ${(await params).orderId}
    `;

    // Here you would typically:
    // 1. Send notification to the driver
    // 2. Send notification to the customer
    // 3. Send notification to the restaurant
    // 4. Update real-time status for all clients

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error("Error assigning order:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getUser();
    if (!user?.role?.includes('ADMIN')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if order exists and has assigned driver
    const order = await prisma.$queryRaw<{ id: string; driverId: string | null }[]>`
      SELECT id, "driverId" FROM "Order" WHERE id = ${(await params).orderId}
    `;

    if (!order.length) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (!order[0].driverId) {
      return new NextResponse("Order is not assigned", { status: 400 });
    }

    // Unassign using raw SQL
    await prisma.$transaction([
      prisma.$executeRaw`
        UPDATE "Order"
        SET status = 'PENDING', "driverId" = NULL, "assignedAt" = NULL
        WHERE id = ${(await params).orderId}
      `,
      prisma.$executeRaw`
        UPDATE "Driver"
        SET status = 'ONLINE', "activeOrderId" = NULL
        WHERE id = ${order[0].driverId}
      `
    ]);

    // Get updated order details
    const updatedOrder = await prisma.$queryRaw<{ id: string; status: string; assignedAt: Date }[]>`
      SELECT id, status, "assignedAt" FROM "Order" WHERE id = ${(await params).orderId}
    `;

    // Here you would typically:
    // 1. Send notification to the driver
    // 2. Send notification to the customer
    // 3. Update real-time status for all clients

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error("Error unassigning order:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
