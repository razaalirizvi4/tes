'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


export async function getRestaurants(storeType?: string) {
  try {
    const where: any = {};
    if (storeType) {
      where.storeType = storeType;
    }
    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: {
        rating: 'desc',
      },
    });
    return { restaurants: restaurants ?? [] };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return { error: 'Failed to fetch restaurants', restaurants: [] };
  }
}

export async function getRestaurant(id: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: {
          include: {
            addonGroups: {
              include: {
                addonGroup: {
                  include: {
                    options: {
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    return { restaurant };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return { error: 'Failed to fetch restaurant' };
  }
}

export async function createOrder(
  userId: string,
  restaurantId: string,
  
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    name: string;
  }>,
  totalAmount: number,
  address: string,
  phoneNumber: string,
  params: {
    vertical?: string;
    substitutionPref?: string;
    scheduledDate?: string;
    scheduledSlot?: string;
    recipientName?: string;
    recipientPhone?: string;
  } = {}
) {
  try {
    console.log("createOrder", userId, restaurantId, items, totalAmount, address);
    const orderData = {
      userId,
      restaurantId,
      status: 'PENDING',
      totalAmount,
      deliveryAddress: address,
      orderItems: {
        create: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
      },
      phoneNumber,
      orderVertical: (params as any).vertical || 'RESTAURANT',
      substitutionPref: (params as any).substitutionPref || 'contact',
      scheduledDate: (params as any).scheduledDate ? new Date((params as any).scheduledDate) : null,
      scheduledSlot: (params as any).scheduledSlot || null,
      recipientName: (params as any).recipientName || null,
      recipientPhone: (params as any).recipientPhone || null,
    } as any;

    const order = await prisma.order.create({
      data: orderData,
      include: {
        orderItems: true,
      },
    });

    revalidatePath('/orders');
    return { order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { error: 'Failed to create order' };
  }
}
