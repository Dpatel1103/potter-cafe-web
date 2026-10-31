"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useOrder } from "@/context/OrderContext";
import {
  Sparkles,
  ShoppingBag,
  Volume2,
  VolumeX,
  ShieldCheck,
  Compass,
  Clock,
  Layers,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const {
    cartCount,
    cartTotal,
    setIsCartOpen,
    activeOrder,
    setIsTrackerOpen,
    orders,
    soundEnabled,
    toggleSound,
  } = useOrder();

  const isAdmin = pathname.startsWith("/admin");
  const pendingOrdersCount = orders.filter((o) => o.status === "Placed").length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#0d0b0e]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Crest */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50 group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all bg-[#0d0b0e] shrink-0 shadow-md">
            <Image
              src="/logo.png"
              alt="Espresso Patronum Logo"
              fill
              sizes="48px"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel-dec font-bold text-lg sm:text-xl tracking-wider text-amber-200 group-hover:text-amber-100 transition-colors">
                ESPRESSO PATRONUM
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-semibold tracking-widest text-amber-400/90 bg-amber-500/10 border border-amber-500/30 rounded-full">
                Diagon Alley
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 font-sans tracking-wide">
              Purveyors of Fine Artisan Brews & Glowing Potions
            </p>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Effect Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute magical sounds" : "Enable magical sounds"}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-purple-900/60 bg-[#16121b] text-purple-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 text-xs"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-purple-400" />
                <span className="hidden lg:inline">Audio Off</span>
              </>
            )}
          </button>

          {/* Active Order Pill Trigger */}
          {activeOrder && (
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 transition-all text-xs font-medium animate-pulse"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Track</span>
              <span className="font-mono text-emerald-200">#{activeOrder.id}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                {activeOrder.status}
              </span>
            </button>
          )}

          {/* Switch Role View: Storefront vs Admin */}
          {isAdmin ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-[#16121b] text-amber-300 hover:bg-amber-500/10 text-xs font-medium transition-colors"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Great Hall Menu</span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/80 bg-[#16121b] text-purple-300 hover:border-amber-500/50 hover:text-amber-300 text-xs font-medium transition-colors relative"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Staff / Admin</span>
              {pendingOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-black animate-bounce">
                  {pendingOrdersCount}
                </span>
              )}
            </Link>
          )}

          {/* Cart Button */}
          {!isAdmin && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-[#0d0b0e] hover:from-amber-500 hover:to-amber-400 font-semibold text-xs tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-[#0d0b0e]" />
              <span className="hidden sm:inline">Cauldron</span>
              {cartCount > 0 && (
                <span className="bg-[#0d0b0e] text-amber-300 text-[11px] font-bold px-1.5 py-0.2 rounded-full border border-amber-400/40">
                  {cartCount}
                </span>
              )}
              {cartTotal > 0 && (
                <span className="hidden md:inline font-mono font-bold text-amber-950">
                  ₹{cartTotal}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
