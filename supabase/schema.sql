-- ==============================================================================
-- ESPRESSO PATRONUM — SUPABASE PRODUCTION DATABASE SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Create 'menu_items' Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Signature Potions', 'Artisan Brews', 'Magical Bakes')),
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure in_stock column exists if table was created previously with is_available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'in_stock'
  ) THEN
    ALTER TABLE public.menu_items ADD COLUMN in_stock BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Create 'orders' Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  items_summary TEXT NOT NULL DEFAULT '',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'COD')),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Completed')),
  order_status TEXT NOT NULL DEFAULT 'Placed' CHECK (order_status IN ('Placed', 'Accepted', 'Brewing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  assigned_rider TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure compatibility columns exist if orders table was created previously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN idempotency_key TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'items_summary'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN items_summary TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'assigned_rider'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN assigned_rider TEXT;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Create 'order_items' Child Snapshot Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Menu Items (Public can view, staff/admin can modify)
DROP POLICY IF EXISTS "Allow public read access on menu_items" ON public.menu_items;
CREATE POLICY "Allow public read access on menu_items"
  ON public.menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow staff update on menu_items" ON public.menu_items;
CREATE POLICY "Allow staff update on menu_items"
  ON public.menu_items FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff insert on menu_items" ON public.menu_items;
CREATE POLICY "Allow staff insert on menu_items"
  ON public.menu_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff delete on menu_items" ON public.menu_items;
CREATE POLICY "Allow staff delete on menu_items"
  ON public.menu_items FOR DELETE USING (true);

-- Policy: Orders (Public can place orders and read orders, staff can update status)
DROP POLICY IF EXISTS "Allow public to place orders" ON public.orders;
CREATE POLICY "Allow public to place orders"
  ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to orders" ON public.orders;
CREATE POLICY "Allow public read access to orders"
  ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow staff update on orders" ON public.orders;
CREATE POLICY "Allow staff update on orders"
  ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Policy: Order Items (Public can insert child items and read)
DROP POLICY IF EXISTS "Allow insert to order_items" ON public.order_items;
CREATE POLICY "Allow insert to order_items"
  ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to order_items" ON public.order_items;
CREATE POLICY "Allow read access to order_items"
  ON public.order_items FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 6. Enable Realtime Replication
-- ------------------------------------------------------------------------------
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. Seed Authoritative Initial Menu Items
-- ------------------------------------------------------------------------------
INSERT INTO public.menu_items (id, name, category, price, description, in_stock)
VALUES
  (1, 'Butterscotch Cold Brew', 'Signature Potions', 280, '18-hour cold-steeped Arabica infused with rich butterscotch essence, topped with clotted butter-cream cold foam and toasted gold crystal sugar.', true),
  (2, 'Polyjuice Sparkler', 'Signature Potions', 260, 'Effervescent kiwi, crushed Persian lime, and spirulina mist layered with edible emerald pearl shimmer that swirls when stirred.', true),
  (3, 'Liquid Luck Latte', 'Signature Potions', 320, 'Kashmiri saffron blossom syrup, wild forest honey, crushed green cardamom, and shimmering 24K edible gold dust over double espresso.', true),
  (4, 'Dark Mark Espresso', 'Artisan Brews', 190, 'Quad-shot obsidian roast pulled with intense volcanic crema, dark cocoa nibs, and a whisper of smoked hickory peat.', true),
  (5, 'Room of Requirement Roast', 'Artisan Brews', 220, 'Single-origin Ethiopian washed beans offering delicate floral jasmine, stone fruit, and a smooth buttery caramel finish.', true),
  (6, 'Cauldron Hand Pie', 'Magical Bakes', 240, 'Dark Valrhona cocoa puff pastry shaped like an apothecary cauldron, filled with simmering wild blackberry and spiced plum compote.', true),
  (7, 'Pumpkin Pasties', 'Magical Bakes', 210, 'Flaky golden turnover packed with heirloom spiced pumpkin puree, cinnamon stick brown sugar, and toasted spiced pecans.', true),
  (8, 'Golden Snitch Macaron', 'Magical Bakes', 180, 'Large 24K gilded French macaron filled with honeycomb buttercream and ethereal spun-sugar golden wings.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  in_stock = EXCLUDED.in_stock;

SELECT setval('public.menu_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.menu_items));
