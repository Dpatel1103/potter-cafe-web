import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";
import { OrderStatus } from "@/types/cafe";

const VALID_STATUSES: OrderStatus[] = [
  "Placed",
  "Accepted",
  "Brewing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

/**
 * Strict state machine for Harry Potter cafe order lifecycle
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Placed: ["Accepted", "Cancelled"],
  Accepted: ["Brewing", "Cancelled"],
  Brewing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

/**
 * GET /api/orders/[id]
 * Fetch detailed state of a single order (including child items if available).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID parameter is required." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: `Order #${id} not found.` },
        { status: 404 }
      );
    }

    // Try fetching child items from order_items table
    const { data: childItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...order,
          items: childItems || order.items || [],
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/orders/[id]] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Updates order lifecycle status and optionally assigns delivery rider.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID parameter is required." },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { order_status, status, assigned_rider, courier_name, assigned_courier } = body;
    const targetStatus = (order_status || status) as OrderStatus | undefined;
    const rider = assigned_rider || courier_name || assigned_courier;

    if (!targetStatus && rider === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must contain at least 'order_status' or 'assigned_rider'.",
        },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // ── 1. Fetch Current Order State ──
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { success: false, error: `Order #${id} was not found.` },
        { status: 404 }
      );
    }

    const currentStatus = (currentOrder.order_status || currentOrder.status) as OrderStatus;

    // ── 2. Validate Status Transition ──
    if (targetStatus) {
      if (!VALID_STATUSES.includes(targetStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status '${targetStatus}'. Allowed statuses: ${VALID_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Check transition rule if status is actually changing
      if (currentStatus !== targetStatus) {
        const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowedNext.includes(targetStatus)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${
                allowedNext.length > 0 ? allowedNext.join(", ") : "None (terminal state)"
              }.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // ── 3. Build Update Payload ──
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (targetStatus) {
      updatePayload.order_status = targetStatus;
      updatePayload.status = targetStatus;

      // Automatically complete payment on delivery
      if (targetStatus === "Delivered") {
        updatePayload.payment_status = "Completed";
      }
    }

    if (rider !== undefined) {
      const riderString = rider ? String(rider).trim() : null;
      updatePayload.assigned_rider = riderString;
      updatePayload.courier_name = riderString;
    }

    // ── 4. Apply Update to Database ──
    let { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    // Fallback if schema doesn't have order_status or assigned_rider columns
    if (updateError) {
      console.warn("[PATCH /api/orders/[id]] First update attempt warning:", updateError.message);

      if (updateError.message.includes("order_status")) {
        delete updatePayload.order_status;
      }
      if (updateError.message.includes("assigned_rider")) {
        delete updatePayload.assigned_rider;
      }
      if (updateError.message.includes("status")) {
        delete updatePayload.status;
      }
      if (updateError.message.includes("courier_name")) {
        delete updatePayload.courier_name;
      }

      const retry = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      updatedOrder = retry.data;
      updateError = retry.error;
    }

    if (updateError) {
      console.error("[PATCH /api/orders/[id]] Update failed:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Failed to update order: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedOrder,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[PATCH /api/orders/[id]] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

