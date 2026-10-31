"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  MenuItem,
  CartItem,
  Order,
  CustomerDetails,
  PaymentMethod,
  OrderStatus,
  OrderItem,
} from "@/types/cafe";
import { INITIAL_MENU_ITEMS } from "@/data/menu";
import { soundEffects } from "@/components/SoundEffects";

interface CafeContextType {
  // Menu items and CRUD actions
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, "id">) => MenuItem;
  updateMenuItem: (id: string | number, updatedFields: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string | number) => void;
  toggleStockStatus: (id: string | number) => void;
  restockAllItems: () => void;

  // Cart state & actions
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  deliveryFee: number;
  finalTotal: number;
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string | number, quantity: number) => void;
  removeFromCart: (itemId: string | number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Order lifecycle & tracking
  orders: Order[];
  activeOrder: Order | null;
  activeOrderId: string | number | null;
  setActiveOrderId: (id: string | number | null) => void;
  isTrackerOpen: boolean;
  setIsTrackerOpen: (open: boolean) => void;
  placeOrder: (orderData: {
    customer: CustomerDetails;
    paymentMethod: PaymentMethod;
  }) => number;
  updateOrderStatus: (
    orderId: string | number,
    status: OrderStatus,
    courier?: string
  ) => void;

  // Convenience aliases for staff actions
  acceptOrder: (orderId: string | number) => void;
  startBrewingOrder: (orderId: string | number) => void;
  assignCourier: (orderId: string | number, courierName: string) => void;
  markOrderDelivered: (orderId: string | number) => void;

  // System & demo utilities
  soundEnabled: boolean;
  toggleSound: () => void;
  simulateIncomingOrder: () => void;
  resetAllData: () => void;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

const STORAGE_KEY_MENU = "espresso_patronum_menu_v2";
const STORAGE_KEY_ORDERS = "espresso_patronum_orders_v2";
const STORAGE_KEY_ACTIVE_ORDER = "espresso_patronum_active_order_v2";
const STORAGE_KEY_CART = "espresso_patronum_cart_v2";
const STORAGE_KEY_SOUND = "espresso_patronum_sound_v2";

const DEFAULT_SAMPLE_ORDERS: Order[] = [
  {
    id: 1042,
    created_at: "2026-10-25T13:45:00.000Z",
    createdAt: "2026-10-25T13:45:00.000Z",
    customer_name: "Hermione Granger",
    customer: {
      fullName: "Hermione Granger",
      phone: "9820012345",
      address: "Gryffindor Tower, 7th Floor Common Room, Hogwarts",
      deliveryNotes: "Leave discreetly beside the tapestry of Barnabas the Barmy.",
    },
    phone: "9820012345",
    delivery_address: "Gryffindor Tower, 7th Floor Common Room, Hogwarts",
    items_summary: "Butterscotch Cold Brew (x2), Golden Snitch Macaron (x1)",
    items: [
      {
        menuItemId: 1,
        name: "Butterscotch Cold Brew",
        quantity: 2,
        unitPrice: 280,
        unit_price: 280,
        lineTotal: 560,
        line_total: 560,
      },
      {
        menuItemId: 8,
        name: "Golden Snitch Macaron",
        quantity: 1,
        unitPrice: 180,
        unit_price: 180,
        lineTotal: 180,
        line_total: 180,
      },
    ],
    subtotal: 740,
    delivery_fee: 0,
    total_amount: 740,
    total: 740,
    payment_method: "UPI",
    paymentMethod: "UPI",
    payment_status: "Completed",
    paymentStatus: "Completed",
    order_status: "Delivered",
    status: "Delivered",
    assigned_rider: "Hedwig Express",
    assignedCourier: "Hedwig Express",
    statusMessage: "Your order has been delivered safely by Hedwig Express.",
  },
  {
    id: 1088,
    created_at: "2026-10-25T14:05:00.000Z",
    createdAt: "2026-10-25T14:05:00.000Z",
    customer_name: "Ron Weasley",
    customer: {
      fullName: "Ron Weasley",
      phone: "9845067890",
      address: "The Burrow, Ottery St Catchpole, Attic Room",
      deliveryNotes: "Mind the family ghoul when tapping on the chimney roof.",
    },
    phone: "9845067890",
    delivery_address: "The Burrow, Ottery St Catchpole, Attic Room",
    items_summary: "Cauldron Hand Pie (x2), Dark Mark Espresso (x1)",
    items: [
      {
        menuItemId: 6,
        name: "Cauldron Hand Pie",
        quantity: 2,
        unitPrice: 240,
        unit_price: 240,
        lineTotal: 480,
        line_total: 480,
      },
      {
        menuItemId: 4,
        name: "Dark Mark Espresso",
        quantity: 1,
        unitPrice: 190,
        unit_price: 190,
        lineTotal: 190,
        line_total: 190,
      },
    ],
    subtotal: 670,
    delivery_fee: 0,
    total_amount: 670,
    total: 670,
    payment_method: "COD",
    paymentMethod: "COD",
    payment_status: "Pending",
    paymentStatus: "Pending",
    order_status: "Brewing",
    status: "Brewing",
    assigned_rider: null,
    statusMessage: "Your order is simmering in the apothecary cauldrons.",
  },
  {
    id: 1104,
    created_at: "2026-10-25T14:15:00.000Z",
    createdAt: "2026-10-25T14:15:00.000Z",
    customer_name: "Luna Lovegood",
    customer: {
      fullName: "Luna Lovegood",
      phone: "9811054321",
      address: "Ravenclaw Tower, West Wing Window Seat",
      deliveryNotes: "Look for the radishes hanging beside the blue silk curtains.",
    },
    phone: "9811054321",
    delivery_address: "Ravenclaw Tower, West Wing Window Seat",
    items_summary: "Liquid Luck Latte (x1), Pumpkin Pasties (x1)",
    items: [
      {
        menuItemId: 3,
        name: "Liquid Luck Latte",
        quantity: 1,
        unitPrice: 320,
        unit_price: 320,
        lineTotal: 320,
        line_total: 320,
      },
      {
        menuItemId: 7,
        name: "Pumpkin Pasties",
        quantity: 1,
        unitPrice: 210,
        unit_price: 210,
        lineTotal: 210,
        line_total: 210,
      },
    ],
    subtotal: 530,
    delivery_fee: 0,
    total_amount: 530,
    total: 530,
    payment_method: "UPI",
    paymentMethod: "UPI",
    payment_status: "Pending",
    paymentStatus: "Pending",
    order_status: "Placed",
    status: "Placed",
    assigned_rider: null,
    statusMessage: "Your order has been received in the Great Hall queue.",
  },
];

export function CafeProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(DEFAULT_SAMPLE_ORDERS);
  const [activeOrderId, setActiveOrderIdState] = useState<string | number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // BroadcastChannel for instant cross-tab sync in the browser
  const broadcastChannel = useMemo(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      return new BroadcastChannel("espresso_patronum_cafe_sync");
    }
    return null;
  }, []);

  const persistAndBroadcast = useCallback(
    (newMenu: MenuItem[], newOrders: Order[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(newMenu));
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(newOrders));
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: "SYNC_CAFE_STATE",
            menuItems: newMenu,
            orders: newOrders,
          });
        }
      } catch (err) {
        console.error("Failed to persist state", err);
      }
    },
    [broadcastChannel]
  );

  // Hydrate from localStorage on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedMenu = localStorage.getItem(STORAGE_KEY_MENU);
      if (savedMenu) {
        setMenuItems(JSON.parse(savedMenu));
      } else {
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(INITIAL_MENU_ITEMS));
      }

      const savedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_SAMPLE_ORDERS));
      }

      const savedActiveOrder = localStorage.getItem(STORAGE_KEY_ACTIVE_ORDER);
      if (savedActiveOrder) {
        setActiveOrderIdState(savedActiveOrder);
      }

      const savedCart = localStorage.getItem(STORAGE_KEY_CART);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
      if (savedSound !== null) {
        const isEnabled = savedSound === "true";
        setSoundEnabled(isEnabled);
        soundEffects.setEnabled(isEnabled);
      }
    } catch (e) {
      console.warn("Storage hydration notice:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Multi-tab sync listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_CAFE_STATE") {
        if (event.data.menuItems) setMenuItems(event.data.menuItems);
        if (event.data.orders) setOrders(event.data.orders);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener("message", handleBroadcast);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_MENU && e.newValue) {
        try {
          setMenuItems(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
      if (e.key === STORAGE_KEY_ORDERS && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (broadcastChannel) broadcastChannel.removeEventListener("message", handleBroadcast);
      window.removeEventListener("storage", handleStorage);
    };
  }, [broadcastChannel]);

  // Persist cart
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart, isHydrated]);

  // Persist activeOrderId
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      if (activeOrderId !== null && activeOrderId !== undefined) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ORDER, String(activeOrderId));
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ORDER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeOrderId, isHydrated]);

  // Sync cart item stock status with menuItems
  useEffect(() => {
    if (!menuItems.length || !cart.length) return;
    const stockMap = new Map(menuItems.map((m) => [m.id, m.in_stock ?? m.inStock]));
    setCart((prevCart) =>
      prevCart.map((cartItem) => {
        const isStillInStock = stockMap.get(cartItem.item.id) ?? true;
        if (cartItem.item.inStock !== isStillInStock) {
          return {
            ...cartItem,
            item: {
              ...cartItem.item,
              in_stock: isStillInStock,
              inStock: isStillInStock,
            },
          };
        }
        return cartItem;
      })
    );
  }, [menuItems]);

  // Derived Active Order
  const activeOrder = useMemo(() => {
    if (activeOrderId === null || activeOrderId === undefined) return null;
    return orders.find((o) => String(o.id) === String(activeOrderId)) || null;
  }, [orders, activeOrderId]);

  // Totals calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= 500 ? 0 : 40;
  }, [cartSubtotal]);

  const finalTotal = useMemo(() => {
    return cartSubtotal + deliveryFee;
  }, [cartSubtotal, deliveryFee]);

  // ── Menu CRUD Actions ──────────────────────────────────────────────────────

  const addMenuItem = useCallback(
    (itemData: Omit<MenuItem, "id">): MenuItem => {
      const maxId = menuItems.reduce(
        (max, m) => Math.max(max, typeof m.id === "number" ? m.id : 0),
        0
      );
      const newId = maxId + 1;

      const newItem: MenuItem = {
        ...itemData,
        id: newId,
        in_stock: itemData.in_stock ?? itemData.inStock ?? true,
        inStock: itemData.inStock ?? itemData.in_stock ?? true,
        image_url: itemData.image_url ?? null,
      };

      const updatedMenu = [newItem, ...menuItems];
      setMenuItems(updatedMenu);
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
      return newItem;
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const updateMenuItem = useCallback(
    (id: string | number, updatedFields: Partial<MenuItem>) => {
      const updatedMenu = menuItems.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              ...updatedFields,
              in_stock: updatedFields.in_stock ?? updatedFields.inStock ?? item.in_stock,
              inStock: updatedFields.inStock ?? updatedFields.in_stock ?? item.inStock,
            }
          : item
      );
      setMenuItems(updatedMenu);
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const deleteMenuItem = useCallback(
    (id: string | number) => {
      const updatedMenu = menuItems.filter((item) => String(item.id) !== String(id));
      setMenuItems(updatedMenu);
      // Also remove deleted item from cart
      setCart((prev) => prev.filter((ci) => String(ci.item.id) !== String(id)));
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const toggleStockStatus = useCallback(
    (id: string | number) => {
      const updatedMenu = menuItems.map((item) => {
        if (String(item.id) === String(id)) {
          const nextVal = !(item.in_stock ?? item.inStock);
          return {
            ...item,
            in_stock: nextVal,
            inStock: nextVal,
          };
        }
        return item;
      });
      setMenuItems(updatedMenu);
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const restockAllItems = useCallback(() => {
    const updatedMenu = menuItems.map((item) => ({
      ...item,
      in_stock: true,
      inStock: true,
    }));
    setMenuItems(updatedMenu);
    persistAndBroadcast(updatedMenu, orders);
    soundEffects.playStaffChime();
  }, [menuItems, orders, persistAndBroadcast]);

  // ── Cart Operations ────────────────────────────────────────────────────────

  const addToCart = useCallback(
    (item: MenuItem) => {
      const latest = menuItems.find((m) => String(m.id) === String(item.id)) || item;
      if (!(latest.in_stock ?? latest.inStock)) return;

      soundEffects.playAddToCart();
      setCart((prevCart) => {
        const existing = prevCart.find((ci) => String(ci.item.id) === String(latest.id));
        if (existing) {
          return prevCart.map((ci) =>
            String(ci.item.id) === String(latest.id)
              ? { ...ci, quantity: ci.quantity + 1 }
              : ci
          );
        }
        return [...prevCart, { item: latest, quantity: 1 }];
      });
    },
    [menuItems]
  );

  const updateCartQuantity = useCallback((itemId: string | number, quantity: number) => {
    soundEffects.playWandClick();
    if (quantity <= 0) {
      setCart((prev) => prev.filter((ci) => String(ci.item.id) !== String(itemId)));
    } else {
      setCart((prev) =>
        prev.map((ci) => (String(ci.item.id) === String(itemId) ? { ...ci, quantity } : ci))
      );
    }
  }, []);

  const removeFromCart = useCallback((itemId: string | number) => {
    soundEffects.playWandClick();
    setCart((prev) => prev.filter((ci) => String(ci.item.id) !== String(itemId)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const setActiveOrderId = useCallback((id: string | number | null) => {
    setActiveOrderIdState(id);
  }, []);

  // ── Order Placement & Lifecycle ────────────────────────────────────────────

  const placeOrder = useCallback(
    (orderData: {
      customer: CustomerDetails;
      paymentMethod: PaymentMethod;
    }): number => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const newOrderId = randomDigits;
      const now = new Date();
      const isoTime = now.toISOString();

      const orderItems: OrderItem[] = cart.map((ci) => ({
        menuItemId: ci.item.id,
        name: ci.item.name,
        quantity: ci.quantity,
        unitPrice: ci.item.price,
        unit_price: ci.item.price,
        lineTotal: ci.item.price * ci.quantity,
        line_total: ci.item.price * ci.quantity,
      }));

      const newOrder: Order = {
        id: newOrderId,
        created_at: isoTime,
        createdAt: isoTime,
        customer_name: orderData.customer.fullName,
        customer: orderData.customer,
        phone: orderData.customer.phone,
        delivery_address: orderData.customer.address,
        items_summary: cart.map((ci) => `${ci.item.name} (x${ci.quantity})`).join(", "),
        items: orderItems,
        subtotal: cartSubtotal,
        delivery_fee: deliveryFee,
        total_amount: finalTotal,
        total: finalTotal,
        payment_method: orderData.paymentMethod,
        paymentMethod: orderData.paymentMethod,
        payment_status: orderData.paymentMethod === "UPI" ? "Completed" : "Pending",
        paymentStatus: orderData.paymentMethod === "UPI" ? "Completed" : "Pending",
        order_status: "Placed",
        status: "Placed",
        assigned_rider: null,
        statusMessage: "Your order has been placed. Waiting for barista confirmation in the Great Hall.",
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      persistAndBroadcast(menuItems, updatedOrders);

      setActiveOrderIdState(newOrderId);
      clearCart();
      setIsCartOpen(false);
      setIsTrackerOpen(true);
      soundEffects.playOrderPlaced();

      return newOrderId;
    },
    [cart, cartSubtotal, deliveryFee, finalTotal, orders, menuItems, persistAndBroadcast, clearCart]
  );

  const updateOrderStatus = useCallback(
    (orderId: string | number, status: OrderStatus, courier?: string) => {
      const updatedOrders = orders.map((order) => {
        if (String(order.id) === String(orderId)) {
          let statusMessage = "Status updated.";
          if (status === "Accepted") {
            statusMessage = "Your order has been accepted! Queued at brewing station.";
          } else if (status === "Brewing") {
            statusMessage = "Master Barista is simmering your brew in the Great Hearth cauldrons.";
          } else if (status === "Out for Delivery") {
            statusMessage = `Your order is out for delivery with ${courier || order.assignedCourier || "Hedwig"}! Keep your windowsill clear.`;
          } else if (status === "Delivered") {
            statusMessage = "Your order has been delivered safely. May your brews be potent!";
          } else if (status === "Cancelled") {
            statusMessage = "Your order has been cancelled.";
          }

          return {
            ...order,
            status,
            order_status: status,
            assignedCourier: courier !== undefined ? courier : order.assignedCourier,
            assigned_rider: courier !== undefined ? courier : order.assigned_rider,
            paymentStatus: status === "Delivered" ? ("Completed" as const) : order.paymentStatus,
            payment_status: status === "Delivered" ? ("Completed" as const) : order.payment_status,
            statusMessage,
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      persistAndBroadcast(menuItems, updatedOrders);

      if (status === "Delivered") {
        soundEffects.playDeliveredFanfare();
      } else {
        soundEffects.playStaffChime();
      }
    },
    [orders, menuItems, persistAndBroadcast]
  );

  // Convenience aliases for staff action triggers
  const acceptOrder = useCallback(
    (orderId: string | number) => updateOrderStatus(orderId, "Accepted"),
    [updateOrderStatus]
  );

  const startBrewingOrder = useCallback(
    (orderId: string | number) => updateOrderStatus(orderId, "Brewing"),
    [updateOrderStatus]
  );

  const assignCourier = useCallback(
    (orderId: string | number, courierName: string) =>
      updateOrderStatus(orderId, "Out for Delivery", courierName),
    [updateOrderStatus]
  );

  const markOrderDelivered = useCallback(
    (orderId: string | number) => updateOrderStatus(orderId, "Delivered"),
    [updateOrderStatus]
  );

  // Simulation: Incoming live order
  const simulateIncomingOrder = useCallback(() => {
    const students = [
      { name: "Draco Malfoy", addr: "Slytherin Dungeon, Suite 3", phone: "9988711223" },
      { name: "Ginny Weasley", addr: "Gryffindor Girls Dorm, Level 5", phone: "9922333445" },
      { name: "Cedric Diggory", addr: "Hufflepuff Basement, Near Kitchens", phone: "9911244556" },
      { name: "Cho Chang", addr: "Ravenclaw High Turret, Room 9", phone: "9933455667" },
    ];
    const picked = students[Math.floor(Math.random() * students.length)];
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random());
    const pickedItems = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

    const items: OrderItem[] = pickedItems.map((item) => {
      const q = Math.floor(Math.random() * 2) + 1;
      return {
        menuItemId: item.id,
        name: item.name,
        quantity: q,
        unitPrice: item.price,
        unit_price: item.price,
        lineTotal: item.price * q,
        line_total: item.price * q,
      };
    });

    const sub = items.reduce((s, it) => s + it.lineTotal, 0);
    const fee = sub >= 500 ? 0 : 40;
    const tot = sub + fee;
    const payMode: PaymentMethod = Math.random() > 0.4 ? "UPI" : "COD";
    const ordNum = Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();

    const simulated: Order = {
      id: ordNum,
      created_at: nowIso,
      createdAt: nowIso,
      customer_name: picked.name,
      customer: {
        fullName: picked.name,
        phone: picked.phone,
        address: picked.addr,
        deliveryNotes: "Deliver without alerting the prefects.",
      },
      phone: picked.phone,
      delivery_address: picked.addr,
      items_summary: items.map((i) => `${i.name} (x${i.quantity})`).join(", "),
      items,
      subtotal: sub,
      delivery_fee: fee,
      total_amount: tot,
      total: tot,
      payment_method: payMode,
      paymentMethod: payMode,
      payment_status: payMode === "UPI" ? "Completed" : "Pending",
      paymentStatus: payMode === "UPI" ? "Completed" : "Pending",
      order_status: "Placed",
      status: "Placed",
      assigned_rider: null,
      statusMessage: "Your order has been received in the Great Hall queue.",
    };

    const updatedOrders = [simulated, ...orders];
    setOrders(updatedOrders);
    persistAndBroadcast(menuItems, updatedOrders);
    soundEffects.playStaffChime();
  }, [menuItems, orders, persistAndBroadcast]);

  const resetAllData = useCallback(() => {
    setMenuItems(INITIAL_MENU_ITEMS);
    setOrders(DEFAULT_SAMPLE_ORDERS);
    setCart([]);
    setActiveOrderIdState(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(INITIAL_MENU_ITEMS));
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_SAMPLE_ORDERS));
      localStorage.removeItem(STORAGE_KEY_CART);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ORDER);
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: "SYNC_CAFE_STATE",
          menuItems: INITIAL_MENU_ITEMS,
          orders: DEFAULT_SAMPLE_ORDERS,
        });
      }
    }
  }, [broadcastChannel]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEffects.setEnabled(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_SOUND, String(next));
      }
      return next;
    });
  }, []);

  return (
    <CafeContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleStockStatus,
        restockAllItems,
        cart,
        cartCount,
        cartTotal: cartSubtotal,
        deliveryFee,
        finalTotal,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        orders,
        activeOrder,
        activeOrderId,
        setActiveOrderId,
        isTrackerOpen,
        setIsTrackerOpen,
        placeOrder,
        updateOrderStatus,
        acceptOrder,
        startBrewingOrder,
        assignCourier,
        markOrderDelivered,
        soundEnabled,
        toggleSound,
        simulateIncomingOrder,
        resetAllData,
      }}
    >
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error("useCafe must be used within a CafeProvider");
  }
  return context;
}

// Aliases for backwards compatibility with any existing components
export const OrderProvider = CafeProvider;
export const useOrder = useCafe;
