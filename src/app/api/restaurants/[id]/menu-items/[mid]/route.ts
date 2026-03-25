import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mid: string }> }
) {
  try {
    const body = await request.json();
    const menuItemId = (await params).mid;

    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: body,
    });

    return NextResponse.json({ menuItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const { id: restaurantId, mid: menuItemId } = await params;

    console.log({ restaurantId, menuItemId });

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      return NextResponse.json(
        { message: "Menu item not found" },
        { status: 404 }
      );
    }

    // Check if the menu item belongs to the correct restaurant
    if (menuItem.restaurantId !== restaurantId) {
      return NextResponse.json(
        {
          message: "This menu item does not belong to the specified restaurant",
        },
        { status: 403 }
      );
    }

    // Delete the menu item
    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    // Return success response
    return NextResponse.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error },
      { status: 500 }
    );
  }
}
