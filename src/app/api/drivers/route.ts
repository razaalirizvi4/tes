import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.role?.includes('ADMIN')) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { userId, vehicleType, phoneNumber, licenseNumber, documents } = data;

    // Create driver profile
    const driver = await prisma.driver.create({
      data: {
        userId,
        vehicleType,
        documents: {
          licenseNumber,
          phoneNumber,
          ...documents
        },
        status: 'OFFLINE',
      },
      include: {
        user: true,
      },
    });

    // Create initial driver stats
    await prisma.driverStats.create({
      data: {
        driverId: driver.id,
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error creating driver:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    // Allow ADMIN, SUPER_ADMIN, and VENDOR roles to access drivers
    // For now, display all drivers to all vendors (as requested)
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get user role from database to check permissions
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true },
    });
    
    const userRole = dbUser?.role || user.user_metadata?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isVendor = userRole === 'VENDOR';
    
    if (!isAdmin && !isVendor) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const vehicleType = searchParams.get('vehicleType');

    let where = {};
    if (status) {
      where = { ...where, status };
    }
    if (vehicleType) {
      where = { ...where, vehicleType };
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: true,
        stats: true,
        activeOrder: {
          select: {
            id: true,
            status: true,
          },
        },
        // Fallback source for live tracking: if activeOrder relation is stale/null,
        // use the driver's latest non-finalized order (same idea as Orders screen).
        orders: {
          where: {
            status: {
              in: [
                'PENDING',
                'ACCEPTED',
                'CONFIRMED',
                'PREPARING',
                'READY_FOR_PICKUP',
                'PICKUP_CONFIRMED',
                'PICKED_UP',
                'OUT_FOR_DELIVERY',
              ],
            },
          },
          select: {
            id: true,
            status: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const normalized = drivers.map((driver) => {
      const latestOrder = driver.orders[0] ?? null;
      return {
        ...driver,
        activeOrder: driver.activeOrder ?? latestOrder,
        orders: undefined,
      };
    });

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}