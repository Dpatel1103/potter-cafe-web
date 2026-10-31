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
  updateMenuItem: (id: string, updatedFields: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleStockStatus: (id: string) => void;
  restockAllItems: () => void;

  // Cart state & actions
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  deliveryFee: number;
  finalTotal: number;
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Order lifecycle & tracking
  orders: Order[];
  activeOrder: Order | null;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  isTrackerOpen: boolean;
  setIsTrackerOpen: (open: boolean) => void;
  placeOrder: (orderData: {
    customer: CustomerDetails;
    paymentMethod: PaymentMethod;
  }) => string;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    courier?: string
  ) => void;

  // Convenience aliases for staff actions
  acceptOrder: (orderId: string) => void;
  startBrewingOrder: (orderId: string) => void;
  assignCourier: (orderId: string, courierName: string) => void;
  markOrderDelivered: (orderId: string) => void;

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
    id: "ORD-1042",
    createdAt: "2026-10-25T13:45:00.000Z",
    customer: {
      fullName: "Hermione Granger",
      phone: "9820012345",
      address: "Gryffindor Tower, 7th Floor Common Room, Hogwarts",
      deliveryNotes: "Leave discreetly beside the tapestry of Barnabas the Barmy.",
    },
    items: [
      {
        menuItemId: "item-butterscotch-cold-brew",
        name: "Butterscotch Cold Brew",
        quantity: 2,
        unitPrice: 280,
        lineTotal: 560,
      },
      {
        menuItemId: "item-golden-snitch-macaron",
        name: "Golden Snitch Macaron",
        quantity: 1,
        unitPrice: 180,
        lineTotal: 180,
      },
    ],
    subtotal: 740,
    deliveryFee: 0,
    total: 740,
    paymentMethod: "UPI",
    paymentStatus: "Completed",
    status: "Delivered",
    assignedCourier: "Hedwig Express",
    statusMessage: "Your order has been delivered safely by Hedwig Express.",
  },
  {
    id: "ORD-1088",
    createdAt: "2026-10-25T14:05:00.000Z",
    customer: {
      fullName: "Ron Weasley",
      phone: "9845067890",
      address: "The Burrow, Ottery St Catchpole, Attic Room",
      deliveryNotes: "Mind the family ghoul when tapping on the chimney roof.",
    },
    items: [
      {
        menuItemId: "item-cauldron-hand-pie",
        name: "Cauldron Hand Pie",
        quantity: 2,
        unitPrice: 240,
        lineTotal: 480,
      },
      {
        menuItemId: "item-dark-mark-espresso",
        name: "Dark Mark Espresso",
        quantity: 1,
        unitPrice: 190,
        lineTotal: 190,
      },
    ],
    subtotal: 670,
    deliveryFee: 0,
    total: 670,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    status: "Brewing",
    statusMessage: "Your order is simmering in the apothecary cauldrons.",
  },
  {
    id: "ORD-1104",
    createdAt: "2026-10-25T14:15:00.000Z",
    customer: {
      fullName: "Luna Lovegood",
      phone: "9811054321",
      address: "Ravenclaw Tower, West Wing Window Seat",
      deliveryNotes: "Look for the radishes hanging beside the blue silk curtains.",
    },
    items: [
      {
        menuItemId: "item-liquid-luck-latte",
        name: "Liquid Luck Latte",
        quantity: 1,
        unitPrice: 320,
        lineTotal: 320,
      },
      {
        menuItemId: "item-pumpkin-pasties",
        name: "Pumpkin Pasties",
        quantity: 1,
        unitPrice: 210,
        lineTotal: 210,
      },
    ],
    subtotal: 530,
    deliveryFee: 0,
    total: 530,
    paymentMethod: "UPI",
    paymentStatus: "Pending",
    status: "Placed",
    statusMessage: "Your order has been received in the Great Hall queue.",
  },
];

