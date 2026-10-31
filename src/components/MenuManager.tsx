"use client";

import React, { useState, useMemo } from "react";
import { useCafe } from "@/context/CafeContext";
import { MenuItem, MenuCategory } from "@/types/cafe";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle,
  PackageX,
  X,
  Sparkles,
  Check,
  AlertTriangle,
  Flame,
  Coffee,
  Cake,
} from "lucide-react";

export function MenuManager() {
  const {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleStockStatus,
    restockAllItems,
  } = useCafe();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | MenuCategory>("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    category: MenuCategory;
    description: string;
    price: string;
    inStock: boolean;
    lore: string;
    badge: string;
  }>({
    name: "",
    category: "Signature Potions",
    description: "",
    price: "",
    inStock: true,
    lore: "",
    badge: "",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Categories list
  const categories: ("All" | MenuCategory)[] = [
    "All",
    "Signature Potions",
    "Artisan Brews",
    "Magical Bakes",
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Signature Potions",
      description: "",
      price: "",
      inStock: true,
      lore: "",
      badge: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      price: String(item.price),
      inStock: item.inStock,
      lore: item.lore || "",
      badge: item.badge || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = "Item name is required.";
    }
    const numPrice = Number(formData.price);
    if (!formData.price.trim() || isNaN(numPrice) || numPrice <= 0) {
      errors.price = "Enter a valid positive price in ₹.";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const priceNum = Math.round(Number(formData.price));

    if (editingItem) {
      // Update existing item
      updateMenuItem(editingItem.id, {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: priceNum,
        inStock: formData.inStock,
        lore: formData.lore.trim() || undefined,
        badge: formData.badge.trim() || undefined,
      });
    } else {
      // Add new item
      addMenuItem({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: priceNum,
        inStock: formData.inStock,
        lore: formData.lore.trim() || undefined,
        badge: formData.badge.trim() || undefined,
        iconType:
          formData.category === "Signature Potions"
            ? "potion"
            : formData.category === "Artisan Brews"
            ? "coffee"
            : "cake",
      });
    }

    setIsModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMenuItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="p-4 rounded-2xl bg-[#16121b] border border-amber-500/20 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells, brews, pastries..."
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

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={restockAllItems}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Mark all items as In Stock"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Restock All</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-[#0d0b0e] text-xs font-cinzel font-bold tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#0d0b0e]" />
            <span>Add New Spell / Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const count =
            cat === "All"
              ? menuItems.length
              : menuItems.filter((m) => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg font-cinzel font-bold tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-amber-500/20 border border-amber-400 text-amber-200 shadow-sm"
                  : "bg-[#16121b] border border-purple-900/40 text-purple-300/70 hover:text-white"
              }`}
            >
              <span>{cat}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0d0b0e] text-amber-300/80 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Menu Items Table */}
      <div className="rounded-2xl bg-[#16121b] border border-amber-500/20 overflow-hidden shadow-xl">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 p-8 space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-purple-400/50 animate-pulse" />
            <h3 className="font-cinzel text-base font-bold text-amber-200">
              No Menu Items Found
            </h3>
            <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
              No item matched your category or search query. Click &ldquo;Add New Spell / Item&rdquo; to conjure one!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-purple-200">
              <thead className="bg-[#0d0b0e] text-[11px] font-cinzel font-bold text-amber-300/80 uppercase tracking-wider border-b border-purple-900/40">
                <tr>
                  <th className="px-5 py-4">Item & Lore</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Price (₹)</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">In-Stock Toggle</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30 font-sans">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-purple-950/20 transition-colors"
                  >
                    {/* Name & Lore */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-cinzel font-bold text-sm text-amber-100">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-purple-300/70 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-purple-900/40 text-purple-300 border border-purple-800">
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-300 text-sm whitespace-nowrap">
                      ₹{item.price}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {item.inStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[11px] font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                          <PackageX className="w-3.5 h-3.5 text-red-400" />
                          Sold Out
                        </span>
                      )}
                    </td>

                    {/* Instant Stock Toggle Switch */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleStockStatus(item.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                          item.inStock ? "bg-emerald-600" : "bg-zinc-700"
                        }`}
                        title={item.inStock ? "Click to mark Sold Out" : "Click to mark In Stock"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.inStock ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Action Controls (Edit & Delete) */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-amber-500/20 text-purple-300 hover:text-amber-300 border border-purple-800 hover:border-amber-500/40 transition-colors"
                          title="Edit Spell / Item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-500/30 hover:border-red-400 transition-colors"
                          title="Delete Spell / Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-lg bg-[#120e17] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-[#f3effa] z-10">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#16121b] border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-amber-100">
                    {editingItem ? "Reforge Spell / Item" : "Conjure New Spell / Item"}
                  </h3>
                  <p className="text-[11px] text-purple-300/70">
                    {editingItem ? `Updating #${editingItem.id}` : "Adds directly to the Great Hall Menu"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-purple-300/70 hover:text-amber-300 hover:bg-purple-900/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-[11px] font-medium text-purple-200/90 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Felix Felicis Gold Elixir"
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-[#0d0b0e] border text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors ${
                    formErrors.name ? "border-red-500" : "border-purple-900/60"
                  }`}
                />
                {formErrors.name && (
                  <span className="text-[10px] text-red-400 mt-0.5 block">
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-medium text-purple-200/90 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as MenuCategory })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d0b0e] border border-purple-900/60 text-amber-100 focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Signature Potions">Signature Potions</option>
                    <option value="Artisan Brews">Artisan Brews</option>
                    <option value="Magical Bakes">Magical Bakes</option>
                  </select>
                </div>

                {/* Price (INR ₹) */}
                <div>
                  <label className="block text-[11px] font-medium text-purple-200/90 mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 280"
                    className={`w-full px-3 py-2 text-xs rounded-xl bg-[#0d0b0e] border font-mono text-amber-300 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors ${
                      formErrors.price ? "border-red-500" : "border-purple-900/60"
                    }`}
                  />
                  {formErrors.price && (
                    <span className="text-[10px] text-red-400 mt-0.5 block">
                      {formErrors.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-medium text-purple-200/90 mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, brewing process, and flavor profile..."
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-[#0d0b0e] border text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors resize-none ${
                    formErrors.description ? "border-red-500" : "border-purple-900/60"
                  }`}
                />
                {formErrors.description && (
                  <span className="text-[10px] text-red-400 mt-0.5 block">
                    {formErrors.description}
                  </span>
                )}
              </div>

              {/* Lore & Badge Optional Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-purple-200/90 mb-1">
                    Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. House Favorite"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d0b0e] border border-purple-900/60 text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-purple-200/90 mb-1">
                    Wizarding Lore Quote (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.lore}
                    onChange={(e) => setFormData({ ...formData, lore: e.target.value })}
                    placeholder="e.g. Brewed secretly in cellar barrels..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d0b0e] border border-purple-900/60 text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* In-Stock Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d0b0e] border border-purple-900/50">
                <div>
                  <span className="text-xs font-semibold text-amber-200 block">
                    Inventory Stock Availability
                  </span>
                  <span className="text-[10px] text-purple-300/60">
                    If toggled off, customers cannot add this item to their cauldron.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.inStock ? "bg-emerald-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.inStock ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-purple-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-[#0d0b0e] text-xs font-cinzel font-bold tracking-wider hover:from-amber-500 hover:to-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95"
                >
                  {editingItem ? "Save Spell Changes" : "Conjure Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
          <div
            onClick={() => setItemToDelete(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md bg-[#120e17] border border-red-500/40 rounded-2xl p-6 shadow-2xl text-[#f3effa] z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-red-200">
                  Vanish Spell from Menu?
                </h3>
                <p className="text-xs text-purple-300/70">
                  This action cannot be undone by simple counter-curse.
                </p>
              </div>
            </div>

            <p className="text-xs text-purple-200/90 leading-relaxed bg-[#0d0b0e] p-3 rounded-xl border border-purple-900/40">
              Are you certain you wish to delete <strong className="text-amber-200">&ldquo;{itemToDelete.name}&rdquo;</strong> (₹{itemToDelete.price}) from the Great Hall Menu?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-purple-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-cinzel tracking-wider transition-colors shadow-lg active:scale-95"
              >
                Yes, Vanish Spell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
