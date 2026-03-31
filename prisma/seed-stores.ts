import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockRestaurants: Array<any> = [
  {
    name: "Fresh Market Grocery",
    chainName: "Fresh Market",
    address: "Azure Business Center, Baku",
    latitude: 40.3787,
    longitude: 49.8659,
    cuisineType: "Groceries",
    segment: "Retail",
    city: "Baku",
    area: "Azure Business Center",
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    deliveryTime: "15-25",
    minimumOrder: "$20",
    storeType: "GROCERY",
    menuItems: [
      {
        label: "Organic Bananas",
        description: "Bunch of 5-6 organic bananas",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=500",
        category: "Fresh Produce"
      },
      {
        label: "Whole Milk",
        description: "1 Gallon of fresh whole milk",
        price: 4.49,
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500",
        category: "Dairy"
      },
      {
        label: "Sourdough Bread",
        description: "Freshly baked artisan sourdough loaf",
        price: 5.99,
        image: "https://images.unsplash.com/photo-1585445422617-101d674c0a13?w=500",
        category: "Bakery"
      },
      {
        label: "Avocado",
        description: "Ripe Hass Avocado (1 each)",
        price: 1.99,
        image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500",
        category: "Fresh Produce"
      }
    ]
  },
  {
    name: "Bloom & Wild Flowers",
    chainName: "Bloom & Wild",
    address: "Azure Business Center, Baku",
    latitude: 40.3787,
    longitude: 49.8659,
    cuisineType: "Flowers",
    segment: "Retail",
    city: "Baku",
    area: "Azure Business Center",
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800",
    deliveryTime: "30-45",
    minimumOrder: "$30",
    storeType: "FLOWER_SHOP",
    menuItems: [
      {
        label: "Classic Red Roses",
        description: "Bouquet of 12 premium red roses with greenery",
        price: 45.00,
        image: "https://images.unsplash.com/photo-1563241527-300ecb1ae9a0?w=500",
        category: "Bouquets"
      },
      {
        label: "Spring Tulips",
        description: "Colorful mix of 20 fresh tulips",
        price: 35.00,
        image: "https://images.unsplash.com/photo-1520764836476-cb53d6ebef42?w=500",
        category: "Bouquets"
      },
      {
        label: "White Orchid Plant",
        description: "Elegant double-stem white Phalaenopsis orchid in ceramic pot",
        price: 55.00,
        image: "https://images.unsplash.com/photo-1565557623262-b91c0683a650?w=500",
        category: "Plants"
      }
    ]
  },
  {
    name: "Urban Style Apparel",
    chainName: "Urban Style",
    address: "Azure Business Center, Baku",
    latitude: 40.3787,
    longitude: 49.8659,
    cuisineType: "Clothing",
    segment: "Retail",
    city: "Baku",
    area: "Azure Business Center",
    rating: 4.6,
    coverImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800",
    deliveryTime: "45-60",
    minimumOrder: "$50",
    storeType: "GENERAL",
    menuItems: [
      {
        label: "Classic White T-Shirt",
        description: "100% Cotton premium basic tee. Available in sizes S-XL.",
        price: 25.00,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        category: "Tops"
      },
      {
        label: "Slim Fit Denim Jeans",
        description: "Classic blue wash slim fit denim jeans.",
        price: 65.00,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
        category: "Bottoms"
      },
      {
        label: "Cozy Fleece Hoodie",
        description: "Oversized grey fleece hoodie for maximum comfort.",
        price: 50.00,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
        category: "Outerwear"
      }
    ]
  }
];

const VENDOR_ID = "cmkgnr0910000tdno6zfkrl60";

async function main() {
  console.log('Start seeding new stores...');

  const vendorExists = await prisma.vendorProfile.findUnique({
    where: { id: VENDOR_ID },
  });

  if (!vendorExists) {
    console.error(`Vendor ID '${VENDOR_ID}' does not exist! Cannot seed stores.`);
    return;
  }

  for (const restaurantData of mockRestaurants) {
    const { menuItems, storeType, ...restaurantInfo } = restaurantData;

    try {
      const restaurant = await prisma.restaurant.create({
        data: {
          ...restaurantInfo,
          storeType: storeType as any,
          vendor: {
            connect: { id: VENDOR_ID },
          },
          menuItems: {
            create: menuItems,
          },
        },
        include: { menuItems: true },
      });
      console.log(`Created store '${restaurant.name}' with id: ${restaurant.id}`);
    } catch (e) {
      console.error(`Error creating ${restaurantData.name}:`, e);
    }
  }
  
  console.log('Seeding new stores finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
