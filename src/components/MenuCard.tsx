"use client";

import React from "react";
import { MenuItem } from "@/types";
import { useOrder } from "@/context/OrderContext";
import {
  Coffee,
  Sparkles,
  Flame,
  Leaf,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  PackageX,
  Hourglass,
} from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const { cart, addToCart, updateCartQuantity } = useOrder();

  const cartItem = cart.find((ci) => ci.item.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Icon selector based on potion / brew category
  const renderIcon = () => {
    switch (item.iconType) {
      case "potion":
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "coffee":
        return <Coffee className="w-5 h-5 text-amber-500" />;
      case "flame":
        return <Flame className="w-5 h-5 text-red-400" />;
      case "leaf":
        return <Leaf className="w-5 h-5 text-lime-400" />;
      case "sparkles":
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case "cake":
      default:
        return <Coffee className="w-5 h-5 text-amber-300" />;
    }
  };

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 ${
        item.inStock
          ? "bg-[#16121b]/95 border-amber-500/20 hover:border-amber-500/45 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] hover:-translate-y-1"
          : "bg-[#120e17]/80 border-red-500/20 opacity-70 cursor-not-allowed"
      }`}
    >
      {/* Decorative Corner Ornaments */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-amber-500/30 group-hover:border-amber-400 transition-colors pointer-events-none" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-amber-500/30 group-hover:border-amber-400 transition-colors pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-amber-500/30 group-hover:border-amber-400 transition-colors pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-amber-500/30 group-hover:border-amber-400 transition-colors pointer-events-none" />

      <div>
        {/* Top Badges & Stock Indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.badge && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {item.badge}
              </span>
            )}
            {item.brewTimeMinutes && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-purple-900/30 text-purple-300 border border-purple-800/40">
                <Hourglass className="w-2.5 h-2.5" />
                {item.brewTimeMinutes}m
              </span>
            )}
          </div>

          {/* Stock Status Badge */}
          {item.inStock ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              In Stock
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30">
              <PackageX className="w-3 h-3 text-red-400" />
              Sold Out
            </span>
          )}
        </div>

        {/* Title & Icon Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2.5 rounded-lg bg-[#0d0b0e] border border-amber-500/20 group-hover:border-amber-500/50 group-hover:scale-105 transition-all shadow-inner">
            {renderIcon()}
          </div>
          <div>
            <h3 className="font-cinzel text-lg font-bold text-amber-100 group-hover:text-amber-300 transition-colors leading-snug">
              {item.name}
            </h3>
            <span className="text-[11px] tracking-wider uppercase text-purple-300/60 font-medium">
              {item.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-purple-200/80 leading-relaxed mb-3">
          {item.description}
        </p>

        {/* Lore Quote */}
        {item.lore && (
          <div className="p-2.5 rounded-md bg-[#0d0b0e]/80 border-l-2 border-amber-500/50 mb-4 text-[11px] text-amber-200/70 italic font-serif leading-relaxed">
            &ldquo;{item.lore}&rdquo;
          </div>
        )}
      </div>

      {/* Footer: Price & Add to Cart Controls */}
      <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between gap-3 mt-auto">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-purple-300/50 block">Price</span>
          <span className="text-xl font-bold font-mono text-amber-300">
            ₹{item.price}
          </span>
        </div>

        <div>
          {!item.inStock ? (
            <button
              disabled
              className="px-3.5 py-1.5 rounded-lg bg-amber-950/40 text-amber-400 text-xs font-semibold cursor-not-allowed border border-amber-500/40 flex items-center gap-1.5 shadow-sm"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Sold Out</span>
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-2 bg-[#0d0b0e] border border-amber-500/40 rounded-lg p-1">
              <button
                onClick={() => updateCartQuantity(item.id, quantity - 1)}
                className="w-7 h-7 rounded bg-[#16121b] text-amber-300 hover:bg-amber-500 hover:text-black flex items-center justify-center transition-colors"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs font-bold px-2 text-amber-100 min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => updateCartQuantity(item.id, quantity + 1)}
                className="w-7 h-7 rounded bg-[#16121b] text-amber-300 hover:bg-amber-500 hover:text-black flex items-center justify-center transition-colors"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(item)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0d0b0e] text-xs font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cauldron</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
