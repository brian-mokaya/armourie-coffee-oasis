
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  registeredOn: string;
  orders: string[]; // Order IDs
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  stock: 'In Stock' | 'Low Stock' | 'Out of Stock';
  isPopular?: boolean;
  isNew?: boolean;
  offerTag?: string;
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  total: number;
  status: 'Pending' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Pending';
  paymentMethod: string;
  location: string;
  loyaltyPoints: number;
  trackingSteps: {
    title: string;
    description: string;
    time: string;
    completed: boolean;
  }[];
}

export interface Coupon {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  minPurchase?: number;
  validFrom: string;
  validTo: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}
