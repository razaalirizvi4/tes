"use client";
import { Order, SelectedAddon } from "@/types";
import { UserData } from "@/types/user";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import Swal from "sweetalert2";

// const confirmClearCart = async (): Promise<boolean> => {
//   const result = await Swal.fire({
//     title: 'Are you sure?',
//     text: 'You have items from a different restaurant in your cart. Do you want to clear your cart and add the new items?',
//     icon: 'warning',
//     showCancelButton: true,
//     confirmButtonText: 'Yes, clear it!',
//     cancelButtonText: 'No, keep my cart',
//   });

//   return result.isConfirmed;
// };

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  clearUser: () => void;
  setUser: (user: UserData) => void;
  updateProfile: (profile: Partial<UserData>) => void;
  refreshProfile: () => Promise<void>;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string | null;
  restaurantName: string;
  restaurantId: string;
  selectedAddons?: SelectedAddon[];
  addonsTotal?: number;
  options?: {
    [key: string]: string | number | boolean | null;
  };
}

interface CartRestaurant {
  id: string;
  name: string;
}

interface CartState {
  items: CartItem[];
  restaurant: CartRestaurant | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  removeOneItem: (id: string) => void;
  removeMenuItem: (menuItemId: string) => void; // Removes all cart items for a given menuItemId
  clearCart: () => void;
  setRestaurant: (restaurant: CartRestaurant) => void;
}

interface Address {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}
interface AddressState {
  addresses: Address[];
  addAddress: (address: Address) => void;
  updateAddress: (address: Address) => Promise<void>;
  removeAddress: (addressId: string) => void;
  fetchAddresses: () => Promise<void>;
  createAddress: (address: Address) => void; // Add this line
}

interface OrderState {
  orders: Order[]; // Type the orders array
  isLoading: boolean; // Loading state
  fetchOrders: () => Promise<void>; // Define the fetchOrders function
  updateOrder: (orderId: string, updatedOrder: Order) => void; // Update a single order without refetching all
  addOrder: (newOrder: Order) => void; // Add a new order to the list without refetching all
}

