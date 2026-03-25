import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET addon groups assigned to a specific menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const { mid } = await params;

    const menuItemAddons = await prisma.menuItemAddon.findMany({
      where: { menuItemId: mid },
      include: {
        addonGroup: {
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(menuItemAddons);
  } catch (error) {
    console.error('Error fetching menu item addons:', error);
    return NextResponse.json({ error: 'Failed to fetch menu item addons' }, { status: 500 });
  }
}

// POST — assign addon groups to a menu item
// Body: { addonGroupIds: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const { mid } = await params;
    const { addonGroupIds } = await request.json();

    // Remove existing assignments
    await prisma.menuItemAddon.deleteMany({
      where: { menuItemId: mid },
    });

    // Create new assignments
    const data = addonGroupIds.map((groupId: string, idx: number) => ({
      menuItemId: mid,
      addonGroupId: groupId,
      sortOrder: idx,
    }));

    await prisma.menuItemAddon.createMany({ data });

    // Return updated assignments
    const updated = await prisma.menuItemAddon.findMany({
      where: { menuItemId: mid },
      include: {
        addonGroup: {
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error assigning addons:', error);
    return NextResponse.json({ error: 'Failed to assign addons' }, { status: 500 });
  }
}
