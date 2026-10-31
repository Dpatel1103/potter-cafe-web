export * from "./cafe";

// Supabase and Legacy Aliases for backwards compatibility
import { CustomerDetails, MenuItem, Order, OrderItem, OrderStatus, PaymentMethod, CartItem } from "./cafe";

export type DeliveryInfo = CustomerDetails;

export interface DbMenuItem {
  id: string;
  name: string;
  category: MenuItem["category"];
  price: number;
  description: string;
  image_url: string | null;
  is_available: boolean;
  lore: string | null;
  badge: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItemPayload {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface DbOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: DbOrderItemPayload[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  courier_name: string | null;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
}