interface LocationState {
  citiesAndAreas: { [city: string]: string[] } | null;
  setCitiesAndAreas: (data: { [city: string]: string[] }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),
      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
      updateProfile: (profile) =>
        set((state) => ({
          ...state,
          user: state.user
            ? {
                ...state.user,
                email: profile.email || state.user.email,
                phoneNumber: profile.phoneNumber || state.user.phoneNumber,
              }
            : null,
        })),
      refreshProfile: async () => {
        const { user } = get();
        if (!user?.id) return;
        try {
          const response = await fetch(`/api/users/${user.id}`);
          if (!response.ok) throw new Error("Failed to refresh profile");
          const updatedProfile = await response.json();
          set((state) => ({
            ...state,
            user: updatedProfile,
          }));
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      restaurant: null,
      setRestaurant: (restaurant) =>
        set({
          restaurant,
        }),
      addItem: async (item) => {
        const state = useCartStore.getState(); // Get the current state

        const currentRestaurantId = state.restaurant?.id;
        const cartHasDifferentRestaurant =
          currentRestaurantId &&
          state.items.some((i) => i.restaurantId !== currentRestaurantId);

        if (cartHasDifferentRestaurant) {
          const result = await Swal.fire({
            title: "Are you sure?",
            text: "You have items from a different restaurant in your cart. Do you want to clear your cart and add the new items?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, clear it!",
            cancelButtonText: "No, keep my cart",
          });

          if (!result.isConfirmed) {
            return; // If the user cancels, stop execution
          }

          // If user confirms, clear the cart
          // toast.success(`Added ${item.name} to cart`);
          useCartStore.setState({
            items: [item],
            restaurant: { id: item.restaurantId, name: item.restaurantName },
          });
          return;
        }

        // Helper function to check if selected addons match
        const doAddonsMatch = (addons1?: SelectedAddon[], addons2?: SelectedAddon[]) => {
          if (!addons1 && !addons2) return true;
          if (!addons1 || !addons2) return false;
          if (addons1.length !== addons2.length) return false;
          
          // Sort optionIds to ensure order doesn't matter
          const sorted1 = [...addons1].map(a => `<${a.groupId}:${a.optionId}>`).sort().join(',');
          const sorted2 = [...addons2].map(a => `<${a.groupId}:${a.optionId}>`).sort().join(',');
          return sorted1 === sorted2;
        };

        // Find existing item with same menuItemId AND same addons
        const existingItemIndex = state.items.findIndex(
          (i) => i.menuItemId === item.menuItemId && doAddonsMatch(i.selectedAddons, item.selectedAddons)
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...state.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + item.quantity,
          };
          useCartStore.setState({ items: updatedItems });
          return;
        }

        // Generate ID for new cart item if not provided or empty
        const newItemId = item.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        useCartStore.setState({
          items: [...state.items, { ...item, id: newItemId }],
        });
      },
      removeItem: (id) =>
        set((state) => ({
          ...state,
          items: state.items.filter((i) => i.id !== id),
        })),
      removeOneItem: (id) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === id);
          if (existingItem) {
            if (existingItem.quantity === 1) {
              return {
                ...state,
                items: state.items.filter((i) => i.id !== id),
              };
            }
            return {
              ...state,
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity - 1 } : i
              ),
            };
          }
          return state;
        }),
      removeMenuItem: (menuItemId) =>
        set((state) => {
          const existingItems = state.items.filter((i) => i.menuItemId === menuItemId);
          if (existingItems.length > 0) {
            // Remove one instance of the item (the last one added is a good heuristic, or just decrease the first one)
            // The requirement might be to remove exactly one quantity of any matching menuItemId
            // Or remove ALL of them. Let's make it remove all of them completely if called from UI.
            // Wait, RestaurantDetails needs a way to decrease quantity by 1 for a menuItemId.
            // In RestaurantDetails, removeOneMenuItem decreases quantity by 1 of the first matching item. 
            // We can handle that in RestaurantDetails by calling removeOneItem(firstMatchingItem.id)
            return {
              ...state,
              items: state.items.filter((i) => i.menuItemId !== menuItemId),
            };
          }
          return state;
        }),
      clearCart: () => {
        set({ items: [], restaurant: null });
        // Explicitly clear localStorage
        window?.localStorage.removeItem("food-cart");
      },
    }),
    {
      name: "food-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addresses: [],
      // Fetch addresses initially or after any update
      fetchAddresses: async () => {
        const { user } = useAuthStore.getState(); // Get user from the auth store
        if (!user || !user.id) {
          console.error("User not found or missing ID");
          return;
        }

        try {
          const response = await fetch(`/api/users/${user.id}/addresses`);
          if (!response.ok) throw new Error("Failed to fetch addresses");
          const data = await response.json();

          set({ addresses: data });
        } catch (error) {
          console.error("Error fetching addresses:", error);
        }
      },

      removeAddress: async (addressId) => {
        try {
          const user = useAuthStore.getState().user;
          if (!user) throw new Error("No user found");
          const response = await fetch(
            `/api/users/${user.id}/addresses/${addressId}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addressId }),
            }
          );

          if (!response.ok) throw new Error("Failed to delete address");

          // Update store state
          set((state) => ({
            addresses: state.addresses.filter((addr) => addr.id !== addressId),
          }));
        } catch (error) {
          console.error("Error deleting address:", error);
        }
      },

      // Create a new address by calling the API
      createAddress: async (newAddress) => {
        const { user } = useAuthStore.getState(); // Get user from the auth store
        if (!user || !user.id) {
          console.error("User not found or missing ID");
          return;
        }

        try {
          // Ensure phoneNumber is sent (required by API) even if hidden in form
          const addressToCreate = {
            ...newAddress,
            phoneNumber: newAddress.phoneNumber || '',
            isDefault: newAddress.isDefault || false
          };

          const response = await fetch(`/api/users/${user.id}/addresses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(addressToCreate),
          });

          if (!response.ok) throw new Error("Failed to create address");

          const createdAddress = await response.json();

          // Add the new address to the state
          set((state) => ({
            addresses: [createdAddress, ...state.addresses], // Add new address to the beginning of the list
          }));
        } catch (error) {
          console.error("Error creating address:", error);
        }
      },

      // Add a new address
      addAddress: (address) =>
        set((state) => ({
          addresses: [...state.addresses, address],
        })),
      // Update an existing address by calling the API
      updateAddress: async (updatedAddress) => {
        const { user } = useAuthStore.getState();
        if (!user || !user.id) {
          console.error("User not found or missing ID");
          return;
        }

        try {
          const response = await fetch(
            `/api/users/${user.id}/addresses/${updatedAddress.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedAddress),
            }
          );

          if (!response.ok) throw new Error("Failed to update address");

          const updatedAddressData = await response.json();

          // Update the address in the state
          set((state) => ({
            addresses: state.addresses.map((address) =>
              address.id === updatedAddressData.id
                ? updatedAddressData
                : address
            ),
          }));
        } catch (error) {
          console.error("Error updating address:", error);
          throw error; // Re-throw so the UI can handle it
        }
      },
    }),
    {
      name: "address-storage",
      storage: createJSONStorage(() => localStorage), // Store in localStorage for persistence
    }
  )
);

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      isLoading: false, // <-- Loading state

      // Fetch user orders from API
      fetchOrders: async () => {
        const { user } = useAuthStore.getState();
        if (!user || !user.id) {
          console.error("User not found");
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch(`/api/orders?userId=${user.id}`);
          if (!response.ok) throw new Error("Failed to fetch orders");

          const data = await response.json();
          set({ orders: [...data], isLoading: false }); // Ensure state update
        } catch (error) {
          set({ isLoading: false });
          console.error("Error fetching orders:", error);
        }
      },

      // Update a single order in the store without refetching all orders
      updateOrder: (orderId: string, updatedOrder: Order) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? updatedOrder : order
          ),
        }));
      },

      // Add a new order to the beginning of the list without refetching all orders
      addOrder: (newOrder: Order) => {
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
      },
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage), // Persist orders
    }
  )
);

// Create the store
export const useLocationStore = create<LocationState>((set) => ({
  citiesAndAreas: null,
  setCitiesAndAreas: (data) => set({ citiesAndAreas: data }),
}));
