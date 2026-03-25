import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

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

        // Fetch order with all details - Try by POSOrder ID first, then by billedOrderId
        let order = await prisma.pOSOrder.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                payments: true,
                restaurant: true,
                order: true
            }
        });

        if (!order) {
            order = await prisma.pOSOrder.findUnique({
                where: { orderId: orderId },
                include: {
                    items: true,
                    payments: true,
                    restaurant: true,
                    order: true
                }
            });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const actualOrderId = order.id; // Correct POSOrder ID for receipt record

        // Check if receipt already exists
        let receipt = await prisma.receipt.findFirst({
            where: { posOrderId: actualOrderId }
        });

        if (!receipt) {
            console.log('Generating new receipt for order:', actualOrderId);

            // Format print-ready JSON
            const receiptData = {
                restaurant: {
                    name: order.restaurant.name,
                    address: order.restaurant.address,
                    city: order.restaurant.city,
                    taxRate: order.restaurant.taxRate,
                    serviceChargeRate: order.restaurant.serviceChargeRate
                },
                order: {
                    id: order.order?.id || order.id,
                    date: order.createdAt,
                    type: order.type,
                    status: order.status
                },
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity,
                    options: item.options
                })),
                totals: {
                    subtotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    tax: order.taxAmount,
                    serviceCharge: order.serviceCharge,
                    discount: order.discountAmount,
                    total: order.totalAmount
                },
                payments: order.payments.map(p => ({
                    method: p.method,
                    amount: p.amount,
                    date: p.createdAt
                }))
            };

            // Create receipt record
            try {
                receipt = await prisma.receipt.create({
                    data: {
                        posOrderId: actualOrderId,
                        jsonData: receiptData,
                        createdBy: user.id
                    }
                });
            } catch (createError) {
                console.error('Error creating receipt record:', createError);
                throw createError;
            }
        }

        return NextResponse.json(receipt);

    } catch (error) {
        console.error('Error generating receipt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
