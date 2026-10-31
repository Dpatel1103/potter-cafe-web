export type MenuCategory = "Signature Potions" | "Artisan Brews" | "Magical Bakes";

export type OrderStatus =
  | "Placed"
  | "Accepted"
  | "Brewing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "UPI" | "COD";
export type PaymentStatus = "Pending" | "Completed";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number; // in INR ₹
  inStock: boolean;
  imageUrl?: string;
  brewTimeMinutes?: number;
  lore?: string;
  badge?: string;
  iconType?: "potion" | "coffee" | "cake" | "sparkles" | "flame" | "leaf";
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  address: string;
  deliveryNotes?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string; // e.g. "ORD-1042"
  customer: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  assignedCourier?: string;
  courierName?: string;
  createdAt: string;
  statusMessage?: string;
}

export interface Courier {
  id: string;
  name: string;
  title: string;
  speed: string;
  avatarIcon: "owl" | "feather" | "broom" | "flame";
  description: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}
