"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useOrder } from "@/context/OrderContext";
import { Order, OrderStatus } from "@/types";
import { AssignCourierModal } from "@/components/AssignCourierModal";
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Flame,
  Truck,
  CheckCircle2,
  Package,
  Plus,
  Compass,
  Sparkles,
  Phone,
  MapPin,
  Check,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Send,
  Coffee,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function AdminPage() {
  const {
    orders,
    menuItems,
    acceptOrder,
    startBrewingOrder,
    assignCourier,
    markOrderDelivered,
    toggleItemStock,
    restockAllItems,
    simulateIncomingOrder,
    resetAllData,
    soundEnabled,
    toggleSound,
    isCloudSyncActive,
  } = useOrder();

  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");
  const [orderFilter, setOrderFilter] = useState<"All" | OrderStatus>("All");
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState<Order | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "Delivered")
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "Placed").length;
  }, [orders]);

  const activeBrewsCount = useMemo(() => {
    return orders.filter((o) => o.status === "Accepted" || o.status === "Brewing").length;
  }, [orders]);

  const outForDeliveryCount = useMemo(() => {
    return orders.filter((o) => o.status === "Out for Delivery").length;
  }, [orders]);

  const deliveredCount = useMemo(() => {
    return orders.filter((o) => o.status === "Delivered").length;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === "All") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.category.toLowerCase().includes(inventorySearch.toLowerCase())
    );
  }, [menuItems, inventorySearch]);

  const handleOpenCourierModal = (order: Order) => {
    setSelectedOrderForCourier(order);
    setIsCourierModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0d0b0e] text-[#f3effa] flex flex-col">
      {/* Top Operations Header */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#0d0b0e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500/20 via-purple-900/40 to-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide text-amber-200">
                  MINISTRY OPERATIONS DECK
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full">
                  Live Dispatch Console
                </span>
                {isCloudSyncActive ? (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase Realtime
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider text-purple-300 bg-purple-950/40 border border-purple-500/30 rounded-full" title="Configure .env.local to activate Supabase cloud database">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Local Sync Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-300/70 font-sans">
                Real-time kitchen queues, owl couriers, and apothecary inventory
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg border border-purple-900/60 bg-[#16121b] text-purple-300 hover:text-amber-300 transition-colors"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Simulate Incoming Order Button for Instant Testing */}
            <button
              onClick={simulateIncomingOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/80 to-purple-800/80 hover:from-purple-800 hover:to-purple-700 text-purple-200 border border-purple-500/40 text-xs font-semibold shadow-md active:scale-95 transition-all"
              title="Simulates a real-time incoming order from a student"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulate Order</span>
            </button>

            {/* Back to Client Storefront */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Great Hall Menu</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Operations Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-purple-300/60 font-semibold block">
                Total Revenue
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                ₹{totalRevenue}
              </span>
              <span className="text-[10px] text-purple-400/50">Settled orders</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Orders */}
          <div className="p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-purple-300/60 font-semibold block">
                Pending Orders
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block">
                {pendingOrdersCount}
              </span>
              <span className="text-[10px] text-purple-400/50">Awaiting acceptance</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* Active Brews */}
          <div className="p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-purple-300/60 font-semibold block">
                Active Brews
              </span>
              <span className="text-2xl font-bold font-mono text-orange-400 mt-1 block">
                {activeBrewsCount}
              </span>
              <span className="text-[10px] text-purple-400/50">Simmering in cauldrons</span>
            </div>
            <div className="p-3 rounded-xl bg-orange-950/60 border border-orange-500/30 text-orange-400">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          {/* Out for Delivery */}
          <div className="p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-purple-300/60 font-semibold block">
                Out for Delivery
              </span>
              <span className="text-2xl font-bold font-mono text-purple-300 mt-1 block">
                {outForDeliveryCount}
              </span>
              <span className="text-[10px] text-purple-400/50">Owls airborne</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Switcher: Orders Queue vs Inventory Manager */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#16121b] border border-purple-900/60 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-cinzel font-bold tracking-wider transition-all ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-[#0d0b0e] shadow-md"
                  : "text-purple-300/70 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Live Orders Queue ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-cinzel font-bold tracking-wider transition-all ${
                activeTab === "inventory"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-[#0d0b0e] shadow-md"
                  : "text-purple-300/70 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Apothecary Inventory ({menuItems.length})</span>
            </button>
          </div>

          {/* Quick System Helpers */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-900/60 bg-[#16121b] text-purple-300/70 hover:text-red-300 hover:border-red-500/40 text-xs transition-colors"
              title="Reset orders and menu inventory to default initial values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: LIVE ORDERS QUEUE
           ========================================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
              {(["All", "Placed", "Accepted", "Brewing", "Out for Delivery", "Delivered"] as const).map(
                (status) => {
                  const count =
                    status === "All"
                      ? orders.length
                      : orders.filter((o) => o.status === status).length;
                  return (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        orderFilter === status
                          ? "bg-amber-500/20 border border-amber-400 text-amber-200"
                          : "bg-[#16121b] border border-purple-900/40 text-purple-300/70 hover:text-white"
                      }`}
                    >
                      <span>{status}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0d0b0e] text-purple-300">
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-[#16121b]/40 border border-purple-900/40 p-8 space-y-3">
                <Clock className="w-10 h-10 mx-auto text-purple-400/50" />
                <h3 className="font-cinzel text-base font-bold text-amber-200">
                  No Orders in &ldquo;{orderFilter}&rdquo;
                </h3>
                <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
                  There are currently no tickets matching this lifecycle stage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((order) => {
                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-[#16121b] border border-amber-500/20 hover:border-amber-500/40 shadow-lg transition-all space-y-4 flex flex-col justify-between"
                    >
                      {/* Top Header: Order ID & Status Badge */}
                      <div className="flex items-start justify-between gap-3 border-b border-purple-900/40 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold text-amber-300">
                              #{order.id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-800">
                              {order.paymentMethod}
                            </span>
                          </div>
                          <span className="text-[11px] text-purple-400/60 block mt-0.5">
                            Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Status Chip */}
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold font-cinzel uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              order.status === "Placed"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-400/60 animate-pulse"
                                : order.status === "Accepted"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-400/60"
                                : order.status === "Brewing"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-400/60"
                                : order.status === "Out for Delivery"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-400/60"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/60"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Delivery Chamber Info */}
                      <div className="space-y-1.5 text-xs text-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-100">{order.customer.fullName}</span>
                          <span className="font-mono text-purple-300/70">{order.customer.phoneNumber}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-purple-300/80">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{order.customer.dormitoryAddress}</span>
                        </div>
                        {order.customer.deliveryNotes && (
                          <p className="text-[11px] text-amber-200/70 italic pl-5">
                            &ldquo;{order.customer.deliveryNotes}&rdquo;
                          </p>
                        )}
                        {order.courierName && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold pt-1">
                            <span>🦉 Courier:</span>
                            <span className="underline underline-offset-2">{order.courierName}</span>
                          </div>
                        )}
                      </div>

                      {/* Items Ordered Breakdown */}
                      <div className="p-3 rounded-xl bg-[#0d0b0e] border border-purple-900/40 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-purple-400/60 font-semibold uppercase tracking-wider pb-1 border-b border-purple-900/30">
                          <span>Items ({order.items.reduce((s, c) => s + c.quantity, 0)})</span>
                          <span>Price</span>
                        </div>
                        {order.items.map((ci) => (
                          <div key={ci.item.id} className="flex justify-between items-center text-xs">
                            <span className="text-purple-200">
                              {ci.item.name}{" "}
                              <span className="text-amber-400 font-mono font-bold">× {ci.quantity}</span>
                            </span>
                            <span className="font-mono text-amber-300 font-medium">
                              ₹{ci.item.price * ci.quantity}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-purple-900/30 flex justify-between items-center text-xs font-bold text-amber-200">
                          <span>Total Amount</span>
                          <span className="font-mono text-sm text-emerald-400">
                            ₹{order.total}
                          </span>
                        </div>
                      </div>

                      {/* Operations Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {/* Status == "Placed" -> Staff clicks "Accept Order" */}
                        {order.status === "Placed" && (
                          <button
                            onClick={() => acceptOrder(order.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[#0d0b0e] font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Order</span>
                          </button>
                        )}

                        {/* Status == "Accepted" -> Start Brewing or Assign Courier */}
                        {order.status === "Accepted" && (
                          <>
                            <button
                              onClick={() => startBrewingOrder(order.id)}
                              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-[#0d0b0e] font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                            >
                              <Flame className="w-4 h-4" />
                              <span>Start Brewing</span>
                            </button>

                            <button
                              onClick={() => handleOpenCourierModal(order)}
                              className="flex-1 py-2 px-3 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Send className="w-4 h-4" />
                              <span>Assign Partner</span>
                            </button>
                          </>
                        )}

                        {/* Status == "Brewing" -> Assign Delivery Partner */}
                        {order.status === "Brewing" && (
                          <button
                            onClick={() => handleOpenCourierModal(order)}
                            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-[#0d0b0e] font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer active:scale-95"
                          >
                            <Send className="w-4 h-4" />
                            <span>Assign Delivery Partner</span>
                          </button>
                        )}

                        {/* Status == "Out for Delivery" -> Mark Delivered */}
                        {order.status === "Out for Delivery" && (
                          <button
                            onClick={() => markOrderDelivered(order.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-[#0d0b0e] font-cinzel font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {/* Status == "Delivered" -> Finished */}
                        {order.status === "Delivered" && (
                          <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Order Settled & Delivered</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: APOTHECARY INVENTORY MANAGER
           ========================================================================= */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Search & Actions Bar */}
            <div className="p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search inventory items..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#0d0b0e] border border-purple-900/60 text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={restockAllItems}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Restock All Items</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl bg-[#16121b] border border-amber-500/20 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-purple-200">
                  <thead className="bg-[#0d0b0e] text-[11px] font-cinzel font-bold text-amber-300/80 uppercase tracking-wider border-b border-purple-900/40">
                    <tr>
                      <th className="px-6 py-4">Item Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock Status</th>
                      <th className="px-6 py-4 text-right">Inventory Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30 font-sans">
                    {filteredInventory.map((item) => {
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-purple-950/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-cinzel font-bold text-sm text-amber-100 block">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-purple-300/60">
                                {item.badge || item.description.slice(0, 45) + "..."}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-purple-900/40 text-purple-300 border border-purple-800">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-300">
                            ₹{item.price}
                          </td>
                          <td className="px-6 py-4">
                            {item.inStock ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                Sold Out
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => toggleItemStock(item.id)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                item.inStock
                                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                              }`}
                              title={item.inStock ? "Mark as Sold Out" : "Mark as In Stock"}
                            >
                              {item.inStock ? "Toggle Sold Out" : "Restock Item"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Assign Delivery Partner Modal */}
      <AssignCourierModal
        isOpen={isCourierModalOpen}
        order={selectedOrderForCourier}
        onClose={() => setIsCourierModalOpen(false)}
        onAssign={assignCourier}
      />
    </div>
  );
}