export function CafeProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(DEFAULT_SAMPLE_ORDERS);
  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(null);
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
      if (activeOrderId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ORDER, activeOrderId);
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
    const stockMap = new Map(menuItems.map((m) => [m.id, m.inStock]));
    setCart((prevCart) =>
      prevCart.map((cartItem) => {
        const isStillInStock = stockMap.get(cartItem.item.id) ?? true;
        if (cartItem.item.inStock !== isStillInStock) {
          return {
            ...cartItem,
            item: { ...cartItem.item, inStock: isStillInStock },
          };
        }
        return cartItem;
      })
    );
  }, [menuItems]);

  // Derived Active Order
  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find((o) => o.id === activeOrderId) || null;
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
      const generatedId = `item-${itemData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

      const newItem: MenuItem = {
        ...itemData,
        id: generatedId,
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
    (id: string, updatedFields: Partial<MenuItem>) => {
      const updatedMenu = menuItems.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item
      );
      setMenuItems(updatedMenu);
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const deleteMenuItem = useCallback(
    (id: string) => {
      const updatedMenu = menuItems.filter((item) => item.id !== id);
      setMenuItems(updatedMenu);
      // Also remove deleted item from cart
      setCart((prev) => prev.filter((ci) => ci.item.id !== id));
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const toggleStockStatus = useCallback(
    (id: string) => {
      const updatedMenu = menuItems.map((item) =>
        item.id === id ? { ...item, inStock: !item.inStock } : item
      );
      setMenuItems(updatedMenu);
      persistAndBroadcast(updatedMenu, orders);
      soundEffects.playWandClick();
    },
    [menuItems, orders, persistAndBroadcast]
  );

  const restockAllItems = useCallback(() => {
    const updatedMenu = menuItems.map((item) => ({ ...item, inStock: true }));
    setMenuItems(updatedMenu);
    persistAndBroadcast(updatedMenu, orders);
    soundEffects.playStaffChime();
  }, [menuItems, orders, persistAndBroadcast]);

  // ── Cart Operations ────────────────────────────────────────────────────────

  const addToCart = useCallback(
    (item: MenuItem) => {
      const latest = menuItems.find((m) => m.id === item.id) || item;
      if (!latest.inStock) return;

      soundEffects.playAddToCart();
      setCart((prevCart) => {
        const existing = prevCart.find((ci) => ci.item.id === latest.id);
        if (existing) {
          return prevCart.map((ci) =>
            ci.item.id === latest.id
              ? { ...ci, quantity: ci.quantity + 1 }
              : ci
          );
        }
        return [...prevCart, { item: latest, quantity: 1 }];
      });
    },
    [menuItems]
  );

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    soundEffects.playWandClick();
    if (quantity <= 0) {
      setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity } : ci))
      );
    }
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    soundEffects.playWandClick();
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const setActiveOrderId = useCallback((id: string | null) => {
    setActiveOrderIdState(id);
  }, []);

  // ── Order Placement & Lifecycle ────────────────────────────────────────────

  const placeOrder = useCallback(
    (orderData: {
      customer: CustomerDetails;
      paymentMethod: PaymentMethod;
    }): string => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const newOrderId = `ORD-${randomDigits}`;
      const now = new Date();

      const orderItems: OrderItem[] = cart.map((ci) => ({
        menuItemId: ci.item.id,
        name: ci.item.name,
        quantity: ci.quantity,
        unitPrice: ci.item.price,
        lineTotal: ci.item.price * ci.quantity,
      }));

      const newOrder: Order = {
        id: newOrderId,
        createdAt: now.toISOString(),
        customer: orderData.customer,
        items: orderItems,
        subtotal: cartSubtotal,
        deliveryFee,
        total: finalTotal,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentMethod === "UPI" ? "Completed" : "Pending",
        status: "Placed",
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
    (orderId: string, status: OrderStatus, courier?: string) => {
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
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
            assignedCourier: courier !== undefined ? courier : order.assignedCourier,
            paymentStatus: status === "Delivered" ? ("Completed" as const) : order.paymentStatus,
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
    (orderId: string) => updateOrderStatus(orderId, "Accepted"),
    [updateOrderStatus]
  );

  const startBrewingOrder = useCallback(
    (orderId: string) => updateOrderStatus(orderId, "Brewing"),
    [updateOrderStatus]
  );

  const assignCourier = useCallback(
    (orderId: string, courierName: string) =>
      updateOrderStatus(orderId, "Out for Delivery", courierName),
    [updateOrderStatus]
  );

  const markOrderDelivered = useCallback(
    (orderId: string) => updateOrderStatus(orderId, "Delivered"),
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
        lineTotal: item.price * q,
      };
    });

    const sub = items.reduce((s, it) => s + it.lineTotal, 0);
    const fee = sub >= 500 ? 0 : 40;
    const tot = sub + fee;
    const payMode: PaymentMethod = Math.random() > 0.4 ? "UPI" : "COD";
    const ordNum = Math.floor(1000 + Math.random() * 9000);

    const simulated: Order = {
      id: `ORD-${ordNum}`,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: picked.name,
        phone: picked.phone,
        address: picked.addr,
        deliveryNotes: "Deliver without alerting the prefects.",
      },
      items,
      subtotal: sub,
      deliveryFee: fee,
      total: tot,
      paymentMethod: payMode,
      paymentStatus: payMode === "UPI" ? "Completed" : "Pending",
      status: "Placed",
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
