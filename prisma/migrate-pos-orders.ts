import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOrphanedPOSOrders() {
    console.log('🔍 Finding POSOrders without linked Orders...');

    // Find POSOrders that don't have a billedOrderId (will be renamed to orderId)
    const orphanedPOSOrders = await prisma.$queryRaw<any[]>`
    SELECT * FROM "POSOrder" WHERE "billedOrderId" IS NULL
  `;

    console.log(`📊 Found ${orphanedPOSOrders.length} orphaned POSOrders`);

    if (orphanedPOSOrders.length === 0) {
        console.log('✅ No orphaned POSOrders found. Migration not needed.');
        return;
    }

    for (const posOrder of orphanedPOSOrders) {
        try {
            // Get restaurant for delivery address
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: posOrder.restaurantId }
            });

            if (!restaurant) {
                console.log(`⚠️  POSOrder ${posOrder.id}: Restaurant not found, skipping...`);
                continue;
            }

            // Get items for this POS order
            const items = await prisma.pOSOrderItem.findMany({
                where: { posOrderId: posOrder.id }
            });

            // Create corresponding Order
            const order = await prisma.order.create({
                data: {
                    userId: posOrder.createdBy,
                    restaurantId: posOrder.restaurantId,
                    status: posOrder.status === 'BILLED' ? 'DELIVERED' : 'PENDING',
                    paymentMethod: posOrder.status === 'BILLED' ? 'cash' : 'pending',
                    totalAmount: posOrder.totalAmount || 0,
                    deliveryAddress: restaurant.address,
                    orderType: 'POS',
                    createdAt: posOrder.createdAt,
                    updatedAt: posOrder.updatedAt,
                    orderItems: {
                        create: items.map(item => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            price: item.price,
                            name: item.name,
                            options: item.options || {}
                        }))
                    }
                }
            });

            // Update POSOrder with the new Order ID
            await prisma.$executeRaw`
        UPDATE "POSOrder" 
        SET "billedOrderId" = ${order.id}
        WHERE id = ${posOrder.id}
      `;

            console.log(`✅ Created Order ${order.id.slice(-8)} for POSOrder ${posOrder.id.slice(-8)}`);

        } catch (error) {
            console.error(`❌ Error processing POSOrder ${posOrder.id}:`, error);
        }
    }

    console.log('✨ Migration complete!');
}

// Run migration
migrateOrphanedPOSOrders()
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
