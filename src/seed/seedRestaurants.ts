import './loadEnv';
import { prisma } from '../lib/prisma';

interface MenuItem {
  label: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface Restaurant {
  name: string;
  chainName: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cuisineType: string;
  segment: string;
  spottedDate: string;
  closedDate: string | null;
  rating: number;
  coverImage: string;
  menuItems: MenuItem[];
  city: string;
  area: string;
}
const mockRestaurants: Restaurant[] = [
  {
    name: "The Italian Corner",
    chainName: "Independent",
    address: "123 Main St, New York, NY 10001",
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    cuisineType: "Italian",
    segment: "Casual Dining",
    spottedDate: "2023-01-01",
    closedDate: null,
    rating: 4.5,
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    city: "New York",
    area: "Manhattan",
    menuItems: [
      {
        label: "Margherita Pizza",
        description: "Fresh tomatoes, mozzarella, basil, and olive oil",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
        category: "Pizza"
      },
      {
        label: "Fettuccine Alfredo",
        description: "Creamy parmesan sauce with fresh pasta",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a",
        category: "Pasta"
      }
    ]
  },
  {
    name: "Sushi Master",
    chainName: "Sushi Master Group",
    address: "456 Broadway, New York, NY 10013",
    coordinates: {
      latitude: 40.7193,
      longitude: -74.0024
    },
    cuisineType: "Japanese",
    segment: "Fine Dining",
    spottedDate: "2023-02-15",
    closedDate: null,
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    city: "New York",
    area: "Manhattan",
    menuItems: [
      {
        label: "Dragon Roll",
        description: "Eel, cucumber, avocado, and tobiko",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
        category: "Rolls"
      },
      {
        label: "Salmon Nigiri",
        description: "Fresh salmon over seasoned rice",
        price: 8.99,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
        category: "Nigiri"
      }
    ]
  },
  {
    name: "Taco Fiesta",
    chainName: "Independent",
    address: "789 5th Ave, Los Angeles, CA 90001",
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437
    },
    cuisineType: "Mexican",
    segment: "Fast Casual",
    spottedDate: "2023-03-01",
    closedDate: null,
    rating: 4.3,
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    city: "Los Angeles",
    area: "Downtown",
    menuItems: [
      {
        label: "Street Tacos",
        description: "Three corn tortillas with choice of meat, onions, and cilantro",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b",
        category: "Tacos"
      },
      {
        label: "Burrito Supreme",
        description: "Large flour tortilla filled with meat, rice, beans, and toppings",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f",
        category: "Burritos"
      }
    ]
  },
  {
    name: "Burger Haven",
    chainName: "Independent",
    address: "112 Elm St, Chicago, IL 60601",
    coordinates: {
      latitude: 41.8781,
      longitude: -87.6298
    },
    cuisineType: "American",
    segment: "Fast Casual",
    spottedDate: "2023-04-10",
    closedDate: null,
    rating: 4.6,
    coverImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
    city: "Chicago",
    area: "Downtown",
    menuItems: [
      {
        label: "Classic Cheeseburger",
        description: "Juicy beef patty with cheese, lettuce, tomato, and pickles",
        price: 10.99,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349",
        category: "Burgers"
      },
      {
        label: "Veggie Burger",
        description: "Plant-based patty with avocado and vegan mayo",
        price: 11.99,
        image: "https://images.unsplash.com/photo-1574349766035-c86f50d6a0f6",
        category: "Burgers"
      }
    ]
  },
  {
    name: "Curry House",
    chainName: "Spice World",
    address: "221B Baker St, London, UK NW1 6XE",
    coordinates: {
      latitude: 51.5237,
      longitude: -0.1586
    },
    cuisineType: "Indian",
    segment: "Casual Dining",
    spottedDate: "2023-05-01",
    closedDate: null,
    rating: 4.7,
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    city: "London",
    area: "Marylebone",
    menuItems: [
      {
        label: "Butter Chicken",
        description: "Creamy tomato-based curry with tender chicken pieces",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1598514983375-3b03d1b6cc9d",
        category: "Curries"
      },
      {
        label: "Paneer Tikka Masala",
        description: "Grilled paneer in a rich tomato gravy",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1610882342611-7e6d5ae72d0a",
        category: "Curries"
      }
    ]
  }
];
async function clearExistingData() {
  await prisma.menuItem.deleteMany({});
  await prisma.restaurant.deleteMany({});
  console.log('Cleared existing restaurant data');
}

async function seedRestaurants() {
  try {
    // Clear existing data
    await clearExistingData();

    // Add new restaurants
    for (const restaurantData of mockRestaurants) {
      const { menuItems, coordinates, ...rest } = restaurantData;
      
      const restaurant = await prisma.restaurant.create({
        data: {
          ...rest,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          spottedDate: new Date(restaurantData.spottedDate),
          closedDate: restaurantData.closedDate ? new Date(restaurantData.closedDate) : null,
          menuItems: {
            create: menuItems.map(item => ({
              ...item
            }))
          },
          vendorId: process.env.SEED_VENDOR_ID || '', // Make sure to set this in .env
        }
      });
      
      console.log(`Created restaurant: ${restaurant.name}`);
    }

    console.log('Successfully seeded restaurants');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error seeding restaurants:', error.message);
    } else {
      console.error('Error seeding restaurants:', error);
    }
    process.exit(1);
  }
}


// Execute the seed function
seedRestaurants()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
