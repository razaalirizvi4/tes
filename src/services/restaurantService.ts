import { Restaurant } from '@/types';
import { prisma } from '@/lib/prisma';
/* eslint-disable  @typescript-eslint/no-explicit-any */
class RestaurantService {
  async getRestaurantsByLocation(city: string, area?: string): Promise<Restaurant[]> {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        city,
        ...(area ? { area } : {}),
      },
      include: {
        menuItems: true,
      },
    });

    return restaurants.map(this.mapPrismaRestaurantToModel);
  }

  async getRestaurantsByCoordinates(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<Restaurant[]> {
    // Get all restaurants and filter by distance
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuItems: true,
      },
    });

    return restaurants
      .filter((restaurant: { latitude: number; longitude: number; }) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        return distance <= radiusKm;
      })
      .map(this.mapPrismaRestaurantToModel);
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuItems: true,
      },
    });

    return restaurants.map(this.mapPrismaRestaurantToModel);
  }

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: true,
      },
    });

    return restaurant ? this.mapPrismaRestaurantToModel(restaurant) : null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private mapPrismaRestaurantToModel(prismaRestaurant: any): Restaurant {
    return {
      id: prismaRestaurant.id,
      name: prismaRestaurant.name,
      chainName: prismaRestaurant.chainName,
      address: prismaRestaurant.address,     
      latitude: prismaRestaurant.latitude,
      longitude: prismaRestaurant.longitude,     
      cuisineType: prismaRestaurant.cuisineType,
      segment: prismaRestaurant.segment,
      city: prismaRestaurant.city,
      area: prismaRestaurant.area,
      rating: prismaRestaurant.rating,
      coverImage: prismaRestaurant.coverImage,
      deliveryTime: prismaRestaurant.deliveryTime,
      minimumOrder: prismaRestaurant.minimumOrder,
      spottedDate: prismaRestaurant.spottedDate?.toISOString(),
      closedDate: prismaRestaurant.closedDate?.toISOString(),
      menuItems: prismaRestaurant.menuItems.map((item: any) => ({
        label: item.label,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
      })),
    };
  }
}

export const restaurantService = new RestaurantService();
