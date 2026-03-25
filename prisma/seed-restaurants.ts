import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Canning Town, London coordinates: 51.5145, 0.0085
const canningTownRestaurants = [
  {
    name: "Pepenero",
    chainName: "Pepenero Group",
    address: "114 Silvertown Way, Canning Town, London E16 1EA",
    latitude: 51.5145,
    longitude: 0.0085,
    cuisineType: "Italian",
    segment: "Casual Dining",
    city: "London",
    area: "Canning Town",
    rating: 4.5,
    coverImage: "/resturant_images/pepenero.jpg",
    deliveryTime: "25-35",
    minimumOrder: "£15",
    menuItems: [
      {
        label: "Margherita Pizza",
        description: "Classic pizza with tomato, mozzarella, and fresh basil",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
        category: "Pizza",
      },
      {
        label: "Spaghetti Carbonara",
        description: "Creamy pasta with bacon, eggs, and parmesan cheese",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500",
        category: "Pasta",
      },
      {
        label: "Tiramisu",
        description: "Classic Italian dessert with coffee and mascarpone",
        price: 6.99,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500",
        category: "Desserts",
      },
    ],
  },
  {
    name: "The Glass Room",
    chainName: "Glass Room Group",
    address: "57 Hallsville Road, Canning Town, London E16 1EE",
    latitude: 51.515,
    longitude: 0.009,
    cuisineType: "British",
    segment: "Fine Dining",
    city: "London",
    area: "Canning Town",
    rating: 4.7,
    coverImage: "/resturant_images/glassworker.jpg",
    deliveryTime: "30-40",
    minimumOrder: "£20",
    menuItems: [
      {
        label: "Fish and Chips",
        description: "Beer-battered cod with crispy chips and mushy peas",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500",
        category: "Main Course",
      },
      {
        label: "Beef Wellington",
        description: "Tender beef wrapped in puff pastry with mushroom duxelles",
        price: 28.99,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500",
        category: "Main Course",
      },
      {
        label: "Sticky Toffee Pudding",
        description: "Warm date cake with toffee sauce and vanilla ice cream",
        price: 7.99,
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500",
        category: "Desserts",
      },
    ],
  },
  {
    name: "Grizzlys",
    chainName: "Grizzlys Group",
    address: "3 Minnie Baldock Street, Canning Town, London E16 1YE",
    latitude: 51.514,
    longitude: 0.008,
    cuisineType: "American",
    segment: "Casual Dining",
    city: "London",
    area: "Canning Town",
    rating: 4.4,
    coverImage: "/resturant_images/Grizzlys-Canning-Town.jpg",
    deliveryTime: "20-30",
    minimumOrder: "£12",
    menuItems: [
      {
        label: "Classic Burger",
        description: "100% beef patty with lettuce, tomato, pickles, and special sauce",
        price: 11.99,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        category: "Burgers",
      },
      {
        label: "BBQ Ribs",
        description: "Slow-cooked ribs with tangy BBQ sauce and coleslaw",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500",
        category: "BBQ",
      },
      {
        label: "Buffalo Wings",
        description: "Spicy chicken wings with blue cheese dip",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1527477396000-e4c0b6c2c0b6?w=500",
        category: "Appetizers",
      },
    ],
  },
];

