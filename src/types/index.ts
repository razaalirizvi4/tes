/* eslint-disable  @typescript-eslint/no-explicit-any */
export type UserRole = 'CUSTOMER' | 'DRIVER' | 'VENDOR' | 'ADMIN';
export type DriverStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';
export type VehicleType = 'CAR' | 'BIKE' | 'BICYCLE';

export interface User {
  id: string;
  email: string;
  name?: string;
  address?: UserAddress[];
  role: UserRole;
  driver?: Driver;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Driver {
  id: string;
  userId: string;
  user: User;
  status: DriverStatus;
  currentLat?: number;
  currentLng?: number;
  lastLocation?: Date;
  rating?: number;
  totalOrders: number;
  vehicleType: VehicleType;
  documents?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverStats {
  id: string;
  driverId: string;
  totalDeliveries: number;
  totalEarnings: number;
  averageRating?: number;
  completionRate: number;
  lastPayout?: Date;
}

export interface DriverLocation {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}
export interface UserAddress {
  id: string | undefined;  // Allow 'undefined' for new addresses
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SpicyLevel = 'MILD' | 'MEDIUM' | 'HOT';

export type SelectionType = 'SINGLE' | 'MULTIPLE';

export interface AddonOption {
  id: string;
  addonGroupId: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  image?: string | null;
  linkedMenuItemId?: string | null;
}

export interface AddonGroup {
  id: string;
  restaurantId: string;
  name: string;
  displayName?: string | null;
  selectionType: SelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number | null;
  sortOrder: number;
  isActive: boolean;
  options: AddonOption[];
}

export interface MenuItemAddon {
  id: string;
  menuItemId: string;
  addonGroupId: string;
  addonGroup: AddonGroup;
  sortOrder: number;
}
export interface SelectedAddon {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

export type StoreType = 'RESTAURANT' | 'GROCERY' | 'FLOWER_SHOP' | 'PHARMACY' | 'BAKERY' | 'GENERAL';
export type PricingType = 'FIXED' | 'PER_UNIT' | 'WEIGHTED';

export interface MenuItem {
  id: string;
  label: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  spicy?: SpicyLevel | null; 
  restaurantId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  addonGroups?: MenuItemAddon[];
  // Retail fields
  barcode?: string | null;
  brand?: string | null;
  sku?: string | null;
  unit?: string | null;
  unitQuantity?: number | null;
  weight?: number | null;
  stockQuantity?: number | null;
  trackStock?: boolean;
  lowStockThreshold?: number | null;
  pricingType?: PricingType;
}

export interface Restaurant {
  id: string;
  name: string;
  chainName: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisineType: string;
  segment: string;
  rating: number | null;
  coverImage: string | null;
  coverImagesList?: string[] | null;
  city: string;
  area: string;
  menuItems?: MenuItem[];
  deliveryTime: string | null;
  minimumOrder: string | null;
  deliveryCharges?: number | null;
  spottedDate: Date | string | null;
  closedDate: Date | string | null;
  country?: string | null; 
  currency?: string | null;
  // Multi-vertical fields
  storeType: StoreType;
  logo?: string | null;
  description?: string | null;
  operatingHours?: any;
  preparationTime?: number | null;
  acceptsScheduledOrders?: boolean;
  deliverySlotDuration?: number | null;
  tags?: string[];
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: number;
  specialInstructions: string,
  paymentMethod: string;
  deliveryAddress: string;
  phoneNumber?: string | null;
  orderType?: string | null;
  orderItems: OrderItem[];
  driverId?: string;
  driver?: Driver;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  estimatedTime?: number;
  actualTime?: number;
  driverRating?: number;
  createdAt: Date;
  updatedAt: Date;
  recipientName: string | null;
  recipientPhone: string | null;
  isGift: boolean;
  giftMessage: string | null;
  orderVertical: string | null;
  scheduledDate?: string | Date | null;
  scheduledSlot?: string | null;
  substitutionPref?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItem?: MenuItem; // Add the full MenuItem object here
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
  options?: Record<string, any>;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
  options?: Record<string, string | number | boolean>;
}
