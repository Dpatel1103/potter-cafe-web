"use client";

import React from "react";
import { useOrder } from "@/context/OrderContext";
import { OrderStatus } from "@/types";
import {
  X,
  Sparkles,
  CheckCircle,
  Flame,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Feather,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

const STEPS: { status: OrderStatus; label: string; icon: string; desc: string }[] = [
  {
    status: "Placed",
    label: "Placed",
    icon: "sparkles",
    desc: "Logged in Great Hall",
  },
  {
    status: "Accepted",
    label: "Accepted",
    icon: "check",
    desc: "Barista acknowledged",
  },
  {
    status: "Brewing",
    label: "Brewing",
    icon: "flame",
    desc: "Simmering in cauldron",
  },
  {
    status: "Out for Delivery",
    label: "Out for Delivery",
    icon: "owl",
    desc: "Owl airborne",
  },
  {
    status: "Delivered",
    label: "Delivered",
    icon: "trophy",
    desc: "Safely arrived",
  },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  Placed: 0,
  Accepted: 1,
  Brewing: 2,
  "Out for Delivery": 3,
  Delivered: 4,
  Cancelled: -1,
};

export function OrderTracker() {
  const {
    activeOrder,
    isTrackerOpen,
    setIsTrackerOpen,
    orders,
    setActiveOrderId,
    isCloudSyncActive,
  } = useOrder();

  if (!isTrackerOpen) return null;

  // If no active order, show past orders picker or empty state
  if (!activeOrder) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-lg bg-[#120e17] border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-[#f3effa]">
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
            <h3 className="font-cinzel text-lg font-bold text-amber-200">
              Order Tracker
            </h3>
            <button
              onClick={() => setIsTrackerOpen(false)}
              className="p-1 rounded text-purple-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="py-8 text-center space-y-3">
            <Clock className="w-12 h-12 mx-auto text-purple-400/50" />
            <p className="text-sm text-purple-200">No active order currently being tracked.</p>
            {orders.length > 0 && (
              <div className="pt-4 text-left">
                <span className="text-xs text-purple-300/60 font-semibold uppercase tracking-wider block mb-2">
                  Select a recent order to track:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setActiveOrderId(o.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-[#16121b] border border-purple-900/50 hover:border-amber-500/50 transition-colors text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-300">#{o.id}</span>
                        <span className="text-purple-300/70 ml-2">{o.customer.fullName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                        {o.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_INDEX[activeOrder.status] ?? 0;

  // Render Step Icon
  const renderStepIcon = (icon: string, isCurrent: boolean, isPassed: boolean) => {
    if (isPassed) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    switch (icon) {
      case "sparkles":
        return <Sparkles className={`w-4 h-4 ${isCurrent ? "text-amber-300 animate-spin" : "text-purple-400"}`} />;
      case "check":
        return <CheckCircle className={`w-4 h-4 ${isCurrent ? "text-amber-300 animate-pulse" : "text-purple-400"}`} />;
      case "flame":
        return <Flame className={`w-4 h-4 ${isCurrent ? "text-amber-400 animate-bounce" : "text-purple-400"}`} />;
      case "owl":
        return <Feather className={`w-4 h-4 ${isCurrent ? "text-amber-300 animate-pulse" : "text-purple-400"}`} />;
      case "trophy":
      default:
        return <CheckCircle2 className={`w-4 h-4 ${isCurrent ? "text-emerald-400" : "text-purple-400"}`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={() => setIsTrackerOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#120e17] border border-amber-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] overflow-hidden text-[#f3effa] z-10 my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#16121b] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-lg font-bold text-amber-100">
                  Live Marauder&apos;s Tracker
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900/50 border border-purple-800 text-amber-300 font-bold">
                  #{activeOrder.id}
                </span>
              </div>
              <p className="text-[11px] text-purple-300/70 font-sans">
                Real-time kitchen & owl post monitoring • Instant multi-tab synced
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackerOpen(false)}
            className="p-1.5 rounded-lg text-purple-300/70 hover:text-amber-300 hover:bg-purple-900/40 transition-colors"
            title="Close Tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Dynamic Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              activeOrder.status === "Delivered"
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                : activeOrder.status === "Out for Delivery"
                ? "bg-amber-950/50 border-amber-500/60 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse"
                : "bg-purple-950/40 border-purple-800/60 text-purple-200"
            }`}
          >
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-300 block mb-0.5">
                Current Status: {activeOrder.status}
              </span>
              <p className="text-sm font-medium leading-relaxed">
                {activeOrder.statusMessage ||
                  (activeOrder.status === "Placed" &&
                    "Your order has been placed. Waiting for the Baristas to acknowledge your ticket.") ||
                  (activeOrder.status === "Accepted" &&
                    "Your order has been accepted! Queued at the brewing station.") ||
                  (activeOrder.status === "Brewing" &&
                    "Master Barista is simmering your magical concoction in the Great Hearth.") ||
                  (activeOrder.status === "Out for Delivery" &&
                    `Your order is out for delivery with ${activeOrder.courierName || "Hedwig"}! Keep your windowsill clear.`) ||
                  "Your order has been delivered safely. May your brews be potent!"}
              </p>
            </div>
          </div>

          {/* 5-Step Visual Stepper */}
          <div className="p-5 rounded-xl bg-[#0d0b0e] border border-purple-900/40">
            <div className="relative">
              {/* Progress Bar Line */}
              <div className="absolute top-5 left-6 right-6 h-0.5 bg-purple-950 z-0">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-700 ease-out"
                  style={{
                    width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Stepper Nodes */}
              <div className="relative z-10 flex justify-between items-start">
                {STEPS.map((step, idx) => {
                  const isCurrent = idx === currentStepIdx;
                  const isPassed = idx < currentStepIdx;
                  const isUpcoming = idx > currentStepIdx;

                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center text-center max-w-[80px]"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                          isPassed
                            ? "bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                            : isCurrent
                            ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.5)] scale-110"
                            : "bg-[#16121b] border-purple-900/60 text-purple-600"
                        }`}
                      >
                        {renderStepIcon(step.icon, isCurrent, isPassed)}
                      </div>

                      <span
                        className={`mt-2 font-cinzel text-[11px] font-bold tracking-tight leading-tight ${
                          isCurrent
                            ? "text-amber-200"
                            : isPassed
                            ? "text-emerald-300"
                            : "text-purple-400/50"
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="hidden sm:block text-[9px] text-purple-300/40 mt-0.5 leading-none">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Assigned Courier Profile Card if dispatched */}
          {activeOrder.courierName && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-[#16121b] to-purple-950/30 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xl shadow-inner">
                  🦉
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-amber-400/80 tracking-widest block">
                    Dispatched Courier
                  </span>
                  <h4 className="font-cinzel text-base font-bold text-amber-100">
                    {activeOrder.courierName}
                  </h4>
                  <p className="text-xs text-purple-300/70">
                    In flight to your chamber window • Keep parchment ready
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Airborne
              </span>
            </div>
          )}

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Details */}
            <div className="p-4 rounded-xl bg-[#16121b] border border-purple-900/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-cinzel font-bold text-amber-200 border-b border-purple-900/30 pb-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Delivery Chamber</span>
              </div>
              <div>
                <span className="text-purple-300/60 block text-[10px]">Recipient</span>
                <span className="font-semibold text-amber-100">{activeOrder.customer.fullName}</span>
              </div>
              <div>
                <span className="text-purple-300/60 block text-[10px]">Contact</span>
                <span className="font-mono text-purple-200">{activeOrder.customer.phoneNumber}</span>
              </div>
              <div>
                <span className="text-purple-300/60 block text-[10px]">Address</span>
                <span className="text-purple-200">{activeOrder.customer.dormitoryAddress}</span>
              </div>
              {activeOrder.customer.deliveryNotes && (
                <div>
                  <span className="text-purple-300/60 block text-[10px]">Owl Notes</span>
                  <span className="text-amber-200/80 italic">&ldquo;{activeOrder.customer.deliveryNotes}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Items & Payment Summary */}
            <div className="p-4 rounded-xl bg-[#16121b] border border-purple-900/40 space-y-2 text-xs">
              <div className="flex items-center justify-between font-cinzel font-bold text-amber-200 border-b border-purple-900/30 pb-1">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Potion Order Breakdown</span>
                </div>
                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-purple-900/50 text-amber-300 border border-purple-800">
                  {activeOrder.paymentMethod}
                </span>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {activeOrder.items.map((ci) => (
                  <div key={ci.item.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-purple-200">
                      {ci.item.name}{" "}
                      <span className="text-amber-400/80 font-mono">× {ci.quantity}</span>
                    </span>
                    <span className="font-mono font-medium text-amber-300">
                      ₹{ci.item.price * ci.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-purple-900/30 flex justify-between items-center text-xs font-bold text-amber-200">
                <span>Total Amount Paid</span>
                <span className="font-mono text-sm text-amber-300">
                  ₹{activeOrder.total}
                </span>
              </div>
            </div>
          </div>

          {/* Order Event Timeline */}
          {activeOrder.history && activeOrder.history.length > 0 && (
            <div className="p-4 rounded-xl bg-[#0d0b0e] border border-purple-900/40 space-y-2 text-xs">
              <span className="font-cinzel text-xs font-bold text-amber-300/80 block pb-1 border-b border-purple-900/30">
                Marauder&apos;s Dispatch Log
              </span>
              <div className="space-y-2 pt-1">
                {activeOrder.history.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="font-mono text-purple-400/70 shrink-0 min-w-[65px]">
                      {ev.timestamp}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-200 mr-1.5">{ev.status}:</span>
                      <span className="text-purple-300/80">{ev.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#16121b] border-t border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {isCloudSyncActive
                ? "Live Supabase Cloud Sync Active"
                : "Live Multi-Tab Broadcast Active"}
            </span>
          </div>

          <button
            onClick={() => setIsTrackerOpen(false)}
            className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-colors"
          >
            Return to Great Hall Menu
          </button>
        </div>
      </div>
    </div>
  );
}
