import { createClient } from "@supabase/supabase-js";
import { DbMenuItem, DbOrder, OrderStatus } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Validates whether the Supabase environment variables are properly defined
 * and do not contain placeholder or dummy strings.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project-ref") &&
    !supabaseAnonKey.includes("your-anon-key-placeholder")
);

// Fallback dummy credentials to satisfy createClient initialization during local/build phase
const fallbackUrl = "https://placeholder-espresso-patronum.supabase.co";
const fallbackAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

/**
 * Initialized browser Supabase client with Realtime replication enabled.
 */
export const supabase = createClient(
  isSupabaseConfigured ? (supabaseUrl as string) : fallbackUrl,
  isSupabaseConfigured ? (supabaseAnonKey as string) : fallbackAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// ── Database Helper Utilities ────────────────────────────────────────────────

/**
 * Fetch all menu items from Supabase with graceful fallback
 */
export async function fetchDbMenuItems(): Promise<DbMenuItem[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Supabase fetchDbMenuItems warning:", error.message);
      return null;
    }
    return (data as unknown) as DbMenuItem[];
  } catch (err) {
    console.warn("Supabase fetchDbMenuItems exception:", err);
    return null;
  }
}

/**
 * Update stock availability for a specific menu item in Supabase
 */
export async function updateDbItemStock(
  itemId: string,
  isAvailable: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from("menu_items")
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (error) {
      console.warn("Supabase updateDbItemStock error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase updateDbItemStock exception:", err);
    return false;
  }
}

/**
 * Fetch all orders from Supabase with graceful fallback
 */
export async function fetchDbOrders(): Promise<DbOrder[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchDbOrders warning:", error.message);
      return null;
    }
    return (data as unknown) as DbOrder[];
  } catch (err) {
    console.warn("Supabase fetchDbOrders exception:", err);
    return null;
  }
}

/**
 * Insert a newly placed order into the Supabase database
 */
export async function insertDbOrder(order: DbOrder): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from("orders").insert(order);

    if (error) {
      console.warn("Supabase insertDbOrder error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase insertDbOrder exception:", err);
    return false;
  }
}

/**
 * Update an order's lifecycle status and assigned courier in Supabase
 */
export async function updateDbOrderStatus(
  orderId: string,
  status: OrderStatus,
  courierName?: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (courierName !== undefined) {
      updatePayload.courier_name = courierName;
    }

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      console.warn("Supabase updateDbOrderStatus error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase updateDbOrderStatus exception:", err);
    return false;
  }
}
