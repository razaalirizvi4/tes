import { create } from 'zustand';
import { Restaurant } from '@/types';

interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  selectedCity: string;
  selectedArea: string;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  setLocation: (city: string, area: string) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurants: [],
  selectedRestaurant: null,
  selectedCity: '',
  selectedArea: '',
  setRestaurants: (restaurants) => set({ restaurants }),
  setSelectedRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
  setLocation: (city, area) => set({ selectedCity: city, selectedArea: area }),
}))
