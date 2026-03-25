import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const user = await getUser();
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await params;
        const body = await request.json();
        const { items, discountAmount, notes, status } = body;

        // Validate input
        if (items !== undefined) {
            if (!Array.isArray(items)) {
                return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
            }
            // Validate each item
            for (const item of items) {
                if (!item.menuItemId || typeof item.menuItemId !== 'string') {
                    return NextResponse.json({ error: 'Invalid menuItemId in items' }, { status: 400 });
                }
                if (!item.name || typeof item.name !== 'string' || item.name.length > 255) {
                    return NextResponse.json({ error: 'Invalid item name' }, { status: 400 });
                }
                if (typeof item.price !== 'number' || item.price < 0) {
                    return NextResponse.json({ error: 'Invalid item price' }, { status: 400 });
                }
                if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                    return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
                }
            }
        }

        if (discountAmount !== undefined && (typeof discountAmount !== 'number' || discountAmount < 0)) {
            return NextResponse.json({ error: 'Invalid discount amount' }, { status: 400 });
        }

        if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
            return NextResponse.json({ error: 'Invalid notes (max 500 characters)' }, { status: 400 });
        }

        if (status !== undefined && !['OPEN', 'PREPARING', 'READY', 'BILLED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        // Check if order exists and get restaurant info
        const existingOrder = await prisma.pOSOrder.findUnique({
            where: { id: orderId },
            include: {
                restaurant: true,
                items: true
            }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (existingOrder.status === 'BILLED' || existingOrder.status === 'CANCELLED') {
            return NextResponse.json({ error: 'Cannot update a closed or cancelled order' }, { status: 400 });
        }

        const restaurant = existingOrder.restaurant;

        // 1. Update Items if provided
        if (items && Array.isArray(items)) {
            await prisma.pOSOrderItem.deleteMany({
                where: { posOrderId: orderId }
            });

            await prisma.pOSOrderItem.createMany({
                data: items.map((item: any) => ({
                    posOrderId: orderId,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name,
                    options: item.options || {},
                    discount: item.discount || 0
                }))
            });
        }

        // 2. Calculate Totals (even if items weren't provided, use existing ones for status update)
        const currentItems = items || existingOrder.items;
        const subtotal = currentItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        let taxAmount = 0;
        if (restaurant.taxRate && !restaurant.isTaxIncluded) {
            taxAmount = subtotal * (restaurant.taxRate / 100);
        }

        let serviceCharge = 0;
        if (restaurant.serviceChargeRate) {
            serviceCharge = subtotal * (restaurant.serviceChargeRate / 100);
        }

        const currentDiscount = discountAmount !== undefined ? discountAmount : existingOrder.discountAmount;
        const totalAmount = subtotal + taxAmount + serviceCharge - currentDiscount;

        // 3. Status update
        if (status && !['OPEN', 'PREPARING', 'READY', 'BILLED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        // ** UPDATE BOTH Order and POSOrder **
        const [updatedOrder, updatedPOSOrder] = await prisma.$transaction([
            // Update Order (primary record)
            prisma.order.update({
                where: { id: existingOrder.orderId },
                data: {
                    totalAmount,
                    status: status === 'PREPARING' ? 'PREPARING' : undefined,
                    orderItems: {
                        deleteMany: {},
                        create: currentItems.map((item: any) => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            price: item.price,
                            name: item.name,
                            options: item.options || {}
                        }))
                    }
                },
                include: {
                    orderItems: true
                }
            }),

            // Update POSOrder (metadata snapshot)
            prisma.pOSOrder.update({
                where: { id: orderId },
                data: {
                    totalAmount,
                    taxAmount,
                    serviceCharge,
                    discountAmount: currentDiscount,
                    notes: notes !== undefined ? notes : existingOrder.notes,
                    status: status || existingOrder.status,
                    items: {
                        deleteMany: {},
                        create: currentItems.map((item: any) => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            price: item.price,
                            name: item.name,
                            options: item.options || {},
                            discount: item.discount || 0
                        }))
                    }
                },
                include: {
                    items: true,
                    order: true
                }
            })
        ]);

        return NextResponse.json(updatedPOSOrder);
    } catch (error) {
        console.error('Error updating POS order items:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const user = await getUser();
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await params;

        const order = await prisma.pOSOrder.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                },
                payments: true,
                restaurant: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching POS order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
