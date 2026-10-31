"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCafe } from "@/context/CafeContext";
import { PaymentMethod, CustomerDetails } from "@/types/cafe";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  QrCode,
  Banknote,
  Send,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    deliveryFee,
    finalTotal,
    placeOrder,
  } = useCafe();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [deliveryInfo, setDeliveryInfo] = useState<CustomerDetails>({
    fullName: "Harry Potter",
    phone: "9876543210",
    address: "Gryffindor Tower, Boy's Dormitory, Hogwarts Castle",
    deliveryNotes: "Leave parcel outside the portrait of the Fat Lady.",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  // Check if any items in cart became sold out
  const soldOutCartItems = cart.filter((ci) => !ci.item.inStock);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!deliveryInfo.fullName.trim()) {
      errs.fullName = "Full Name is required";
    }

    const cleanPhone = deliveryInfo.phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = "Enter a valid 10-digit phone number";
    }

    if (!deliveryInfo.address.trim()) {
      errs.address = "Delivery address is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) return;
    if (soldOutCartItems.length > 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      placeOrder({
        customer: {
          fullName: deliveryInfo.fullName.trim(),
          phone: deliveryInfo.phone.trim(),
          address: deliveryInfo.address.trim(),
          deliveryNotes: deliveryInfo.deliveryNotes?.trim() || undefined,
        },
        paymentMethod,
      });
      setIsSubmitting(false);
    }, 350);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("espresso.patronum@magicbank");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Darkened Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#120e17] border-l border-amber-500/20 shadow-2xl flex flex-col justify-between text-[#f3effa]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-purple-900/40 flex items-center justify-between bg-[#16121b]">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-500/40 bg-[#0d0b0e] shrink-0 shadow-md">
                <Image
                  src="/logo.png"
                  alt="Espresso Patronum Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-cinzel text-base font-bold text-amber-100">
                  Enchanted Cauldron
                </h2>
                <span className="text-[11px] text-purple-300/60 font-sans">
                  {cart.length} unique brew{cart.length === 1 ? "" : "s"} selected
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-purple-300/70 hover:text-amber-300 hover:bg-purple-900/30 transition-colors"
              title="Close Cauldron"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sold Out Warning Banner if any cart items are out of stock */}
          {soldOutCartItems.length > 0 && (
            <div className="px-5 py-2.5 bg-red-950/80 border-b border-red-500/40 flex items-center gap-2 text-xs text-red-200">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <span>Some items are sold out. Remove them to proceed to checkout.</span>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-950/50 border border-purple-900/60 flex items-center justify-center text-purple-400/60">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-amber-200">
                    Your Cauldron is Empty
                  </h3>
                  <p className="text-xs text-purple-300/60 max-w-xs mx-auto mt-1">
                    Select artisan brews, potions, or bakes from our Great Hall menu to begin.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-purple-300/60 pb-1">
                  <span>Selected Concoctions</span>
                  <button
                    onClick={clearCart}
                    className="text-red-400/80 hover:text-red-300 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                </div>

                {cart.map(({ item, quantity }) => {
                  const isSoldOut = !item.inStock;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isSoldOut
                          ? "bg-red-950/20 border-red-500/40"
                          : "bg-[#16121b] border-purple-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-cinzel text-xs font-bold text-amber-100">
                              {item.name}
                            </h4>
                            {isSoldOut && (
                              <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.2 rounded border border-red-500/30">
                                Sold Out
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-amber-400/90">
                            ₹{item.price} each
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-[#0d0b0e] border border-amber-500/30 rounded px-1 py-0.5">
                          <button
                            onClick={() => updateCartQuantity(item.id, quantity - 1)}
                            className="p-1 text-purple-300 hover:text-amber-300 transition-colors cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold px-1.5 min-w-[16px] text-center text-amber-200">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, quantity + 1)}
                            disabled={isSoldOut}
                            className={`p-1 text-purple-300 transition-colors cursor-pointer ${
                              isSoldOut ? "opacity-30 cursor-not-allowed" : "hover:text-amber-300"
                            }`}
                            title="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-purple-400/50 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-900/20 text-[11px]">
                        <span className="text-purple-300/50">Item Total:</span>
                        <span className="font-mono font-bold text-amber-300">
                          ₹{item.price * quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cart.length > 0 && (
              <>
                {/* Delivery Information Form */}
                <div className="p-4 rounded-xl bg-[#16121b] border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-amber-200 pb-1 border-b border-purple-900/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Delivery Coordinates & Recipient</span>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-medium text-purple-200/80 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.fullName}
                      onChange={(e) =>
                        setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value })
                      }
                      placeholder="e.g. Harry Potter"
                      className={`w-full px-3 py-1.5 text-xs rounded-md bg-[#0d0b0e] border text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors ${
                        errors.fullName ? "border-red-500" : "border-purple-900/60"
                      }`}
                    />
                    {errors.fullName && (
                      <span className="text-[10px] text-red-400 mt-0.5 block">
                        {errors.fullName}
                      </span>
                    )}
                  </div>

                  {/* 10-digit Phone Number */}
                  <div>
                    <label className="block text-[11px] font-medium text-purple-200/80 mb-1">
                      10-Digit Phone Number *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={deliveryInfo.phone}
                      onChange={(e) =>
                        setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })
                      }
                      placeholder="e.g. 9876543210"
                      className={`w-full px-3 py-1.5 text-xs rounded-md bg-[#0d0b0e] border text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors ${
                        errors.phone ? "border-red-500" : "border-purple-900/60"
                      }`}
                    />
                    {errors.phone && (
                      <span className="text-[10px] text-red-400 mt-0.5 block">
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label className="block text-[11px] font-medium text-purple-200/80 mb-1">
                      Delivery Address / Dormitory Chamber *
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryInfo.address}
                      onChange={(e) =>
                        setDeliveryInfo({ ...deliveryInfo, address: e.target.value })
                      }
                      placeholder="e.g. Gryffindor Tower, 7th Floor Common Room"
                      className={`w-full px-3 py-1.5 text-xs rounded-md bg-[#0d0b0e] border text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors resize-none ${
                        errors.address ? "border-red-500" : "border-purple-900/60"
                      }`}
                    />
                    {errors.address && (
                      <span className="text-[10px] text-red-400 mt-0.5 block">
                        {errors.address}
                      </span>
                    )}
                  </div>

                  {/* Owl Delivery Notes */}
                  <div>
                    <label className="block text-[11px] font-medium text-purple-200/80 mb-1">
                      Owl Delivery Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.deliveryNotes || ""}
                      onChange={(e) =>
                        setDeliveryInfo({ ...deliveryInfo, deliveryNotes: e.target.value })
                      }
                      placeholder="e.g. Tap window ledge three times"
                      className="w-full px-3 py-1.5 text-xs rounded-md bg-[#0d0b0e] border border-purple-900/60 text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="p-4 rounded-xl bg-[#16121b] border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-cinzel font-bold text-amber-200 pb-1 border-b border-purple-900/30">
                    <span>Payment Method</span>
                    <span className="text-[10px] font-sans text-amber-400/80 font-normal">
                      Secure Wizarding Gateway
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        paymentMethod === "UPI"
                          ? "bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : "bg-[#0d0b0e] border-purple-900/50 text-purple-300/70 hover:border-purple-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold">Instant UPI</span>
                      </div>
                      <span className="text-[10px] text-purple-300/60">
                        Scan QR / Dynamic VPA
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        paymentMethod === "COD"
                          ? "bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : "bg-[#0d0b0e] border-purple-900/50 text-purple-300/70 hover:border-purple-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">Owl COD</span>
                      </div>
                      <span className="text-[10px] text-purple-300/60">
                        Pay Galleons upon arrival
                      </span>
                    </button>
                  </div>

                  {/* UPI Details & Dynamic QR Code Display */}
                  {paymentMethod === "UPI" && (
                    <div className="mt-3 p-3 rounded-lg bg-[#0d0b0e] border border-amber-500/30 flex flex-col items-center text-center space-y-2">
                      <div className="text-[11px] text-amber-200/90 font-medium">
                        Scan to Pay ₹{finalTotal} via GPay, PhonePe, or Paytm
                      </div>

                      {/* Mock Dynamic QR Code Vector */}
                      <div className="p-2 rounded-lg bg-white border-2 border-amber-400 shadow-md">
                        <svg
                          className="w-32 h-32"
                          viewBox="0 0 100 100"
                          fill="black"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {/* Corner Squares */}
                          <rect x="5" y="5" width="25" height="25" fill="#0d0b0e" />
                          <rect x="9" y="9" width="17" height="17" fill="white" />
                          <rect x="13" y="13" width="9" height="9" fill="#0d0b0e" />

                          <rect x="70" y="5" width="25" height="25" fill="#0d0b0e" />
                          <rect x="74" y="9" width="17" height="17" fill="white" />
                          <rect x="78" y="13" width="9" height="9" fill="#0d0b0e" />

                          <rect x="5" y="70" width="25" height="25" fill="#0d0b0e" />
                          <rect x="9" y="74" width="17" height="17" fill="white" />
                          <rect x="13" y="78" width="9" height="9" fill="#0d0b0e" />

                          {/* Data points */}
                          <rect x="35" y="10" width="6" height="6" fill="#0d0b0e" />
                          <rect x="45" y="10" width="6" height="6" fill="#0d0b0e" />
                          <rect x="55" y="10" width="6" height="6" fill="#0d0b0e" />

                          <rect x="35" y="25" width="6" height="12" fill="#0d0b0e" />
                          <rect x="45" y="25" width="10" height="6" fill="#0d0b0e" />
                          <rect x="60" y="25" width="6" height="6" fill="#0d0b0e" />

                          <rect x="10" y="40" width="15" height="6" fill="#0d0b0e" />
                          <rect x="35" y="40" width="8" height="8" fill="#d97706" />
                          <rect x="50" y="40" width="15" height="6" fill="#0d0b0e" />
                          <rect x="75" y="40" width="15" height="6" fill="#0d0b0e" />

                          <rect x="10" y="55" width="8" height="8" fill="#0d0b0e" />
                          <rect x="25" y="55" width="6" height="6" fill="#0d0b0e" />
                          <rect x="40" y="55" width="12" height="6" fill="#0d0b0e" />
                          <rect x="60" y="55" width="6" height="15" fill="#0d0b0e" />
                          <rect x="75" y="55" width="15" height="6" fill="#0d0b0e" />

                          <rect x="35" y="70" width="6" height="12" fill="#0d0b0e" />
                          <rect x="45" y="70" width="12" height="6" fill="#0d0b0e" />
                          <rect x="65" y="75" width="10" height="15" fill="#0d0b0e" />
                          <rect x="80" y="70" width="12" height="6" fill="#0d0b0e" />
                        </svg>
                      </div>

                      {/* VPA / UPI ID Field */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
                        <span>VPA: espresso.patronum@magicbank</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1 rounded bg-purple-900/40 text-amber-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy VPA"
                        >
                          {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "COD" && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
                      🦉 Cash or wizarding currency (₹{finalTotal}) will be collected by the assigned courier upon arrival at your chamber window.
                    </div>
                  )}
                </div>

                {/* Bill Breakdown Summary */}
                <div className="p-4 rounded-xl bg-[#0d0b0e] border border-purple-900/40 space-y-2 text-xs">
                  <div className="flex justify-between text-purple-300/70">
                    <span>Subtotal</span>
                    <span className="font-mono text-purple-200">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-purple-300/70">
                    <span>Owl Post Courier Fee</span>
                    <span className="font-mono text-purple-200">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-400 font-bold">FREE (Above ₹500)</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-purple-900/40 flex justify-between items-center text-sm font-bold text-amber-200">
                    <span className="font-cinzel">Total Amount</span>
                    <span className="font-mono text-lg text-amber-300">
                      ₹{finalTotal}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-purple-900/40 bg-[#16121b]">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || soldOutCartItems.length > 0}
                className={`w-full py-3 px-4 rounded-xl font-cinzel font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] ${
                  soldOutCartItems.length > 0
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                    : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-[#0d0b0e] hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] cursor-pointer"
                }`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Enchanting Ticket...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#0d0b0e]" />
                    <span>Cast Order & Dispatch Owl • ₹{finalTotal}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
