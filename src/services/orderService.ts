import { CartItem } from '@/store/useStore';
import { createOrder } from '@/app/actions/restaurants';
import { prisma } from '@/lib/prisma';

import { Order } from '@prisma/client';

export type ExtendedOrderItem = {
  id: string;
  quantity: number;
  price: number;
  name: string;
  options: any | null;
  menuItem: {
    id: string;
    label: string;
  };
};

export type OrderWithDetails = Order & {
  orderItems: ExtendedOrderItem[];
  user: {
    phoneNumber: string | null;
    name: string | null;
    email: string;
  };
  restaurant: {
    id: string;
    name: string;
    vendorId: string;
    currency?: string | null;
  };
};

export class OrderService {
  async createOrder(
    userId: string,
    restaurantId: string,
    items: CartItem[],
    totalAmount: number,
    phoneNumber: string,
    address: string
  ) {
    const { order, error } = await createOrder(userId, restaurantId, items, totalAmount,phoneNumber, address);
    if (error) {
      throw new Error(error);
    }
    return order;
  }

  private readonly includeConfig = {
    orderItems: {
      include: {
        menuItem: {
          select: {
            id: true,
            label: true,
          },
        },
      },
    },
    user: {
      select: {
        name: true,
        email: true,
      },
    },
    restaurant: {
      select: {
        id: true,
        name: true,
        vendorId: true,
      },
    },
  } as const;

  async getAllOrders(): Promise<OrderWithDetails[]> {
    const orders = await prisma.order.findMany({
      include: this.includeConfig,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return orders as unknown as OrderWithDetails[];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<OrderWithDetails> {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: this.includeConfig,
    });
    return order as unknown as OrderWithDetails;
  }

  async getOrderById(orderId: string): Promise<OrderWithDetails | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: this.includeConfig,
    });
    return order as OrderWithDetails | null;
  }

  // New function to get all orders by userId
  async getOrdersByUserId(userId: string): Promise<OrderWithDetails[] | null> {
    try {
      // Fetch orders for the given userId
      const orders = await prisma.order.findMany({
        where: { userId },
        include: this.includeConfig, // Include related fields like items or user info
      });

      return orders as unknown as OrderWithDetails[] | null;
    } catch (error) {
      console.error('Error fetching orders for user:', error);
      throw new Error('Database query failed');
    }
  }

}


export const orderService = new OrderService();
