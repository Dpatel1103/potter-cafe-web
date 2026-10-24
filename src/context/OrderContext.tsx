"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  MenuItem,
  CartItem,
  Order,
  DeliveryInfo,
  PaymentMethod,
  OrderStatus,
  DbOrder,
  DbMenuItem,
} from "@/types";
import { INITIAL_MENU_ITEMS } from "@/data/menu";
import { soundEffects } from "@/components/SoundEffects";
import {
  supabase,
  isSupabaseConfigured,
  fetchDbMenuItems,
  fetchDbOrders,
  insertDbOrder,
  updateDbOrderStatus,
  updateDbItemStock,
} from "@/lib/supabaseClient";

interface OrderContextType {
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  activeOrder: Order | null;
  activeOrderId: string | null;
  isCartOpen: boolean;
  isTrackerOpen: boolean;
  soundEnabled: boolean;
  isCloudSyncActive: boolean;
  cartTotal: number;
  cartCount: number;
  ministryTax: number;
  deliveryFee: number;
  finalTotal: number;

  // Cart actions
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  setIsTrackerOpen: (open: boolean) => void;
  setActiveOrderId: (id: string | null) => void;

  // Order lifecycle actions
  placeOrder: (deliveryInfo: DeliveryInfo, paymentMethod: PaymentMethod) => Promise<string>;
  acceptOrder: (orderId: string) => Promise<void>;
  startBrewingOrder: (orderId: string) => Promise<void>;
  assignCourier: (orderId: string, courierName: string) => Promise<void>;
  markOrderDelivered: (orderId: string) => Promise<void>;

  // Menu inventory actions
  toggleItemStock: (itemId: string) => Promise<void>;
  restockAllItems: () => Promise<void>;

