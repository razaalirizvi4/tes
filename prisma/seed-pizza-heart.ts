import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local (same as other seed scripts)
config({ path: resolve(process.cwd(), ".env.local") });

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
  console.error("Error: Missing Supabase keys!");
  console.error(
    "Please set either SUPABASE_SERVICE_ROLE_KEY (recommended for seed scripts) or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
  process.exit(1);
}

const prisma = new PrismaClient();

// Use service role key if available (for admin operations), otherwise fall back to anon key
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSupabaseUser(
  email: string,
  password: string
): Promise<string | null> {
  try {
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        if (
          error.message.includes("already registered") ||
          error.message.includes("already exists") ||
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")
        ) {
          console.log(
            `User ${email} already exists in Supabase. Attempting to retrieve...`
          );
          const { data: users, error: listError } =
            await supabase.auth.admin.listUsers();
          if (!listError && users?.users) {
            const existingUser = users.users.find((u) => u.email === email);
            if (existingUser?.id) {
              return existingUser.id;
            }
          }
          return null;
        }

        throw new Error(`Error creating Supabase user: ${error.message}`);
      }

      if (!data?.user?.id) {
        console.log(
          `Warning: User created but no user ID returned for ${email}`
        );
        return null;
      }

      return data.user.id;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        if (
          error.message.includes("already registered") ||
          error.message.includes("already exists") ||
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")
        ) {
          console.log(
            `User ${email} already exists in Supabase. This means the user was deleted from Prisma but still exists in auth.`
          );
          return null;
        }

        throw new Error(`Error creating Supabase user: ${error.message}`);
      }

      if (!data?.user?.id) {
        console.log(
          `Warning: User created but no user ID returned for ${email}`
        );
        return null;
      }

      return data.user.id;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Supabase API error while creating user ${email}: ${errorMessage}`
    );
  }
}

async function deletePrismaUserIfExists(email: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      vendorProfile: { include: { restaurants: true } },
      orders: true,
      addresses: true,
    },
  });

  if (!existingUser) {
    return false;
  }

  console.log(`Found existing Prisma user for ${email}, cleaning up...`);

  if (existingUser.vendorProfile) {
    for (const restaurant of existingUser.vendorProfile.restaurants) {
      await prisma.menuItem.deleteMany({
        where: { restaurantId: restaurant.id },
      });
    }
    await prisma.restaurant.deleteMany({
      where: { vendorId: existingUser.vendorProfile.id },
    });
    await prisma.vendorProfile.delete({
      where: { id: existingUser.vendorProfile.id },
    });
  }

  await prisma.orderItem.deleteMany({
    where: { order: { userId: existingUser.id } },
  });
  await prisma.order.deleteMany({
    where: { userId: existingUser.id },
  });
  await prisma.address.deleteMany({
    where: { userId: existingUser.id },
  });

  await prisma.user.delete({
    where: { id: existingUser.id },
  });

  console.log(`Deleted existing Prisma user for ${email}`);
  return true;
}

async function main() {
  console.log("Seeding Pizza Heart restaurant and vendor...");

  const vendorEmail = "admin@pizzaheart.com";
  const vendorPassword = "password";

  // Ensure clean state for this specific vendor (optional but safer for reruns)
  await deletePrismaUserIfExists(vendorEmail);

  // Create Supabase user for the vendor
  let vendorUserId: string | null = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (!vendorUserId && retryCount < maxRetries) {
    try {
      vendorUserId = await createSupabaseUser(vendorEmail, vendorPassword);
      if (vendorUserId) break;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${retryCount + 1} failed: ${errorMessage}`);
    }

    retryCount++;
    if (!vendorUserId && retryCount < maxRetries) {
      console.log(`Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!vendorUserId) {
    throw new Error(
      "Failed to create Supabase user for Pizza Heart vendor. Please ensure 'admin@pizzaheart.com' is deleted from Supabase Auth Users table and try again."
    );
  }

  // Create Prisma user + vendor profile
  const vendorUser = await prisma.user.create({
    data: {
      id: vendorUserId,
      email: vendorEmail,
      name: "Pizza Heart",
      role: "VENDOR",
      approvalStatus: "APPROVED",
      vendorProfile: {
        create: {
          businessName: "Pizza Heart",
          documents: {
            businessLicense: "https://example.com/pizza-heart-license.pdf",
          },
        },
      },
    },
    include: {
      vendorProfile: true,
    },
  });

  if (!vendorUser.vendorProfile) {
    throw new Error("Failed to create vendor profile for Pizza Heart");
  }

  const vendorProfileId = vendorUser.vendorProfile.id;
  console.log(
    `Created Pizza Heart vendor user with id: ${vendorUserId}, vendor profile id: ${vendorProfileId}`
  );

  // Check if Pizza Heart restaurant in Lahore already exists
  const existingRestaurant = await prisma.restaurant.findFirst({
    where: {
      name: "Pizza Heart",
      city: "Lahore",
    },
  });

  if (existingRestaurant) {
    console.log(
      `Restaurant 'Pizza Heart' in Lahore already exists (id: ${existingRestaurant.id}), skipping creation.`
    );
    return;
  }

  // Create Pizza Heart restaurant in Lahore with 3 pizzas, PKR pricing and charges
  const pizzaHeart = await prisma.restaurant.create({
    data: {
      name: "Pizza Heart",
      chainName: "Pizza Heart",
      address: "Lahore, Pakistan",
      latitude: 31.5204,
      longitude: 74.3587,
      cuisineType: "Pizza",
      segment: "Fast Food",
      city: "Lahore",
      area: "Model Town",
      rating: 4.6,
      coverImage:
        "https://images.deliveryhero.io/image/fd-pk/LH/s1ia-listing.jpg",
      deliveryTime: "30-40",
      minimumOrder: "PKR 800",
      deliveryCharges: 200, // PKR
      vendor: {
        connect: { id: vendorProfileId },
      },
      menuItems: {
        create: [
          {
            label: "Malai Botti Pizza",
            description:
              "Creamy, spiced chicken pieces on a cheesy, flavorful crust with fresh toppings.",
            price: 1200, 
            image:
              "https://images.deliveryhero.io/image/fd-pk/products/15255535.jpg?width=400&height=400",
            category: "Pizza",
          },
          {
            label: "Crown crust",
            description:
              "The Royal Pizza",
            price: 1500, 
            image:
              "https://images.deliveryhero.io/image/fd-pk/products/5975500.jpg?width=400&height=400",
            category: "Pizza",
          },
          {
            label: "Tikka Hearts Pizza",
            description:
              "Chicken tikka, onions, bell peppers, tomatoes & cheese",
            price: 1600, 
            image:
              "https://images.deliveryhero.io/image/fd-pk/products/54335.jpg?width=400&height=400",
            category: "Pizza",
          },
          {
            label: "Creamy Alfredo Pasta",
            description:
              "Fettuccine tossed in a rich and creamy Alfredo sauce with parmesan.",
            price: 1100, 
            image:
              "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop",
            category: "Pasta",
          },
          {
            label: "Crunchy Chicken Pasta",
            description:
              "Pasta with crispy chicken and savory seasoning..",
            price: 1150, 
            image:
              "https://images.deliveryhero.io/image/fd-pk/products/5975504.jpg?width=400&height=400",
            category: "Pasta",
          },
          {
            label: "Chicken Tikka Pasta",
            description:
              "Fusion-style pasta with spicy chicken tikka, onions, and a creamy sauce.",
            price: 1250, 
            image:
              "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop",
            category: "Pasta",
          },
        ],
      },
    },
  });

  console.log(
    `Created 'Pizza Heart' restaurant in Lahore with id: ${pizzaHeart.id}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
