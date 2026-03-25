import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Add a new endpoint for managing menu items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const restaurantId = (await params).id;

    const menuItem = await prisma.menuItem.create({
      data: {
        ...body,
        restaurantId,
      },
    });

    return NextResponse.json({ menuItem });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}

// Add a new endpoint for updating menu items
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const menuItemId = (await params).id;

    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: body,
    });

    return NextResponse.json({ menuItem });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating menu item:', error.stack);
    } else {
      console.error('Error updating menu item:', error);
    }
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

// Add a new endpoint for deleting menu items
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const menuItemId = (await params).id;
    console.log(menuItemId,"menuitemid")

    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}

// Add a new endpoint for fetching menu items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        addonGroups: {
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
        },
      },
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}