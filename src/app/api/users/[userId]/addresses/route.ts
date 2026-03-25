import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";




export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
 
    const userId = (await params).userId;
    console.log(userId,"userId")
 
    const body = await req.json();
    const { label, streetAddress, city, state, zipCode, phoneNumber = "", isDefault } = body;

    // Require core address fields, but allow phoneNumber to be optional
    if (!label || !streetAddress || !city || !state || !zipCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
console.log(isDefault, "isDefault")
       // If this is the first address or isDefault is true, unset any existing default
       if (isDefault) {
        await prisma.address.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }
  
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        console.log("no userfound")
        throw new Error("User not found");
      }
    const newAddress =await prisma.address.create({
      data: {
        userId,
        label,
        streetAddress,
        city,
        state,
        zipCode,
        phoneNumber,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    // console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}


export async function GET(req: NextRequest, { params }: { params:  Promise<{ userId: string }> }) {
  try {
    const userId = (await params).userId;
    const addresses =  await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' } // Ensure the default address appears first

    });

    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}