  // Demo & system actions
  simulateIncomingOrder: () => Promise<void>;
  resetAllData: () => void;
  toggleSound: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY_MENU = "espresso_patronum_menu_v1";
const STORAGE_KEY_ORDERS = "espresso_patronum_orders_v1";
const STORAGE_KEY_ACTIVE_ORDER = "espresso_patronum_active_order_v1";
const STORAGE_KEY_CART = "espresso_patronum_cart_v1";
const STORAGE_KEY_SOUND = "espresso_patronum_sound_v1";

const DEFAULT_SAMPLE_ORDERS: Order[] = [
  {
    id: "EXP-7041",
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    customer: {
      fullName: "Hermione Granger",
      phoneNumber: "+91 98200 12345",
      dormitoryAddress: "Gryffindor Tower, 7th Floor Common Room, Hogwarts",
      deliveryNotes: "Leave discreetly beside the tapestry of Barnabas the Barmy.",
    },
    items: [
      {
        item: INITIAL_MENU_ITEMS[0],
        quantity: 2,
      },
      {
        item: INITIAL_MENU_ITEMS[8],
        quantity: 1,
      },
    ],
    subtotal: 750,
    ministryTax: 38,
    deliveryFee: 0,
    total: 788,
    paymentMethod: "UPI",
    status: "Delivered",
    courierName: "Hedwig",
    statusMessage: "Your order has been delivered safely. May your brews be potent!",
    history: [
      { status: "Placed", timestamp: new Date(Date.now() - 1000 * 60 * 22).toLocaleTimeString(), note: "Enchanted ticket issued" },
      { status: "Accepted", timestamp: new Date(Date.now() - 1000 * 60 * 20).toLocaleTimeString(), note: "Barista accepted ticket" },
      { status: "Brewing", timestamp: new Date(Date.now() - 1000 * 60 * 16).toLocaleTimeString(), note: "Cauldrons bubbling" },
      { status: "Out for Delivery", timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString(), note: "Owl in flight with Hedwig" },
      { status: "Delivered", timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(), note: "Delivered to windowsill" },
    ],
  },
  {
    id: "EXP-8914",
    createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    customer: {
      fullName: "Ron Weasley",
      phoneNumber: "+91 98450 67890",
      dormitoryAddress: "The Burrow, Ottery St Catchpole, Attic Room",
      deliveryNotes: "Mind the ghoul when tapping on the chimney roof.",
    },
    items: [
      {
        item: INITIAL_MENU_ITEMS[9],
        quantity: 2,
      },
      {
        item: INITIAL_MENU_ITEMS[4],
        quantity: 1,
      },
    ],
    subtotal: 700,
    ministryTax: 35,
    deliveryFee: 0,
    total: 735,
    paymentMethod: "COD",
    status: "Brewing",
    statusMessage: "Master Barista is simmering your magical brew in the Great Hearth.",
    history: [
      { status: "Placed", timestamp: new Date(Date.now() - 1000 * 60 * 11).toLocaleTimeString(), note: "Order placed via Owl Post" },
      { status: "Accepted", timestamp: new Date(Date.now() - 1000 * 60 * 9).toLocaleTimeString(), note: "Order confirmed by staff" },
      { status: "Brewing", timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString(), note: "Concoctions simmering" },
    ],
  },
  {
    id: "EXP-9402",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    customer: {
      fullName: "Luna Lovegood",
      phoneNumber: "+91 98110 54321",
      dormitoryAddress: "Ravenclaw Tower, West Wing Window Seat",
      deliveryNotes: "Look for the radishes hanging beside the blue silk curtains.",
    },
    items: [
      {
        item: INITIAL_MENU_ITEMS[1],
        quantity: 1,
      },
      {
        item: INITIAL_MENU_ITEMS[6],
        quantity: 1,
      },
    ],
    subtotal: 630,
    ministryTax: 32,
    deliveryFee: 0,
    total: 662,
    paymentMethod: "UPI",
    status: "Placed",
    statusMessage: "Your enchanted ticket has been dispatched to the Baristas in the Great Hall.",
    history: [
      { status: "Placed", timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(), note: "Order received in Great Hall" },
    ],
  },
];

// Helper to convert DbOrder to client Order
function mapDbOrderToClientOrder(db: DbOrder, menu: MenuItem[]): Order {
  const menuMap = new Map(menu.map((m) => [m.id, m]));

  const clientItems: CartItem[] = (db.items || []).map((dbItem) => {
    const existing = menuMap.get(dbItem.id);
    return {
      item: existing || {
        id: dbItem.id,
        name: dbItem.name,
        category: (dbItem.category as MenuItem["category"]) || "Signature Potions",
        price: Number(dbItem.price),
        description: "",
        lore: "",
        inStock: true,
        accentColor: "#f59e0b",
        iconType: "potion",
      },
      quantity: dbItem.quantity || 1,
    };
  });

  return {
    id: db.id,
    createdAt: db.created_at,
    customer: {
      fullName: db.customer_name,
      phoneNumber: db.customer_phone,
      dormitoryAddress: db.delivery_address,
      deliveryNotes: db.delivery_notes || undefined,
    },
    items: clientItems,
    subtotal: Number(db.subtotal),
    ministryTax: Math.round(Number(db.subtotal) * 0.05),
    deliveryFee: Number(db.delivery_fee),
    total: Number(db.total_amount),
    paymentMethod: db.payment_method,
    status: db.status,
    courierName: db.courier_name || undefined,
    statusMessage:
      db.status === "Placed"
        ? "Your enchanted ticket has been dispatched to the Baristas in the Great Hall."
        : db.status === "Accepted"
        ? "Your order has been accepted! Queued at brewing station."
        : db.status === "Brewing"
        ? "Master Barista is simmering your magical brew in the Great Hearth."
        : db.status === "Out for Delivery"
        ? `Your order is out for delivery with ${db.courier_name || "Hedwig"}! Keep your windowsill clear.`
        : "Your order has been delivered safely. May your brews be potent!",
    history: [
      {
        status: db.status,
        timestamp: new Date(db.updated_at || db.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        note: `Status synchronized via Supabase Realtime: ${db.status}`,
      },
    ],
  };
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(DEFAULT_SAMPLE_ORDERS);
  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(isSupabaseConfigured);

  const activeOrderRef = useRef<string | null>(null);
  activeOrderRef.current = activeOrderId;

  // Local BroadcastChannel for instant same-browser cross-tab sync fallback
  const broadcastChannel = useMemo(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      return new BroadcastChannel("espresso_patronum_sync_channel");
    }
    return null;
  }, []);

