import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Order,
  OrderItem,
  MenuItem,
  User,
  Restaurant,
  Prisma,
} from "@prisma/client";

// OrderWithDetails type is defined in services/orderService.ts

// export async function POST(request: Request) {
//   try {
//     const { userId, restaurantId, items, totalAmount } = await request.json();

//     if (!userId || !restaurantId || !items || !totalAmount) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // First verify the user exists
//     const userExists = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!userExists) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const order = await prisma.order.create({
//       data: {
//         totalAmount,
//         deliveryAddress: "",
//         status: "PENDING",
//         user: {
//           connect: {
//             id: userId,
//           },
//         },
//         restaurant: {
//           connect: {
//             id: restaurantId,
//           },
//         },
//         orderItems: {
//           create: items.map((item: OrderItemInput) => ({
//             menuItemId: item.menuItemId,
//             quantity: item.quantity,
//             price: item.price,
//             name: item.name,
//             options: item.options ? JSON.stringify(item.options) : null,
//           })),
//         },
//       },
//       include: {
//         orderItems: {
//           include: {
//             menuItem: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(order);
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Error creating order:", error.stack);
//     } else {
//       console.error("Error creating order:", error);
//     }
//     return NextResponse.json(
//       { error: "Failed to create order" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request: Request) {
  try {
    // Parse the incoming request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body) {
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 }
      );
    }

    // Destructure with defaults for optional fields
    const {
      userId,
      restaurantId,
      items,
      totalAmount,
      selectedAddress,
      specialInstructions,
      paymentMethod,
      phoneNumber,
    } = body;

    // Validate required fields
    if (
      !userId ||
      !restaurantId ||
      !items ||
      !totalAmount ||
      !selectedAddress ||
      !paymentMethod
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, verify that the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the order in the database
    interface OrderItemInput {
      menuItemId: string;
      quantity: number;
      price: number;
      name: string;
      options?: Record<string, string | number | boolean>;
    }

    const order = await prisma.order.create({
      data: {
        totalAmount,
        deliveryAddress: selectedAddress, // Save the address string directly
        status: "PENDING", // Initial order status
        specialInstructions: specialInstructions,
        paymentMethod: paymentMethod,
        phoneNumber: phoneNumber,
        user: {
          connect: {
            id: userId,
          },
        },
        restaurant: {
          connect: {
            id: restaurantId,
          },
        },
        orderItems: {
          create: items.map((item: OrderItemInput) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            options: item.options ? JSON.stringify(item.options) : null,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Return the created order data as a response
    const createdOrder = order;

    // Sync with POS System: Create a corresponding POSOrder
    try {
      await prisma.pOSOrder.create({
        data: {
          restaurantId,
          type: 'online', // Distinguish from walkin
          status: 'OPEN', // So it appears in Active Orders
          orderId: createdOrder.id, // Link to main Order table
          totalAmount,
          createdBy: userId, // associate with the customer user id for tracking
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              addons: item.options ? JSON.stringify(item.options) : null,
            }))
          }
        }
      });
    } catch (posError) {
      console.error("Failed to sync POS order:", posError);
      // We don't block the main order creation if POS sync fails, but we log it.
    }

    return NextResponse.json(createdOrder);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating order:", error.stack);
    } else {
      console.error("Error creating order:", error);
    }

    // Return an error response if something went wrong
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const vendorId = url.searchParams.get("vendorId");
    const status = url.searchParams.get("status");
    const driverId = url.searchParams.get("driverId");
    const restaurantId = url.searchParams.get("restaurantId");
    const orderId = url.searchParams.get("orderId");
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    const hasPaginationParams = Boolean(pageParam || pageSizeParam);

    const page = Math.max(parseInt(pageParam ?? "1", 10) || 1, 1);
    const pageSize = Math.max(parseInt(pageSizeParam ?? "10", 10) || 10, 1);

    const orderInclude = {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      user: true,
      restaurant: true,
      driver: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    } as const;

    // If orderId is provided, fetch single order
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(order);
    }

    const where: Prisma.OrderWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (vendorId) {
      where.restaurant = {
        vendorId,
      };
    }

    if (status) {
      where.status = status as Order["status"];
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const queryOptions = {
      where,
      include: orderInclude,
      orderBy: {
        createdAt: "desc" as const,
      },
    };

    if (hasPaginationParams) {
      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          ...queryOptions,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return NextResponse.json({
        data: orders,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
      });
    }

    // If no pagination params, return all orders (for backward compatibility)
    const orders = await prisma.order.findMany(queryOptions);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate cancellation - only allow if order is PENDING or CONFIRMED
    if (status === "CANCELLED") {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (!existingOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      const currentStatus = existingOrder.status.toUpperCase();
      if (currentStatus !== "PENDING" && currentStatus !== "CONFIRMED") {
        return NextResponse.json(
          { error: "Order cannot be cancelled. Cancellation is only available before the restaurant starts preparing." },
          { status: 400 }
        );
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        user: true,
        restaurant: true,
        driver: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
