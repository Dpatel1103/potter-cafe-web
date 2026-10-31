import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";

/**
 * Normalizes a menu item row to guarantee exact database-aligned MenuItem structure
 */
function normalizeMenuItem(row: any) {
  const inStockValue =
    typeof row.in_stock === "boolean"
      ? row.in_stock
      : typeof row.is_available === "boolean"
      ? row.is_available
      : true;

  return {
    id: typeof row.id === "number" ? row.id : Number(row.id) || row.id,
    created_at: row.created_at,
    name: row.name,
    category: row.category,
    description: row.description ?? null,
    price: Number(row.price),
    in_stock: inStockValue,
    image_url: row.image_url ?? null,
  };
}

/**
 * GET /api/menu
 * Fetches all menu items ordered by category and name.
 */
export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/menu] Database error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch menu items from database." },
        { status: 500 }
      );
    }

    const items = (data || []).map(normalizeMenuItem);

    return NextResponse.json(
      {
        success: true,
        data: items,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/menu] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu
 * Adds a new menu item with full server-side validation.
 */
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { name, category, price, description, in_stock, image_url } = body;

    // 1. Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Item 'name' is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // 2. Validate category
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { success: false, error: "Item 'category' is required." },
        { status: 400 }
      );
    }

    // 3. Validate price (must be a valid non-negative number)
    const numericPrice = Number(price);
    if (price === undefined || price === null || isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Item 'price' must be a valid non-negative number in INR (₹)." },
        { status: 400 }
      );
    }

    const inStockBool = in_stock !== undefined ? Boolean(in_stock) : true;
    const desc =
      description !== undefined && description !== null
        ? String(description).trim()
        : null;

    const supabase = getServerSupabase();

    // Prepare primary insert payload
    const insertPayload: Record<string, any> = {
      name: name.trim(),
      category: category.trim(),
      price: numericPrice,
      description: desc,
      in_stock: inStockBool,
      image_url: image_url ? String(image_url).trim() : null,
    };

    let { data, error } = await supabase
      .from("menu_items")
      .insert([insertPayload])
      .select()
      .single();

    // Fallback if schema has legacy 'is_available' instead of 'in_stock'
    if (error && error.message.includes("in_stock")) {
      delete insertPayload.in_stock;
      insertPayload.is_available = inStockBool;
      const retry = await supabase
        .from("menu_items")
        .insert([insertPayload])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[POST /api/menu] Insert error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to create menu item: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: normalizeMenuItem(data),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/menu] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/menu
 * Updates an existing menu item (e.g. stock toggle, price change, details).
 */
export async function PATCH(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { id, in_stock, price, name, description, category, image_url } = body;

    if (id === undefined || id === null) {
      return NextResponse.json(
        { success: false, error: "Target menu item 'id' is required for update." },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    if (in_stock !== undefined) {
      updates.in_stock = Boolean(in_stock);
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Field 'price' must be a non-negative number." },
          { status: 400 }
        );
      }
      updates.price = numPrice;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Field 'name' must be a non-empty string." },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description =
        description !== null ? String(description).trim() : null;
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return NextResponse.json(
          { success: false, error: "Field 'category' must be a non-empty string." },
          { status: 400 }
        );
      }
      updates.category = category.trim();
    }

    if (image_url !== undefined) {
      updates.image_url = image_url !== null ? String(image_url).trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No editable fields provided for update." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    let { data, error } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    // Fallback if in_stock column doesn't exist on legacy table
    if (error && error.message.includes("in_stock")) {
      const isAvailableVal = updates.in_stock;
      delete updates.in_stock;
      updates.is_available = isAvailableVal;
      const retry = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[PATCH /api/menu] Update error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to update menu item: " + error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: `Menu item with id ${id} was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: normalizeMenuItem(data),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[PATCH /api/menu] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu
 * Removes a menu item via query parameter (?id=...) or JSON body { id }.
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // Body is optional if query param was present
      }
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item 'id' must be specified via query param (?id=...) or request body.",
        },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/menu] Deletion error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete menu item: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Menu item #${id} deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[DELETE /api/menu] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

