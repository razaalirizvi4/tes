import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await context.params; // Await the params object
    const user = await getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const { lat, lng } = data;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new NextResponse('Invalid location data', { status: 400 });
    }

    // Update driver's current location
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLocation: new Date(),
      },
    });

    // Store location history
    await prisma.driverLocation.create({
      data: {
        driverId,
        lat,
        lng,
      },
    });

    // If driver has an active order, update the timestamp
    const activeOrder = await prisma.order.findFirst({
      where: {
        driverId,
        status: {
          in: ['ACCEPTED', 'PICKED_UP'],
        },
      },
    });

    if (activeOrder) {
      await prisma.order.update({
        where: { id: activeOrder.id },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await context.params; // Await the params object
    const user = await getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const whereClause = {
      driverId,
      ...(from || to
        ? {
            timestamp: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const locations = await prisma.driverLocation.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Limit to last 100 locations
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching driver locations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
