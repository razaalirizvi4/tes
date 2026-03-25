import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { DriverStatus } from "@/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const { params } = await context;
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: (await params).driverId },
      include: {
        user: true,
        stats: true,
        orders: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      },
    });

    if (!driver) {
      return new NextResponse("Driver not found", { status: 404 });
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const { params } = await context;
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { status } = data as { status: DriverStatus };

    // If updating status to OFFLINE, check if driver has any active orders
    if (status === 'OFFLINE') {
      const activeOrders = await prisma.order.findFirst({
        where: {
          driverId: (await params).driverId,
          status: {
            in: ['ACCEPTED', 'PICKED_UP']
          }
        }
      });

      if (activeOrders) {
        return new NextResponse(
          "Cannot go offline while having active orders",
          { status: 400 }
        );
      }
    }

    const driver = await prisma.driver.update({
      where: { id: (await params).driverId },
      data: {
        status,
        lastLocation: status === 'OFFLINE' ? null : new Date(),
      },
      include: {
        user: true,
        stats: true,
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error updating driver:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const { params } = await context;
    const user = await getUser();
    if (!user?.role?.includes('ADMIN')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if driver has any active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        driverId: (await params).driverId,
        status: {
          in: ['ACCEPTED', 'PICKED_UP']
        }
      }
    });

    if (activeOrders) {
      return new NextResponse(
        "Cannot delete driver with active orders",
        { status: 400 }
      );
    }

    // Delete driver stats first due to foreign key constraint
    await prisma.driverStats.delete({
      where: { driverId: (await params).driverId }
    });

    // Delete driver
    await prisma.driver.delete({
      where: { id: (await params).driverId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
