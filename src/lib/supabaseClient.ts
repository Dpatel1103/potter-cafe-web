import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DbMenuItem, DbOrder, OrderStatus } from "@/types";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Validates whether the Supabase environment variables are properly defined
 * and do not contain placeholder or dummy strings.
 */
export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    rawSupabaseUrl.startsWith("https://") &&
    !rawSupabaseUrl.includes("your-project-ref") &&
    !rawSupabaseAnonKey.includes("your-anon-key-placeholder")
);

// Fallback dummy credentials to satisfy createClient initialization during local/build phase
const fallbackUrl = "https://placeholder-espresso-patronum.supabase.co";
const fallbackAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

const activeUrl = isSupabaseConfigured ? (rawSupabaseUrl as string) : fallbackUrl;
const activeAnonKey = isSupabaseConfigured ? (rawSupabaseAnonKey as string) : fallbackAnonKey;

/**
 * Standard browser / client-safe Supabase client.
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Safe for client-side components and public operations governed by Row Level Security (RLS).
 */
export const supabase: SupabaseClient = createClient(activeUrl, activeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Privileged Admin / Service-Role Supabase client.
 * Initialized only when SUPABASE_SERVICE_ROLE_KEY is present in server environment.
 * Strictly used inside server Route Handlers for elevated operations bypassing RLS.
 */
export const supabaseAdmin: SupabaseClient | null =
  rawServiceRoleKey && isSupabaseConfigured
    ? createClient(activeUrl, rawServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Helper to obtain the authoritative Supabase client for Server Route Handlers:
 * Uses privileged supabaseAdmin if service role key is present; otherwise falls back to standard client.
 */
export function getServerSupabase(): SupabaseClient {
  return supabaseAdmin || supabase;
}

// ── Database Helper Utilities (Maintained for UI & Context backwards compatibility) ──

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
    return data as unknown as DbMenuItem[];
  } catch (err) {
    console.warn("Supabase fetchDbMenuItems exception:", err);
    return null;
  }
}

/**
 * Update stock availability for a specific menu item in Supabase
 */
export async function updateDbItemStock(
  itemId: string | number,
  isAvailable: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const client = getServerSupabase();
    const { error } = await client
      .from("menu_items")
      .update({
        is_available: isAvailable,
        in_stock: isAvailable,
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
    const client = getServerSupabase();
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetchDbOrders warning:", error.message);
      return null;
    }
    return data as unknown as DbOrder[];
  } catch (err) {
    console.warn("Supabase fetchDbOrders exception:", err);
    return null;
  }
}

/**
 * Insert a newly placed order into the Supabase database
 */
export async function insertDbOrder(order: Record<string, any>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const client = getServerSupabase();
    const { error } = await client.from("orders").insert(order);

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
  orderId: string | number,
  status: OrderStatus,
  courierName?: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const client = getServerSupabase();
    const updatePayload: Record<string, unknown> = {
      status,
      order_status: status,
      updated_at: new Date().toISOString(),
    };

    if (courierName !== undefined) {
      updatePayload.courier_name = courierName;
      updatePayload.assigned_rider = courierName;
    }

    const { error } = await client
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