// Azure Business Center, Baku coordinates: 40.4093, 49.8671
const azureBusinessCenterRestaurants = [
  {
    name: "Dolce Vita",
    chainName: "Dolce Vita Group",
    address: "Azure Business Center, Nobel Avenue 15, Baku, Azerbaijan",
    latitude: 40.4093,
    longitude: 49.8671,
    cuisineType: "Asian Fusion",
    segment: "Fine Dining",
    city: "Baku",
    area: "Azure Business Center",
    rating: 4.6,
    coverImage: "/resturant_images/dolce-vita.jpg",
    deliveryTime: "35-45",
    minimumOrder: "₼25",
    menuItems: [
      {
        label: "Sushi Platter",
        description: "Assorted fresh sushi and sashimi",
        price: 35.99,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500",
        category: "Sushi",
      },
      {
        label: "California Roll",
        description: "Crab sticks, avocado, and cucumber rolled in seasoned sushi rice.",
        price: 35.99,
        image: "/images/menu/California-Roll.jpg",
        category: "Sushi",
      },
      {
        label: "Spicy Tuna Roll",
        description: "Fresh tuna mixed with spicy mayo, wrapped in seaweed and rice.",
        price: 35.99,
        image: "/images/menu/Spicy-Tuna-Roll.jpg",
        category: "Sushi",
      },
      {
        label: "Pad Thai",
        description: "Stir-fried rice noodles with shrimp and vegetables",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500",
        category: "Noodles",
      },
      {
        label: "Mango Sticky Rice",
        description: "Sweet coconut sticky rice with fresh mango",
        price: 9.99,
        image: "/images/menu/Mango-Sticky-Rice.jpg",
        category: "Desserts",
      },
      {
        label: "Molten Chocolate Sundae",
        description: "Chocolate ice cream topped with warm chocolate sauce and nuts.",
        price: 4.99,
        image: "/images/menu/Molten-Chocolate-Sundae.jpg",
        category: "Desserts",
      },
    ],
  },
  {
    name: "Vertical 29",
    chainName: "Vertical Group",
    address: "Azure Business Center, 29th Floor, Nobel Avenue 15, Baku, Azerbaijan",
    latitude: 40.4095,
    longitude: 49.8673,
    cuisineType: "European",
    segment: "Fine Dining",
    city: "Baku",
    area: "Azure Business Center",
    rating: 4.8,
    coverImage: "/resturant_images/vertical.jpg",
    deliveryTime: "40-50",
    minimumOrder: "₼30",
    menuItems: [
      {
        label: "Grilled Salmon",
        description: "Fresh Atlantic salmon with lemon butter sauce and vegetables",
        price: 32.99,
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500",
        category: "Seafood",
      },
      {
        label: "Beef Tenderloin",
        description: "Premium beef with red wine reduction and roasted potatoes",
        price: 45.99,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500",
        category: "Steak",
      },
      {
        label: "Chocolate Soufflé",
        description: "Warm chocolate soufflé with vanilla ice cream",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500",
        category: "Desserts",
      },
      {
        label: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a rich molten chocolate center.",
        price: 3.99,
        image: "/images/menu/chocolate-lava-cake.jpg",
        category: "Desserts",
      },
      {
        label: "Classic Cheesecake",
        description: "Smooth and creamy cheesecake with a buttery biscuit base.",
        price: 6.99,
        image: "/images/menu/classic-cheesecake.jpg",
        category: "Desserts",
      },
      {
        label: "Orange Juice",
        description: "Freshly squeezed oranges, naturally sweet and full of vitamin C.",
        price: 3.99,
        image: "/images/menu/orange-juice.jpg",
        category: "Fresh Juices",
      },
      {
        label: "Apple juice",
        description: "Crisp apples blended into a refreshing and naturally sweet juice.",
        price: 5.99,
        image: "/images/menu/apple-juice.jpg",
        category: "Fresh Juices",
      },
      {
        label: "Pomegranate Juice",
        description: "Fresh pomegranates pressed into a rich, antioxidant-packed juice.",
        price: 4.99,
        image: "/images/menu/pomegranate-juice.jpg",
        category: "Fresh Juices",
      },
    ],
  },
  {
    name: "Caspian Delights",
    chainName: "Caspian Delights",
    address: "Azure Business Center, Nobel Avenue 15, Baku, Azerbaijan",
    latitude: 40.4091,
    longitude: 49.8669,
    cuisineType: "Italian",
    segment: "Casual Dining",
    city: "Baku",
    area: "Azure Business Center",
    rating: 4.5,
    coverImage: "/resturant_images/capsiandelight.jpg",
    deliveryTime: "25-35",
    minimumOrder: "₼15",
    menuItems: [
      {
        label: "Pepperoni Pizza",
        description: "Classic pizza with pepperoni and mozzarella cheese",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
        category: "Pizza",
      },
      {
        label: "Chicken Alfredo Pasta",
        description: "Creamy alfredo sauce with grilled chicken and fettuccine",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500",
        category: "Pasta",
      },
      {
        label: "Caesar Salad",
        description: "Fresh romaine lettuce with caesar dressing and croutons",
        price: 10.99,
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500",
        category: "Salads",
      },
    ],
  },
];

async function main() {
  console.log("Start seeding ONLY restaurant demo data...");
  console.log("NOTE: This script does NOT touch users or auth.");

  // For this standalone script to work without failing on `vendorProfileId`,
  // we first find any existing vendor in your database to attach these restaurants to.
  // If no vendor exists, we cannot attach a restaurant.
  const anyVendor = await prisma.vendorProfile.findFirst();

  if (!anyVendor) {
    console.error("ERROR: No existing Vendor found in your database.");
    console.error("Restaurants require a vendor to be attached to.");
    console.error("Please create a vendor manually or through your app first before running this script.");
    process.exit(1);
  }

  const vendorProfileId = anyVendor.id;
  console.log(`Using existing vendor with ID: ${vendorProfileId} for restaurants.`);

  // Create restaurants in Canning Town, London (only if they don't exist)
  console.log("Creating restaurants in Canning Town, London...");
  for (const restaurantData of canningTownRestaurants) {
    const { menuItems, ...restaurantInfo } = restaurantData;

    // Check if restaurant already exists by name
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        name: restaurantInfo.name,
      },
    });

    if (existingRestaurant) {
      console.log(`Restaurant '${restaurantInfo.name}' already exists! Updating its cover image instead...`);
      await prisma.restaurant.update({
        where: { id: existingRestaurant.id },
        data: { coverImage: restaurantInfo.coverImage }
      });
      console.log(`Updated cover image for '${restaurantInfo.name}'`);
      continue;
    }

    try {
      const restaurant = await prisma.restaurant.create({
        data: {
          ...restaurantInfo,
          vendor: {
            connect: { id: vendorProfileId },
          },
          menuItems: {
            create: menuItems,
          },
        },
      });
      console.log(`Created restaurant '${restaurant.name}' in Canning Town`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to create restaurant '${restaurantInfo.name}':`, errorMessage);
    }
  }

  // Create restaurants in Azure Business Center, Baku (only if they don't exist)
  console.log("Creating restaurants in Azure Business Center, Baku...");
  for (const restaurantData of azureBusinessCenterRestaurants) {
    const { menuItems, ...restaurantInfo } = restaurantData;

    // Check if restaurant already exists by name
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        name: restaurantInfo.name,
      },
    });

    if (existingRestaurant) {
      console.log(`Restaurant '${restaurantInfo.name}' already exists! Updating its cover image instead...`);
      await prisma.restaurant.update({
        where: { id: existingRestaurant.id },
        data: { coverImage: restaurantInfo.coverImage }
      });
      console.log(`Updated cover image for '${restaurantInfo.name}'`);
      continue;
    }

    try {
      const restaurant = await prisma.restaurant.create({
        data: {
          ...restaurantInfo,
          vendor: {
            connect: { id: vendorProfileId },
          },
          menuItems: {
            create: menuItems,
          },
        },
      });
      console.log(`Created restaurant '${restaurant.name}' in Azure Business Center`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to create restaurant '${restaurantInfo.name}':`, errorMessage);
    }
  }

  console.log("Restaurant seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
