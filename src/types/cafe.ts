// ==============================================================================
// ESPRESSO PATRONUM — TYPESCRIPT DATA MODELS
// ==============================================================================

export type MenuCategory =
  | "Signature Potions"
  | "Artisan Brews"
  | "Magical Bakes"
  | string;

export type OrderStatus =
  | "Placed"
  | "Accepted"
  | "Brewing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "UPI" | "COD";
export type PaymentStatus = "Pending" | "Completed";

/**
 * Authoritative Menu Item database model
 */
export interface MenuItem {
  id: number;
  created_at?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  in_stock: boolean;
  image_url: string | null;

  // Frontend compatibility aliases
  inStock: boolean;
  lore?: string;
  badge?: string;
  iconType?: "potion" | "coffee" | "cake" | "sparkles" | "flame" | "leaf";
  brewTimeMinutes?: number;
}

/**
 * Order Item Input from client payload
 */
export interface OrderItemInput {
  menuItemId: number;
  quantity: number;
}

/**
 * Create Order Request Payload (supports idempotencyKey)
 */
export interface CreateOrderPayload {
  idempotencyKey?: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  paymentMethod: "UPI" | "COD";
  items: OrderItemInput[];
}

/**
 * Authoritative Order database model
 */
export interface Order {
  id: number;
  created_at: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  items_summary: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: "UPI" | "COD";
  payment_status: "Pending" | "Completed";
  order_status:
    | "Placed"
    | "Accepted"
    | "Brewing"
    | "Out for Delivery"
    | "Delivered"
    | "Cancelled";
  assigned_rider: string | null;

  // Frontend UI compatibility aliases
  createdAt: string;
  paymentMethod: "UPI" | "COD";
  paymentStatus: "Pending" | "Completed";
  orderStatus?: OrderStatus;
  status: OrderStatus;
  total: number;
  customer: CustomerDetails;
  items: OrderItem[];
  assignedCourier?: string;
  courierName?: string;
  statusMessage?: string;
}

/**
 * Historical snapshot row for individual ordered items
 */
export interface OrderItem {
  id?: number;
  order_id?: number;
  menuItemId: number | string;
  item_name?: string;
  name: string;
  quantity: number;
  unit_price?: number;
  unitPrice: number;
  line_total?: number;
  lineTotal: number;
  created_at?: string;
}

/**
 * Client-side customer delivery details form
 */
export interface CustomerDetails {
  fullName: string;
  phone: string;
  address: string;
  deliveryNotes?: string;
}

/**
 * Courier partner profile definition
 */
export interface Courier {
  id: string;
  name: string;
  title: string;
  speed: string;
  avatarIcon: "owl" | "feather" | "broom" | "flame";
  description: string;
}

/**
 * Shopping cauldron cart entry
 */
export interface CartItem {
  item: MenuItem;
  quantity: number;
}
