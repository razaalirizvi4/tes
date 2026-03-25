import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("sb-access-token")?.value;
        if (!token) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user?.id) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get("restaurantId");
        const pageParam = searchParams.get("page");
        const pageSizeParam = searchParams.get("pageSize");

        if (!restaurantId) {
            return NextResponse.json(
                { error: "Restaurant ID required" },
                { status: 400 }
            );
        }

        // Verify permission
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { vendorProfile: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If vendor, ensure they own the restaurant
        if (dbUser.role === 'VENDOR') {
            const restaurant = await prisma.restaurant.findFirst({
                where: {
                    id: restaurantId,
                    vendorId: dbUser.vendorProfile?.id
                }
            });
            if (!restaurant) {
                return NextResponse.json({ error: "Unauthorized access to restaurant" }, { status: 403 });
            }
        }
        // TODO: Add stricter checks for other roles if needed

        const page = Math.max(parseInt(pageParam ?? "1", 10) || 1, 1);
        const pageSize = Math.max(parseInt(pageSizeParam ?? "10", 10) || 10, 1);
        const skip = (page - 1) * pageSize;

        const [total, shifts] = await Promise.all([
            prisma.shift.count({
                where: { restaurantId },
            }),
            prisma.shift.findMany({
                where: { restaurantId },
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    _count: {
                        select: { transactions: true }
                    }
                },
                orderBy: { openedAt: "desc" },
                skip,
                take: pageSize,
            }),
        ]);

        // Transform data for frontend
        const shiftsWithStats = shifts.map(shift => {
            const totalSales = shift.cashSales + shift.cardSales + shift.qrSales;
            const expectedCash = shift.openingFloat + shift.cashSales + shift.cashIn - shift.cashOut;
            const actualCash = shift.closingAmount ?? 0;
            const variance = shift.closedAt ? (actualCash - expectedCash) : 0;

            return {
                id: shift.id,
                cashierName: shift.user.name || shift.user.email,
                openedAt: shift.openedAt,
                closedAt: shift.closedAt,
                status: shift.closedAt ? 'CLOSED' : 'OPEN',
                sales: {
                    total: totalSales,
                    cash: shift.cashSales,
                    card: shift.cardSales,
                    qr: shift.qrSales
                },
                cashDrawer: {
                    opening: shift.openingFloat,
                    closing: shift.closingAmount,
                    expected: expectedCash,
                    variance: variance
                },
                transactionCount: shift._count.transactions
            };
        });

        return NextResponse.json({
            data: shiftsWithStats,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });

    } catch (error) {
        console.error("Error fetching shift reports:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
