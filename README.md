# ☕ Espresso Patronum — The Wizarding Cafe of Diagon Alley

> *"Expecto Caffeine! Purveyors of fine artisan brews, glowing signature potions, and magical pastries."*

A modern, responsive full-stack web application built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**, featuring a reactive real-time database architecture powered by **Supabase Realtime**, procedural Web Audio API sound synthesis, dual customer/admin roles, dynamic UPI QR checkout, and live 5-step order tracking.

---

## ⚡ Key Highlights & Features

### 1. Dual-Interface Architecture
- **Customer Portal (`/`)**: 
  - Categorized apothecary menu board (*Signature Potions*, *Artisan Brews*, *Magical Bakes*).
  - Search by potion name, ingredients, lore, and magical attributes.
  - Interactive "+ Add to Cauldron" buttons that dynamically validate inventory stock.
  - Slide-over **Cart Drawer** with item breakdown, quantity steppers, Ministry tax (5%), and Owl Post fees.
  - Delivery information form (Full Name, Owl Contact, Dormitory Chamber, Owl Delivery Notes).
  - Payment options: **Instant UPI** with dynamic mock QR code & copyable UPI ID (`espresso.patronum@magicbank`) vs **Owl Cash on Delivery (COD)**.
  - **Live Marauder's Order Tracker** (5-step visual stepper: *Placed* → *Accepted* → *Brewing* → *Out for Delivery* → *Delivered*).
- **Staff / Admin Portal (`/admin`)**:
  - **Ministry Operations Deck** with real-time KPI cards (*Total Revenue ₹*, *Pending Orders*, *Active Brews*, *Out for Delivery*).
  - **Live Orders Queue** with status filters and action triggers:
    - `[✓ Accept Order]`: Acknowledges ticket and updates customer view to *Accepted* with dynamic alert.
    - `[🔥 Start Brewing]`: Begins preparation in the cauldrons.
    - `[🦉 Assign Delivery Partner]`: Opens courier modal to dispatch *Hedwig*, *Errol*, *Neville Longbottom*, or *Floo Powder Express*.
    - `[★ Mark Delivered]`: Completes delivery lifecycle and updates vault revenue.
    - `[⚡ Simulate Incoming Order]`: Spawns instant realistic customer orders for rapid demonstration.
  - **Apothecary Inventory Manager**: Real-time stock toggle (*In Stock* vs *Sold Out*) that instantly disables adding sold-out items across all client tabs.

---

### 2. Supabase Realtime Database & Multi-Tab Synchronization
- **Postgres Realtime Replication**: Subscribed via `postgres_changes` on the `orders` and `menu_items` tables.
- **Custom Hooks**:
  - `src/hooks/useRealtimeOrders.ts`: Automatically listens to new incoming orders, state transitions (`Accepted`, `Out for Delivery`, `Delivered`), and courier assignments.
  - `src/hooks/useRealtimeMenu.ts`: Listens to stock availability changes so toggling an item out of stock in admin instantly updates client menu cards and cart validation.
- **Zero-Config Hybrid Fallback**:
  - When Supabase credentials are provided in `.env.local`, the application streams live changes via Supabase WebSocket channels.
  - If running offline or without credentials, it falls back seamlessly to the browser's `BroadcastChannel` + `localStorage` pipeline without crashing!

---

### 3. Visual Aesthetic & Design System
- **Dark Wizarding Apothecary Palette**:
  - Obsidian Base: `#0d0b0e` & `#0a080c`
  - Violet-Tinted Slate Cards: `#16121b` (hover: `#221a2a`)
  - Amber Gold Highlights: `#f59e0b`, `#d97706`, `#fbbf24`
  - Emerald Accents: `#10b981`, `#059669`
- **Typography**: Google Fonts **Cinzel Decorative** & **Cinzel** for wizarding headers, paired with **Plus Jakarta Sans** for forms and body copy.
- **Ambient Stardust Particle Canvas**: Floating golden and emerald dust particles running on an ultra-lightweight canvas.
- **Procedural Web Audio API Engine**: Crystal-clear native synthesized sound effects (Wand clicks, Add-to-cart harp, Order-placed celestial chord, Staff chime, Delivery fanfare) with mute/unmute control.

---

## 🛠️ Environment Configuration Setup

1. Copy the example environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Populate `.env.local` with your Supabase credentials:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_APP_NAME="Espresso Patronum"
   NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
   ```
3. **Secret Security**: `.gitignore` is pre-configured with `.env*` and `!.env.example` to ensure secret keys are never committed to version control.

---

## 🗄️ Supabase Database Schema & Migration

The complete SQL migration script is located at:
📁 **[`supabase/schema.sql`](file:///d:/DESKTOP/Magical%20Cafe/potter-cafe-web/supabase/schema.sql)**

### To apply the migration:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Click **New Query**, paste the contents of `supabase/schema.sql`, and click **Run**.
3. This creates:
   - `menu_items` table with initial seed data (12 Harry Potter items).
   - `orders` table with JSONB items and status constraints.
   - Row Level Security (RLS) policies allowing public ordering and staff updates.
   - Realtime publication replication on `supabase_realtime`.

---

## 📁 Project Architecture & File Structure

```
potter-cafe-web/
├── .env.example               # Environment variables template
├── supabase/
│   └── schema.sql             # Complete Supabase PostgreSQL schema with RLS & Realtime
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx       # Staff / Admin Operations Deck
│   │   ├── globals.css        # Dark apothecary design system & tokens
│   │   ├── layout.tsx         # Root layout with fonts, OrderProvider & canvas
│   │   └── page.tsx           # Client-facing Great Hall Storefront
│   ├── components/
│   │   ├── AssignCourierModal.tsx # Courier dispatch modal (Hedwig, Errol, Neville, Floo)
│   │   ├── CartDrawer.tsx     # Slide-over cart, delivery info & UPI/COD payment
│   │   ├── MagicCanvas.tsx    # Ambient golden stardust canvas
│   │   ├── MenuCard.tsx       # Potion & brew card with stock handling
│   │   ├── Navbar.tsx         # Responsive header with live order & role links
│   │   ├── OrderTracker.tsx   # 5-step stepper with dynamic status alerts
│   │   └── SoundEffects.ts    # Procedural Web Audio API sound synthesizer
│   ├── context/
│   │   └── OrderContext.tsx   # Global state & Supabase/BroadcastChannel sync engine
│   ├── data/
│   │   ├── couriers.ts        # Typed courier list & speeds
│   │   └── menu.ts            # 12 typed signature potions, brews & bakes (INR ₹)
│   ├── hooks/
│   │   ├── useRealtimeMenu.ts   # Custom hook for Realtime menu_items changes
│   │   └── useRealtimeOrders.ts # Custom hook for Realtime orders queue & tracking
│   ├── lib/
│   │   └── supabaseClient.ts  # Browser Supabase client & typed database helpers
│   └── types/
│       └── index.ts           # Core TypeScript & Supabase database types
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Visit:
- Customer Storefront: **[http://localhost:3000](http://localhost:3000)**
- Staff / Admin Dashboard: **[http://localhost:3000/admin](http://localhost:3000/admin)**

### 3. Production Build
```bash
npm run build
npm run start
```
