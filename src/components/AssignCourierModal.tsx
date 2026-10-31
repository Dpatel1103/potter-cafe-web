"use client";

import React from "react";
import { COURIERS } from "@/data/couriers";
import { Order } from "@/types";
import { X, Feather, Send, Sparkles } from "lucide-react";

interface AssignCourierModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (orderId: string | number, courierName: string) => void;
}

export function AssignCourierModal({
  order,
  isOpen,
  onClose,
  onAssign,
}: AssignCourierModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg bg-[#120e17] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-[#f3effa] z-10">
        {/* Header */}
        <div className="px-6 py-4 bg-[#16121b] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-amber-100">
                Dispatch Courier • Order #{order.id}
              </h3>
              <p className="text-[11px] text-purple-300/70">
                Destination: {order.customer.address || (order.customer as unknown as { dormitoryAddress?: string }).dormitoryAddress}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-300/70 hover:text-amber-300 hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Courier List */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-purple-300/80 mb-2">
            Select an authorized aerial courier or Floo network route to dispatch this order:
          </p>

          <div className="space-y-3">
            {COURIERS.map((courier) => (
              <div
                key={courier.id}
                className="p-4 rounded-xl bg-[#16121b] border border-purple-900/40 hover:border-amber-500/40 hover:bg-[#1a1522] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0d0b0e] border border-amber-500/30 flex items-center justify-center text-lg text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    {courier.avatarIcon === "owl"
                      ? "🦉"
                      : courier.avatarIcon === "feather"
                      ? "🪶"
                      : courier.avatarIcon === "broom"
                      ? "🧹"
                      : "🔥"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-cinzel text-sm font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                        {courier.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
                        {courier.speed}
                      </span>
                    </div>
                    <span className="text-[11px] text-purple-300/60 block">
                      {courier.title}
                    </span>
                    <p className="text-[11px] text-purple-200/70 mt-1 leading-snug">
                      {courier.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAssign(order.id, courier.name);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-[#0d0b0e] text-xs font-bold hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Assign Courier</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#16121b] border-t border-purple-900/40 text-[11px] text-purple-400/60 flex items-center justify-between">
          <span>Courier dispatch marks order as &ldquo;Out for Delivery&rdquo;</span>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-amber-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
