export type MenuCategory = "Signature Potions" | "Artisan Brews" | "Magical Bakes";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  lore: string;
  inStock: boolean;
  accentColor: string;
  badge?: string;
  brewTimeMinutes?: number;
  dietary?: string[];
  iconType: "potion" | "coffee" | "cake" | "sparkles" | "flame" | "leaf";
  imageUrl?: string | null;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type PaymentMethod = "UPI" | "COD";

export interface DeliveryInfo {
  fullName: string;
  phoneNumber: string;
  dormitoryAddress: string;
  deliveryNotes?: string;
}

export type OrderStatus =
  | "Placed"
  | "Accepted"
  | "Brewing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface Courier {
  id: string;
  name: string;
  title: string;
  speed: string;
  avatarIcon: "owl" | "feather" | "broom" | "flame";
  description: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: DeliveryInfo;
  items: CartItem[];
  subtotal: number;
  ministryTax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  courierName?: string;
  statusMessage?: string;
  history: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
}

// ── Supabase Database Row & Schema Interfaces ──────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface DbMenuItem {
  id: string;
  name: string;
  category: MenuCategory;
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

export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: DbMenuItem;
        Insert: {
          id?: string;
          name: string;
          category: MenuCategory;
          price: number;
          description?: string;
          image_url?: string | null;
          is_available?: boolean;
          lore?: string | null;
          badge?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: MenuCategory;
          price?: number;
          description?: string;
          image_url?: string | null;
          is_available?: boolean;
          lore?: string | null;
          badge?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: DbOrder;
        Insert: {
          id: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          items?: Json;
          subtotal?: number;
          delivery_fee?: number;
          total_amount?: number;
          payment_method: PaymentMethod;
          status?: OrderStatus;
          courier_name?: string | null;
          delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          customer_phone?: string;
          delivery_address?: string;
          items?: Json;
          subtotal?: number;
          delivery_fee?: number;
          total_amount?: number;
          payment_method?: PaymentMethod;
          status?: OrderStatus;
          courier_name?: string | null;
          delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
