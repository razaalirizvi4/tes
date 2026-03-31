import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH — update addon group and its options
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { options, ...groupData } = body;

    // Update group fields
    const addonGroup = await prisma.addonGroup.update({
      where: { id: groupId },
      data: groupData,
    });

    // If options are provided, upsert them
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id) {
          // Update existing option
          await prisma.addonOption.update({
            where: { id: opt.id },
            data: {
              name: opt.name,
              priceAdjustment: opt.priceAdjustment,
              isDefault: opt.isDefault,
              sortOrder: opt.sortOrder,
              isActive: opt.isActive,
            },
          });
        } else {
          // Create new option
          await prisma.addonOption.create({
            data: {
              addonGroupId: groupId,
              name: opt.name,
              priceAdjustment: opt.priceAdjustment || 0,
              isDefault: opt.isDefault || false,
              sortOrder: opt.sortOrder || 0,
            },
          });
        }
      }
    }

    // Fetch updated group with options
    const updated = await prisma.addonGroup.findUnique({
      where: { id: groupId },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json({ addonGroup: updated });
  } catch (error) {
    console.error('Error updating addon group:', error);
    return NextResponse.json({ error: 'Failed to update addon group' }, { status: 500 });
  }
}

// DELETE — soft delete (set isActive = false) or hard delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;

    await prisma.addonGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ message: 'Addon group deleted successfully' });
  } catch (error) {
    console.error('Error deleting addon group:', error);
    return NextResponse.json({ error: 'Failed to delete addon group' }, { status: 500 });
  }
}
