import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId, type = 'walkin', notes } = await request.json();

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Check if user has POS role
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!['POS_CASHIER', 'POS_MANAGER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'].includes(userData?.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify restaurant access
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ...(userData?.role === 'VENDOR' && { vendor: { userId: user.id } })
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found or access denied' }, { status: 404 });
    }

    // ** NEW: Create Order FIRST **
    const order = await prisma.order.create({
      data: {
        userId: user.id || 'system',
        restaurantId,
        status: 'PENDING',        // Will update when sent to kitchen/paid
        paymentMethod: 'pending',
        totalAmount: 0,           // Will calculate when items added
        deliveryAddress: restaurant.address || 'Walk-in',
        orderType: 'POS',         // Distinguish from DELIVERY
        orderItems: {
          create: []              // Empty initially
        }
      }
    });

    // Create POSOrder linked to Order
    const posOrder = await prisma.pOSOrder.create({
      data: {
        orderId: order.id,        // ← Link to Order (Required)
        restaurantId,
        type,
        notes,
        createdBy: user.id,
        status: 'OPEN'
      }
    });

    return NextResponse.json(posOrder);
  } catch (error) {
    console.error('Error creating POS order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status') || 'OPEN';

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Check permissions
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    const orders = await prisma.pOSOrder.findMany({
      where: {
        restaurantId,
        status,
        ...(userData?.role === 'VENDOR' && { restaurant: { vendor: { userId: user.id } } })
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        payments: true,
        order: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching POS orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}