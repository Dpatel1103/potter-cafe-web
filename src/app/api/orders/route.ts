import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";
import { CreateOrderPayload } from "@/types/cafe";

/**
 * In-memory idempotency cache (keyed by idempotencyKey)
 * Guards against concurrent rapid network retries before DB commit.
 */
interface CachedOrderResponse {
  orderId: number | string;
  totalAmount: number;
  data: any;
  timestamp: number;
}
const idempotencyCache = new Map<string, CachedOrderResponse>();

// Evict cached idempotency entries older than 30 minutes
const CACHE_TTL_MS = 30 * 60 * 1000;
function cleanIdempotencyCache() {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}

/**
 * GET /api/orders
 * Returns all orders ordered by created_at descending for the staff dashboard queue.
 */
export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/orders] Database query error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve orders from database." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: orders || [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/orders] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Places a customer order with complete server-side price computation,
 * inventory stock validation, and idempotency protection.
 */
export async function POST(request: NextRequest) {
  try {
    cleanIdempotencyCache();

    let rawBody: any;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const {
      customerName,
      phone,
      deliveryAddress,
      paymentMethod,
      items,
      idempotencyKey,
    } = rawBody as CreateOrderPayload;

    const key =
      idempotencyKey ||
      request.headers.get("x-idempotency-key") ||
      request.headers.get("idempotency-key");

    // ── 1. Idempotency Check (Prevent duplicate submissions on network retries) ──
    if (key) {
      const cached = idempotencyCache.get(key);
      if (cached) {
        return NextResponse.json(
          {
            success: true,
            orderId: cached.orderId,
            totalAmount: cached.totalAmount,
            data: cached.data,
            message: "Order already placed (idempotent response).",
          },
          { status: 200 }
        );
      }

      // Check database for existing order with this idempotency key
      const supabase = getServerSupabase();
      try {
        const { data: existingDbOrder } = await supabase
          .from("orders")
          .select("*")
          .eq("idempotency_key", key)
          .maybeSingle();

        if (existingDbOrder) {
          idempotencyCache.set(key, {
            orderId: existingDbOrder.id,
            totalAmount: Number(existingDbOrder.total_amount),
            data: existingDbOrder,
            timestamp: Date.now(),
          });

          return NextResponse.json(
            {
              success: true,
              orderId: existingDbOrder.id,
              totalAmount: Number(existingDbOrder.total_amount),
              data: existingDbOrder,
              message: "Order already recorded (idempotent DB hit).",
            },
            { status: 200 }
          );
        }
      } catch {
        // Table might not have idempotency_key column yet; proceed safely
      }
    }

    // ── 2. Payload Field Validations ──
    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Normalize phone number (strip spaces, symbols, international +91 prefix)
    const rawDigits = phone.replace(/\D/g, "");
    const tenDigitPhone =
      rawDigits.length === 12 && rawDigits.startsWith("91")
        ? rawDigits.slice(2)
        : rawDigits;

    if (!/^\d{10}$/.test(tenDigitPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number must be a valid 10-digit number.",
        },
        { status: 400 }
      );
    }

    if (!deliveryAddress || typeof deliveryAddress !== "string" || !deliveryAddress.trim()) {
      return NextResponse.json(
        { success: false, error: "Delivery address is required." },
        { status: 400 }
      );
    }

    if (paymentMethod !== "UPI" && paymentMethod !== "COD") {
      return NextResponse.json(
        { success: false, error: "Payment method must be either 'UPI' or 'COD'." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one menu item." },
        { status: 400 }
      );
    }

    // Validate item structure and quantity
    for (const it of items) {
      const q = Number(it?.quantity);
      if (isNaN(q) || q < 1 || !Number.isInteger(q)) {
        return NextResponse.json(
          { success: false, error: "Quantity for every item must be an integer of at least 1." },
          { status: 400 }
        );
      }
      const mId = Number(it?.menuItemId);
      if (isNaN(mId) || mId <= 0) {
        return NextResponse.json(
          { success: false, error: "Each order item must specify a valid numeric menuItemId." },
          { status: 400 }
        );
      }
    }

    // ── 3. Extract Unique Item IDs & Fetch Authoritative Menu Records ──
    const uniqueItemIds = Array.from(new Set(items.map((i) => Number(i.menuItemId))));

    const supabase = getServerSupabase();
    const { data: dbItems, error: menuError } = await supabase
      .from("menu_items")
      .select("*")
      .in("id", uniqueItemIds);

    if (menuError) {
      console.error("[POST /api/orders] Supabase menu query error:", menuError.message);
      return NextResponse.json(
        { success: false, error: "Failed to verify menu items from database." },
        { status: 500 }
      );
    }

    // ── 4. Verify Existence and In-Stock Status ──
    const foundItemMap = new Map<number, any>();
    (dbItems || []).forEach((row) => {
      const parsedId = typeof row.id === "number" ? row.id : Number(row.id);
      foundItemMap.set(parsedId, row);
    });

    const missingIds = uniqueItemIds.filter((id) => !foundItemMap.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `The following requested menu item IDs do not exist: ${missingIds.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // Verify all requested items are in-stock
    for (const [id, dbItem] of foundItemMap.entries()) {
      const inStock =
        typeof dbItem.in_stock === "boolean"
          ? dbItem.in_stock
          : typeof dbItem.is_available === "boolean"
          ? dbItem.is_available
          : true;

      if (!inStock) {
        return NextResponse.json(
          {
            success: false,
            error: `Menu item "${dbItem.name}" is currently sold out and cannot be ordered.`,
          },
          { status: 400 }
        );
      }
    }

    // ── 5. Secure Server-Side Calculation (Never trust client-submitted prices) ──
    let subtotal = 0;
    const orderItemSnapshots: Array<{
      menuItemId: number;
      item_name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }> = [];

    const summarySegments: string[] = [];

    for (const it of items) {
      const idNum = Number(it.menuItemId);
      const dbItem = foundItemMap.get(idNum)!;
      const quantity = Number(it.quantity);
      const unitPrice = Number(dbItem.price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

      subtotal += lineTotal;
      summarySegments.push(`${dbItem.name} (x${quantity})`);
      orderItemSnapshots.push({
        menuItemId: idNum,
        item_name: dbItem.name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const delivery_fee = subtotal >= 500 ? 0 : 40;
    const total_amount = Math.round((subtotal + delivery_fee) * 100) / 100;
    const items_summary = summarySegments.join(", ");

    // ── 6. Insert Order into 'orders' Table ──
    const payment_status = paymentMethod === "UPI" ? "Completed" : "Pending";
    const order_status = "Placed";

    const orderPayload: Record<string, any> = {
      customer_name: customerName.trim(),
      phone: tenDigitPhone,
      delivery_address: deliveryAddress.trim(),
      items_summary,
      subtotal,
      delivery_fee,
      total_amount,
      payment_method: paymentMethod,
      payment_status,
      order_status,
      assigned_rider: null,
      // Supporting backwards-compatibility schema columns if present:
      customer_phone: tenDigitPhone,
      status: order_status,
      items: orderItemSnapshots,
    };

    if (key) {
      orderPayload.idempotency_key = key;
    }

    let { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    // Graceful column fallback if specific optional columns don't exist in existing DB
    if (orderError) {
      console.warn("[POST /api/orders] First insert attempt warning:", orderError.message);

      // Remove potential non-existent columns one by one
      if (orderError.message.includes("idempotency_key")) {
        delete orderPayload.idempotency_key;
      }
      if (orderError.message.includes("customer_phone")) {
        delete orderPayload.customer_phone;
      }
      if (orderError.message.includes("status")) {
        delete orderPayload.status;
      }
      if (orderError.message.includes("items")) {
        delete orderPayload.items;
      }

      const retry = await supabase
        .from("orders")
        .insert([orderPayload])
        .select()
        .single();

      createdOrder = retry.data;
      orderError = retry.error;
    }

    if (orderError || !createdOrder) {
      console.error("[POST /api/orders] Order creation failed:", orderError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to persist order: " + (orderError?.message || "Unknown error") },
        { status: 500 }
      );
    }

    // ── 7. Insert Corresponding Child Rows into 'order_items' ──
    const childRows = orderItemSnapshots.map((snap) => ({
      order_id: createdOrder.id,
      item_name: snap.item_name,
      quantity: snap.quantity,
      unit_price: snap.unit_price,
      line_total: snap.line_total,
    }));

    try {
      const { error: childError } = await supabase
        .from("order_items")
        .insert(childRows);

      if (childError) {
        console.warn("[POST /api/orders] order_items insert notice:", childError.message);
      }
    } catch (e: any) {
      console.warn("[POST /api/orders] order_items table might not be created yet:", e?.message);
    }

    // ── 8. Cache Idempotent Result ──
    if (key) {
      idempotencyCache.set(key, {
        orderId: createdOrder.id,
        totalAmount: total_amount,
        data: createdOrder,
        timestamp: Date.now(),
      });
    }

    // ── 9. Return HTTP 201 Success Response ──
    return NextResponse.json(
      {
        success: true,
        orderId: createdOrder.id,
        totalAmount: total_amount,
        data: createdOrder,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/orders] Unhandled exception:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

