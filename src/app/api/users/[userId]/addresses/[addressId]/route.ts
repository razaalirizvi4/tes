import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string; addressId: string }> }) {
  try {
    const { userId, addressId } = await params;
    const body = await req.json();
    const { label, streetAddress, city, state, zipCode, phoneNumber, isDefault } = body;

    // Require core address fields, but allow phoneNumber to be optional
    if (!label || !streetAddress || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the address belongs to the user
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress || existingAddress.userId !== userId) {
      return NextResponse.json(
        { error: "Address not found or does not belong to user" },
        { status: 404 }
      );
    }

    const updatedPhoneNumber = phoneNumber ?? existingAddress.phoneNumber;

    // If this address is being set as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
          NOT: { id: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        label,
        streetAddress,
        city,
        state,
        zipCode,
        phoneNumber: updatedPhoneNumber,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(updatedAddress, { status: 200 });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params:  Promise<{ userId: string; addressId: string }> }) {
  try {
    const { userId, addressId } = await params;

    // Check if the address belongs to the user
    const address = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
    });

    // If the address to be deleted is the default address, set a new default address
    if (address && address.isDefault) {
      // Get another address to set as default if available
      const otherAddress = await prisma.address.findFirst({
        where: {
          userId,
          NOT: { id: addressId },
        },
        orderBy: { createdAt: "asc" }, // Choose the oldest address or any criteria you prefer
      });

      if (otherAddress) {
        await prisma.address.update({
          where: { id: otherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    // Delete the address
    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    return NextResponse.json(
      { message: "Address deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