  const broadcastAndPersist = useCallback(
    (newOrders: Order[], newMenu: MenuItem[]) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(newOrders));
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(newMenu));
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: "SYNC_STATE",
            orders: newOrders,
            menuItems: newMenu,
          });
        }
      } catch (e) {
        console.error("Failed to broadcast/persist state", e);
      }
    },
    [broadcastChannel]
  );

  // Initial Load from Supabase or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initData = async () => {
      try {
        // Read local storage first for immediate paint
        const savedMenu = localStorage.getItem(STORAGE_KEY_MENU);
        if (savedMenu) {
          setMenuItems(JSON.parse(savedMenu));
        }

        const savedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }

        const savedActiveOrderId = localStorage.getItem(STORAGE_KEY_ACTIVE_ORDER);
        if (savedActiveOrderId) {
          setActiveOrderIdState(savedActiveOrderId);
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

        // If Supabase is configured, pull live data from cloud
        if (isSupabaseConfigured) {
          const dbMenu = await fetchDbMenuItems();
          if (dbMenu && dbMenu.length > 0) {
            setMenuItems((prev) =>
              prev.map((item) => {
                const found = dbMenu.find((m) => m.id === item.id);
                return found ? { ...item, inStock: found.is_available } : item;
              })
            );
          }

          const dbOrders = await fetchDbOrders();
          if (dbOrders && dbOrders.length > 0) {
            const mapped = dbOrders.map((d) => mapDbOrderToClientOrder(d, INITIAL_MENU_ITEMS));
            setOrders(mapped);
          }
          setIsCloudSyncActive(true);
        }
      } catch (err) {
        console.warn("Initialization sync notice:", err);
      } finally {
        setIsHydrated(true);
      }
    };

    initData();
  }, []);

  // Supabase Realtime Channels (Orders and Menu Items)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ordersChannel = supabase
      .channel("realtime-orders-global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newDbOrder = payload.new as DbOrder;
          const mapped = mapDbOrderToClientOrder(newDbOrder, menuItems);

          setOrders((prev) => {
            if (prev.some((o) => o.id === mapped.id)) return prev;
            return [mapped, ...prev];
          });

          soundEffects.playStaffChime();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updatedDbOrder = payload.new as DbOrder;
          const mapped = mapDbOrderToClientOrder(updatedDbOrder, menuItems);

          setOrders((prev) =>
            prev.map((o) => (o.id === mapped.id ? mapped : o))
          );

          if (activeOrderRef.current && mapped.id === activeOrderRef.current) {
            if (mapped.status === "Delivered") {
              soundEffects.playDeliveredFanfare();
            } else {
              soundEffects.playStaffChime();
            }
          }
        }
      )
      .subscribe();

    const menuChannel = supabase
      .channel("realtime-menu-global")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          const updatedItem = payload.new as DbMenuItem;
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === updatedItem.id
                ? { ...item, inStock: updatedItem.is_available }
                : item
            )
          );
          soundEffects.playWandClick();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [menuItems]);

  // Local Broadcast & Storage Listener Fallback
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_STATE") {
        if (event.data.orders) setOrders(event.data.orders);
        if (event.data.menuItems) setMenuItems(event.data.menuItems);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener("message", handleBroadcast);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY_ORDERS && event.newValue) {
        try {
          setOrders(JSON.parse(event.newValue));
        } catch (err) {
          console.error(err);
        }
      }
      if (event.key === STORAGE_KEY_MENU && event.newValue) {
        try {
          setMenuItems(JSON.parse(event.newValue));
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

  // Save cart & activeOrderId to localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart, isHydrated]);

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

  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find((o) => o.id === activeOrderId) || null;
  }, [orders, activeOrderId]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const ministryTax = useMemo(() => {
    return Math.round(cartSubtotal * 0.05);
  }, [cartSubtotal]);

  const deliveryFee = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= 500 ? 0 : 40;
  }, [cartSubtotal]);

  const finalTotal = useMemo(() => {
    return cartSubtotal + ministryTax + deliveryFee;
  }, [cartSubtotal, ministryTax, deliveryFee]);

  // Sync sold out items inside cart
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

  const addToCart = useCallback(
    (item: MenuItem) => {
      const latestItem = menuItems.find((m) => m.id === item.id) || item;
      if (!latestItem.inStock) return;

      soundEffects.playAddToCart();
      setCart((prevCart) => {
        const existing = prevCart.find((ci) => ci.item.id === latestItem.id);
        if (existing) {
          return prevCart.map((ci) =>
            ci.item.id === latestItem.id ? { ...ci, quantity: ci.quantity + 1 } : ci
          );
        }
        return [...prevCart, { item: latestItem, quantity: 1 }];
      });
    },
    [menuItems]
  );

  const removeFromCart = useCallback((itemId: string) => {
    soundEffects.playWandClick();
    setCart((prevCart) => prevCart.filter((ci) => ci.item.id !== itemId));
  }, []);

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    soundEffects.playWandClick();
    if (quantity <= 0) {
      setCart((prevCart) => prevCart.filter((ci) => ci.item.id !== itemId));
    } else {
      setCart((prevCart) =>
        prevCart.map((ci) => (ci.item.id === itemId ? { ...ci, quantity } : ci))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const setActiveOrderId = useCallback((id: string | null) => {
    setActiveOrderIdState(id);
  }, []);

  // Place Order flow: inserts into Supabase + updates local state
  const placeOrder = useCallback(
    async (deliveryInfo: DeliveryInfo, paymentMethod: PaymentMethod): Promise<string> => {
      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      const newOrderId = `EXP-${orderNumber}`;
      const now = new Date();

      const newOrder: Order = {
        id: newOrderId,
        createdAt: now.toISOString(),
        customer: deliveryInfo,
        items: [...cart],
        subtotal: cartSubtotal,
        ministryTax,
        deliveryFee,
        total: finalTotal,
        paymentMethod,
        status: "Placed",
        statusMessage: "Your enchanted ticket has been dispatched to the Baristas in the Great Hall.",
        history: [
          {
            status: "Placed",
            timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            note: `Order placed via ${paymentMethod}. Dispatched to kitchen queue.`,
          },
        ],
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      broadcastAndPersist(updatedOrders, menuItems);

      setActiveOrderIdState(newOrderId);
      clearCart();
      setIsCartOpen(false);
      setIsTrackerOpen(true);
      soundEffects.playOrderPlaced();

      // Persist to Supabase if configured
      if (isSupabaseConfigured) {
        const dbPayload: DbOrder = {
          id: newOrderId,
          customer_name: deliveryInfo.fullName,
          customer_phone: deliveryInfo.phoneNumber,
          delivery_address: deliveryInfo.dormitoryAddress,
          items: cart.map((ci) => ({
            id: ci.item.id,
            name: ci.item.name,
            category: ci.item.category,
            price: ci.item.price,
            quantity: ci.quantity,
          })),
          subtotal: cartSubtotal,
          delivery_fee: deliveryFee,
          total_amount: finalTotal,
          payment_method: paymentMethod,
          status: "Placed",
          courier_name: null,
          delivery_notes: deliveryInfo.deliveryNotes || null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };

        await insertDbOrder(dbPayload);
      }

      return newOrderId;
    },
    [cart, cartSubtotal, ministryTax, deliveryFee, finalTotal, orders, menuItems, broadcastAndPersist, clearCart]
  );

  // Accept Order
  const acceptOrder = useCallback(
    async (orderId: string) => {
      const now = new Date();
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          const newStatus: OrderStatus = "Accepted";
          return {
            ...order,
            status: newStatus,
            statusMessage: "Your order has been accepted! Queued at brewing station.",
            history: [
              ...order.history,
              {
                status: newStatus,
                timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                note: "Barista acknowledged order and allocated cauldron station.",
              },
            ],
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      broadcastAndPersist(updatedOrders, menuItems);
      soundEffects.playStaffChime();

      if (isSupabaseConfigured) {
        await updateDbOrderStatus(orderId, "Accepted");
      }
    },
    [orders, menuItems, broadcastAndPersist]
  );

  // Start Brewing
  const startBrewingOrder = useCallback(
    async (orderId: string) => {
      const now = new Date();
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          const newStatus: OrderStatus = "Brewing";
          return {
            ...order,
            status: newStatus,
            statusMessage: "Master Barista is simmering your magical brew in the Great Hearth.",
            history: [
              ...order.history,
              {
                status: newStatus,
                timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                note: "Master Barista is simmering and extracting magical essences.",
              },
            ],
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      broadcastAndPersist(updatedOrders, menuItems);
      soundEffects.playStaffChime();

      if (isSupabaseConfigured) {
        await updateDbOrderStatus(orderId, "Brewing");
      }
    },
    [orders, menuItems, broadcastAndPersist]
  );

  // Assign Courier
  const assignCourier = useCallback(
    async (orderId: string, courierName: string) => {
      const now = new Date();
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          const newStatus: OrderStatus = "Out for Delivery";
          return {
            ...order,
            status: newStatus,
            courierName,
            statusMessage: `Your order is out for delivery with ${courierName}! Keep your windowsill clear.`,
            history: [
              ...order.history,
              {
                status: newStatus,
                timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                note: `Courier dispatched: ${courierName} is airborne.`,
              },
            ],
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      broadcastAndPersist(updatedOrders, menuItems);
      soundEffects.playStaffChime();

      if (isSupabaseConfigured) {
        await updateDbOrderStatus(orderId, "Out for Delivery", courierName);
      }
    },
    [orders, menuItems, broadcastAndPersist]
  );

  // Mark Delivered
  const markOrderDelivered = useCallback(
    async (orderId: string) => {
      const now = new Date();
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          const newStatus: OrderStatus = "Delivered";
          return {
            ...order,
            status: newStatus,
            statusMessage: "Your order has been delivered safely. May your brews be potent!",
            history: [
              ...order.history,
              {
                status: newStatus,
                timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                note: "Courier marked package safely delivered to dormitory chamber.",
              },
            ],
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      broadcastAndPersist(updatedOrders, menuItems);
      soundEffects.playDeliveredFanfare();

      if (isSupabaseConfigured) {
        await updateDbOrderStatus(orderId, "Delivered");
      }
    },
    [orders, menuItems, broadcastAndPersist]
  );

  // Toggle Item Stock
  const toggleItemStock = useCallback(
    async (itemId: string) => {
      const targetItem = menuItems.find((m) => m.id === itemId);
      const newStockStatus = targetItem ? !targetItem.inStock : false;

      const updatedMenu = menuItems.map((item) =>
        item.id === itemId ? { ...item, inStock: newStockStatus } : item
      );
      setMenuItems(updatedMenu);
      broadcastAndPersist(orders, updatedMenu);
      soundEffects.playWandClick();

      if (isSupabaseConfigured) {
        await updateDbItemStock(itemId, newStockStatus);
      }
    },
    [menuItems, orders, broadcastAndPersist]
  );

  const restockAllItems = useCallback(async () => {
    const updatedMenu = menuItems.map((item) => ({ ...item, inStock: true }));
    setMenuItems(updatedMenu);
    broadcastAndPersist(orders, updatedMenu);
    soundEffects.playStaffChime();

    if (isSupabaseConfigured) {
      await Promise.all(menuItems.map((m) => updateDbItemStock(m.id, true)));
    }
  }, [menuItems, orders, broadcastAndPersist]);

  const simulateIncomingOrder = useCallback(async () => {
    const sampleNames = [
      { name: "Draco Malfoy", addr: "Slytherin Dungeon, Suite 3, Hogwarts", phone: "+91 99887 11223" },
      { name: "Ginny Weasley", addr: "Gryffindor Girls Dorm, Level 5, Hogwarts", phone: "+91 99223 33445" },
      { name: "Cedric Diggory", addr: "Hufflepuff Basement, Near the Kitchens", phone: "+91 99112 44556" },
      { name: "Cho Chang", addr: "Ravenclaw High Turret, Room 9", phone: "+91 99334 55667" },
    ];
    const pickedPerson = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomItemsCount = Math.floor(Math.random() * 2) + 1;
    const shuffledItems = [...menuItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, randomItemsCount).map((item) => ({
      item,
      quantity: Math.floor(Math.random() * 2) + 1,
    }));

    const sub = selectedItems.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
    const tax = Math.round(sub * 0.05);
    const fee = sub >= 500 ? 0 : 40;
    const tot = sub + tax + fee;
    const payMode: PaymentMethod = Math.random() > 0.4 ? "UPI" : "COD";
    const orderNumber = Math.floor(2000 + Math.random() * 7000);
    const now = new Date();

    const incomingOrder: Order = {
      id: `EXP-${orderNumber}`,
      createdAt: now.toISOString(),
      customer: {
        fullName: pickedPerson.name,
        phoneNumber: pickedPerson.phone,
        dormitoryAddress: pickedPerson.addr,
        deliveryNotes: "Deliver without alarming the prefects.",
      },
      items: selectedItems,
      subtotal: sub,
      ministryTax: tax,
      deliveryFee: fee,
      total: tot,
      paymentMethod: payMode,
      status: "Placed",
      statusMessage: "Your enchanted ticket has been dispatched to the Baristas in the Great Hall.",
      history: [
        {
          status: "Placed",
          timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          note: `Simulated incoming order via ${payMode}`,
        },
      ],
    };

    const updatedOrders = [incomingOrder, ...orders];
    setOrders(updatedOrders);
    broadcastAndPersist(updatedOrders, menuItems);
    soundEffects.playStaffChime();

    if (isSupabaseConfigured) {
      await insertDbOrder({
        id: incomingOrder.id,
        customer_name: incomingOrder.customer.fullName,
        customer_phone: incomingOrder.customer.phoneNumber,
        delivery_address: incomingOrder.customer.dormitoryAddress,
        items: selectedItems.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name,
          category: ci.item.category,
          price: ci.item.price,
          quantity: ci.quantity,
        })),
        subtotal: sub,
        delivery_fee: fee,
        total_amount: tot,
        payment_method: payMode,
        status: "Placed",
        courier_name: null,
        delivery_notes: incomingOrder.customer.deliveryNotes || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    }
  }, [menuItems, orders, broadcastAndPersist]);

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
          type: "SYNC_STATE",
          orders: DEFAULT_SAMPLE_ORDERS,
          menuItems: INITIAL_MENU_ITEMS,
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
    <OrderContext.Provider
      value={{
        menuItems,
        cart,
        orders,
        activeOrder,
        activeOrderId,
        isCartOpen,
        isTrackerOpen,
        soundEnabled,
        isCloudSyncActive,
        cartTotal: cartSubtotal,
        cartCount,
        ministryTax,
        deliveryFee,
        finalTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        setIsCartOpen,
        setIsTrackerOpen,
        setActiveOrderId,
        placeOrder,
        acceptOrder,
        startBrewingOrder,
        assignCourier,
        markOrderDelivered,
        toggleItemStock,
        restockAllItems,
        simulateIncomingOrder,
        resetAllData,
        toggleSound,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
