import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const user = await getUser();
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await params;
        const { method, amount } = await request.json();

        if (!method || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Method and valid amount required' }, { status: 400 });
        }

        // Fetch order to verify total
        const order = await prisma.pOSOrder.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                restaurant: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'OPEN' && order.status !== 'PREPARING') {
            return NextResponse.json({ error: 'Order is not in a payable status' }, { status: 400 });
        }

        // In a real POS, we might allow partial payments, but for MVP let's require full amount
        if (amount < order.totalAmount) {
            return NextResponse.json({ error: 'Insufficient payment amount' }, { status: 400 });
        }

        // 1. Create POSPayment
        // 2. Update Order status
        // 3. Update POSOrder status

        const [payment, updatedOrder, updatedPOSOrder] = await prisma.$transaction([
            // Create payment record
            prisma.pOSPayment.create({
                data: {
                    posOrderId: orderId,
                    method,
                    amount,
                    createdBy: user.id
                }
            }),

            // Update Main Order
            prisma.order.update({
                where: { id: order.orderId },
                data: {
                    status: 'DELIVERED',
                    paymentMethod: method,
                    totalAmount: order.totalAmount, // Ensure total is synced
                    // Items are already synced during PATCH
                }
            }),

            // Update POSOrder status
            prisma.pOSOrder.update({
                where: { id: orderId },
                data: {
                    status: 'BILLED',
                    // orderId is already set
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            order: updatedPOSOrder,
            payment,
            mainOrderId: order.orderId
        });

    } catch (error) {
        console.error('Error processing POS payment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
