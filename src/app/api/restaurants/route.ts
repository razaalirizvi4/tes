import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    const restaurants = await prisma.restaurant.findMany({
      where: vendorId ? { vendorId } : {},
      include: {
        menuItems: {
          include: {
            addonGroups: {
              include: {
                addonGroup: true
              }
            }
          }
        },
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}

// DELETE route to remove a restaurant by ID
export async function DELETE(request: NextRequest) {
  const urlSearchParams = new URLSearchParams(request.nextUrl.search);
  const id = urlSearchParams.get('id');
  console.log(id, "idddd")

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    await prisma.restaurant.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      chainName,
      address,
      latitude,
      longitude,
      cuisineType,
      segment,
      city,
      area,
      rating,
      coverImage,
      coverImagesList,
      deliveryTime,
      minimumOrder,
      deliveryCharges,
      spottedDate,
      closedDate,
      country,
      currency,
      vendorId,
    } = await request.json();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        chainName,
        address,
        latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
        longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude,
        cuisineType,
        segment,
        city,
        area,
        rating: rating ? (typeof rating === 'string' ? parseFloat(rating) : rating) : null,
        coverImage: coverImage || null,
        coverImagesList: coverImagesList && Array.isArray(coverImagesList) && coverImagesList.length > 0 ? coverImagesList : [],
        deliveryTime: deliveryTime || null,
        minimumOrder: minimumOrder || null,
        deliveryCharges: deliveryCharges ? (typeof deliveryCharges === 'string' ? parseFloat(deliveryCharges) : deliveryCharges) : null,
        spottedDate: spottedDate ? new Date(spottedDate) : null,
        closedDate: closedDate ? new Date(closedDate) : null,
        country: country || null,
        currency: currency || null,
        isActive: true,
        vendor: {
          connect: {
            id: vendorId
          }
        }
      } as any,
    });
    return NextResponse.json(restaurant);
  } catch (error: unknown) {
    console.error('Error creating restaurant:', error);

    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid vendor ID provided' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 });
  }
}
