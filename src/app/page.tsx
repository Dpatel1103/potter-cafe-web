"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useOrder } from "@/context/OrderContext";
import { MenuCategory } from "@/types";
import { Navbar } from "@/components/Navbar";
import { MenuCard } from "@/components/MenuCard";
import { CartDrawer } from "@/components/CartDrawer";
import { OrderTracker } from "@/components/OrderTracker";
import {
  Sparkles,
  Search,
  ShoppingBag,
  Clock,
  Coffee,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Feather,
  Zap,
} from "lucide-react";

export default function StorefrontPage() {
  const {
    menuItems,
    activeOrder,
    cartCount,
    cartTotal,
    setIsCartOpen,
    setIsTrackerOpen,
  } = useOrder();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | MenuCategory>("All");

  const categories: ("All" | MenuCategory)[] = [
    "All",
    "Signature Potions",
    "Artisan Brews",
    "Magical Bakes",
  ];

  // Filtered menu items based on category and search query
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Boolean(item.description) && item.description!.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Boolean(item.lore) && item.lore!.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Boolean(item.badge) && item.badge!.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0b0e] text-[#f3effa]">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Active Order Glowing Bar (if customer has active order) */}
        {activeOrder && (
          <section className="bg-gradient-to-r from-emerald-950/80 via-purple-950/90 to-amber-950/80 border-b border-emerald-500/30 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="font-semibold text-emerald-300">
                  Active Dispatch #{activeOrder.id}:
                </span>
                <span className="text-purple-200">
                  Status: <strong className="text-amber-300 uppercase">{activeOrder.status}</strong>
                  {(activeOrder.courierName || activeOrder.assignedCourier) && (
                    <span className="text-purple-300/80 ml-1.5 hidden md:inline">
                      (Courier: {activeOrder.courierName || activeOrder.assignedCourier})
                    </span>
                  )}
                </span>
              </div>

              <button
                onClick={() => setIsTrackerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-semibold transition-all hover:scale-105"
              >
                <span>View Live Marauder&apos;s Tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-16 overflow-hidden">
          {/* Subtle Ambient Radial Backlights */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />
          <div className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-purple-900/15 blur-[120px] pointer-events-none rounded-full" />

          <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
            {/* Centerpiece Crest Emblem */}
            <div className="flex justify-center">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/40 via-cyan-500/30 to-amber-400/50 blur-lg opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse" />
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-b from-amber-400/50 via-purple-900/40 to-amber-600/30 border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-[#0d0b0e]">
                    <Image
                      src="/logo.png"
                      alt="Espresso Patronum Official Crest"
                      fill
                      sizes="(max-width: 640px) 128px, 160px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Diagon Alley • Established 1890</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-cinzel-dec font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 drop-shadow-sm leading-tight">
              ESPRESSO PATRONUM
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-purple-200/80 max-w-2xl mx-auto font-sans leading-relaxed">
              Step into the apothecary coffee house of the wizarding world. Enjoy 18-hour cold steeped butterscotch, luck-boosting golden elixirs, and dragon-roasted espresso delivered straight to your chamber by faithful owl post.
            </p>

            {/* Quick Lore Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-4 text-xs">
              <div className="p-3 rounded-xl bg-[#16121b]/90 border border-purple-900/50 flex items-center justify-center gap-2 text-purple-200">
                <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100% Single Origin</span>
              </div>
              <div className="p-3 rounded-xl bg-[#16121b]/90 border border-purple-900/50 flex items-center justify-center gap-2 text-purple-200">
                <Feather className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Live Owl Tracking</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#16121b]/90 border border-purple-900/50 flex items-center justify-center gap-2 text-purple-200">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Instant UPI & COD</span>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Controls: Search & Category Tabs */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 shadow-lg">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-[#0d0b0e] shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105"
                      : "bg-[#0d0b0e] text-purple-300/80 hover:text-amber-200 hover:border-purple-700 border border-purple-900/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search potions, brews..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#0d0b0e] border border-purple-900/60 text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Menu Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-[#16121b]/60 border border-purple-900/40 p-8 space-y-3">
              <Sparkles className="w-10 h-10 mx-auto text-purple-400/60 animate-pulse" />
              <h3 className="font-cinzel text-lg font-bold text-amber-200">
                No Magical Concoctions Found
              </h3>
              <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
                No potion or brew matched &ldquo;{searchQuery}&rdquo;. Try another spell or clear your search query.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom-Right Cart Drawer Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCartOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-[#0d0b0e] font-cinzel font-bold text-sm tracking-wider shadow-[0_10px_25px_rgba(245,158,11,0.45)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/50"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-[#0d0b0e]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-[#0d0b0e] text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-400">
                {cartCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">View Cauldron</span>
          {cartTotal > 0 && (
            <span className="font-mono font-black text-amber-950 bg-amber-300/50 px-2 py-0.5 rounded-full text-xs">
              ₹{cartTotal}
            </span>
          )}
        </button>
      </div>

      {/* Slide-Over Cart Drawer */}
      <CartDrawer />

      {/* 5-Step Live Order Tracker Modal */}
      <OrderTracker />

      {/* Footer */}
      <footer className="border-t border-purple-900/40 bg-[#0a080c] py-8 px-4 sm:px-6 lg:px-8 text-xs text-purple-300/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="font-cinzel font-bold text-amber-200 block text-sm">
              Espresso Patronum
            </span>
            <span>Diagon Alley • Ministry of Magic License #4928-E</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Open Sunrise to Midnight (Wizarding Standard Time)</span>
            <span>•</span>
            <span>Live Multi-Tab Reactive Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
