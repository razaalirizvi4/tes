import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const where: Record<string, unknown> = { restaurantId, isAvailable: true };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    } else {
      where.date = { gte: new Date() };
    }

    const slots = await prisma.deliverySlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching delivery slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery slots" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;
    const body = await request.json();
    const { slots } = body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "Slots array is required" },
        { status: 400 }
      );
    }

    const created = await prisma.deliverySlot.createMany({
      data: slots.map(
        (slot: { date: string; startTime: string; endTime: string; maxOrders?: number }) => ({
          id: crypto.randomUUID(),
          restaurantId,
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxOrders: slot.maxOrders || 20,
        })
      ),
      skipDuplicates: true,
    });

    return NextResponse.json({ count: created.count });
  } catch (error) {
    console.error("Error creating delivery slots:", error);
    return NextResponse.json(
      { error: "Failed to create delivery slots" },
      { status: 500 }
    );
  }
}
