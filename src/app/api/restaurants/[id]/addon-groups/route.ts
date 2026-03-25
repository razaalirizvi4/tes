import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all addon groups for a restaurant (with options)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;

    const addonGroups = await prisma.addonGroup.findMany({
      where: { restaurantId, isActive: true },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(addonGroups);
  } catch (error) {
    console.error('Error fetching addon groups:', error);
    return NextResponse.json({ error: 'Failed to fetch addon groups' }, { status: 500 });
  }
}

// POST create a new addon group with options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;
    const body = await request.json();
    const { name, displayName, selectionType, isRequired, minSelections, maxSelections, sortOrder, options } = body;

    const addonGroup = await prisma.addonGroup.create({
      data: {
        restaurantId,
        name,
        displayName,
        selectionType: selectionType || 'SINGLE',
        isRequired: isRequired || false,
        minSelections: minSelections || 0,
        maxSelections: maxSelections || null,
        sortOrder: sortOrder || 0,
        options: {
          create: (options || []).map((opt: any, idx: number) => ({
            name: opt.name,
            priceAdjustment: opt.priceAdjustment || 0,
            isDefault: opt.isDefault || false,
            sortOrder: opt.sortOrder ?? idx,
            image: opt.image || null,
            linkedMenuItemId: opt.linkedMenuItemId || null,
          })),
        },
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ addonGroup });
  } catch (error) {
    console.error('Error creating addon group:', error);
    return NextResponse.json({ error: 'Failed to create addon group' }, { status: 500 });
  }
}
