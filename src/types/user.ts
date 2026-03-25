export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  restaurants: Restaurant[];
  documents?: {
    businessLicense?: string;
    taxId?: string;
    [key: string]: string | undefined;
  };
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  city: string;
  area: string;
  rating?: number;
  coverImage?: string;
  coverImagesList?: string[] | null;
  deliveryTime?: string;
  minimumOrder?: string;
  deliveryCharges?: number | null;
  spottedDate?: Date;
  closedDate?: Date;
  menuItems: MenuItem[];
  orders: Order[];
  vendorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export type SpicyLevel = 'MILD' | 'MEDIUM' | 'HOT';

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  spicy?: SpicyLevel | null; // Optional spicy level: MILD, MEDIUM, or HOT
  restaurantId: string;
  orderItems: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  userId: string;
  status: string;
  currentLat?: number;
  currentLng?: number;
  lastLocation?: Date;
  activeOrder?: Order;
  activeOrderId?: string;
  orders: Order[];
  locations: DriverLocation[];
  stats?: DriverStats;
  rating?: number;
  totalOrders: number;
  vehicleType: string;
  documents?: {
    license?: string;
    insurance?: string;
    vehicleRegistration?: string;
    [key: string]: string | undefined;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverLocation {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface DriverStats {
  id: string;
  driverId: string;
  totalDeliveries: number;
  totalEarnings: number;
  averageRating?: number;
  completionRate: number;
  lastPayout?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: number;
  specialInstructions:"",
  paymentMethod:string
  deliveryAddress: string;
  orderItems: OrderItem[];
  driverId?: string;
  assignedDriver?: Driver;
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
}




export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  options?: {
    [key: string]: string | number | boolean | null;
  };
  price: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  gender?: string;
  role: UserRole;
  approvalStatus?: ApprovalStatus;
  addresses: Address[];
  orders: Order[];
  driver?: Driver;
  vendorProfile?: VendorProfile;
  avatarUrl?:string;
  createdAt: Date;
  updatedAt: Date;
}