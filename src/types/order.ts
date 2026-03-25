export interface OrderWithDetails {
  id: string;
  restaurant: {
    name: string;
  };
  totalAmount: number;
  specialInstructions:string;
  paymentMethod:string;
  createdAt: Date;
  orderItems: Array<{
    id: string;
    menuItem: {
      label: string;
    };
    quantity: number;
    price: number;
  }>;
}