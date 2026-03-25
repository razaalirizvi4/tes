import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';




// // Define the OrderItem interface
// interface OrderItem {
//   id: string;
//   menuItemId: string;
//   // Add other properties if needed
// }


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: (await params).id
      },
      include: {
        menuItems: {
          orderBy: {
            category: 'asc',
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

// Add PATCH handler for updating restaurant details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();

    // Validate incoming data
    const {
      id,
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
      // menuItems
    } = body;

    interface RestaurantData {
      name?: string;
      chainName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      cuisineType?: string;
      segment?: string;
      city?: string;
      area?: string;
      rating?: number | null;
      coverImage?: string | null;
      coverImagesList?: string[] | { set: string[] };
      deliveryTime?: string | null;
      minimumOrder?: string | null;
      deliveryCharges?: number | null;
      spottedDate?: Date | string | null;
      closedDate?: Date | string | null;
      country?: string | null;
      currency?: string | null;
    }

    // Build update data object, excluding undefined values and id
    const data: Partial<RestaurantData> = {};

    if (name !== undefined) data.name = name;
    if (chainName !== undefined) data.chainName = chainName;
    if (address !== undefined) data.address = address;
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    if (cuisineType !== undefined) data.cuisineType = cuisineType;
    if (segment !== undefined) data.segment = segment;
    if (city !== undefined) data.city = city;
    if (area !== undefined) data.area = area;
    if (rating !== undefined) data.rating = rating;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (coverImagesList !== undefined) {
      // For Prisma arrays, use set: [] to clear, or set: [values] to set values
      if (coverImagesList && Array.isArray(coverImagesList) && coverImagesList.length > 0) {
        data.coverImagesList = {
          set: coverImagesList
        };
      } else {
        // Clear the array by setting it to empty array
        data.coverImagesList = {
          set: []
        };
      }
    }
    if (deliveryTime !== undefined) data.deliveryTime = deliveryTime;
    if (minimumOrder !== undefined) data.minimumOrder = minimumOrder;
    if (spottedDate !== undefined) data.spottedDate = spottedDate;
    if (closedDate !== undefined) data.closedDate = closedDate;

    // Handle deliveryCharges - can be null to clear it, or a number
    if (deliveryCharges !== undefined) {
      data.deliveryCharges = deliveryCharges === null || deliveryCharges === ''
        ? null
        : (typeof deliveryCharges === 'string' ? parseFloat(deliveryCharges) : deliveryCharges);
    }
    if (country !== undefined) data.country = country || null;
    if (currency !== undefined) data.currency = currency || null;

    // Handle menuItems if provided
    // if (menuItems) {
    //   const existingOrderItems = await prisma.orderItem.findMany({
    //     where: {
    //       menuItemId: { in: menuItems.map((item: MenuItem) => item.id) },
    //     },
    //   });

    //   const menuItemsToDelete = menuItems.filter((item: MenuItem) => !existingOrderItems.some((orderItem: OrderItem) => orderItem.menuItemId === item.id));

    //   const existingMenuItems = await prisma.menuItem.findMany({
    //     where: {
    //       id: { in: menuItems.map((item: MenuItem) => item.id) },
    //     },
    //   });

    //   const menuItemsToUpdate = menuItems.filter((item: MenuItem) => item.id && existingMenuItems.some((existing: MenuItem) => existing.id === item.id));

    //   data.menuItems = menuItems;
    // }

    const restaurant = await prisma.restaurant.update({
      where: {
        id: (await params).id
      },
      data,
      include: {
        menuItems: true,
      },
    });

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

// Add DELETE handler for removing a restaurant

// ✅ Fix DELETE handler





export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const providerId = (await props.params).id;

    if (!providerId) {
      return NextResponse.json({ error: 'Missing restaurant ID' }, { status: 400 });
    }

    // Check if restaurant exists and include related data
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: providerId },
      include: { menuItems: true, orders: true }, // Include related orders as well
    });

    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // 🛑 DELETE related order items first (if needed)
    await prisma.orderItem.deleteMany({
      where: {
        menuItemId: {
          in: existingRestaurant.menuItems.map(item => item.id),
        },
      },
    });

    // 🛑 DELETE related orders (before deleting the restaurant)
    await prisma.order.deleteMany({
      where: {
        restaurantId: providerId,
      },
    });

    // 🛑 DELETE related menu items
    await prisma.menuItem.deleteMany({
      where: {
        restaurantId: providerId,
      },
    });

    // Finally, delete the restaurant
    const deletedRestaurant = await prisma.restaurant.delete({
      where: { id: providerId },
    });

    console.log('Deleted restaurant:', deletedRestaurant);

    return NextResponse.json({ message: 'Restaurant deleted successfully', deletedRestaurant });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete restaurant', details: error },
      { status: 500 }
    );
  }
}
