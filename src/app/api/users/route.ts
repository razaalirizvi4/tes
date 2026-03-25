import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    const hasPaginationParams = Boolean(pageParam || pageSizeParam);

    const page = Math.max(parseInt(pageParam ?? "1", 10) || 1, 1);
    const pageSize = Math.max(parseInt(pageSizeParam ?? "10", 10) || 10, 1);

    const queryOptions = {
      include: {
        addresses: true,
        vendorProfile: true,
        driver: true,
        orders: {
          select: {
            totalAmount: true,
            status: true, // Include the status of the orders
          },
        },
      },
      orderBy: {
        createdAt: "desc" as const,
      },
    };

    if (hasPaginationParams) {
      const [total, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
          ...queryOptions,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      // Add totalSpent and status for each user
      const usersWithTotalSpentAndStatus = users.map(user => {
        const totalSpent = user.orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const orderStatuses = user.orders.map(order => order.status); // Collect the status of each order
        return {
          ...user,
          totalSpent, // Add the totalSpent to the user object
          orderStatuses, // Include the order statuses
        };
      });

      return NextResponse.json({
        data: usersWithTotalSpentAndStatus,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
      });
    }

    // If no pagination params, return all users (for backward compatibility)
    const users = await prisma.user.findMany(queryOptions);

    // If no users are found, return a 404 error
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users found' }),
        { status: 404 }
      );
    }

    // Add totalSpent and status for each user
    const usersWithTotalSpentAndStatus = users.map(user => {
      const totalSpent = user.orders.reduce((acc, order) => acc + order.totalAmount, 0);
      const orderStatuses = user.orders.map(order => order.status); // Collect the status of each order
      return {
        ...user,
        totalSpent, // Add the totalSpent to the user object
        orderStatuses, // Include the order statuses
      };
    });

    // Return the users with the totalSpent and orderStatuses fields
    return NextResponse.json(usersWithTotalSpentAndStatus);
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
