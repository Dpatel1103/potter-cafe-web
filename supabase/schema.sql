-- ==============================================================================
-- ESPRESSO PATRONUM — SUPABASE REALTIME DATABASE MIGRATION
-- ==============================================================================
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Create 'menu_items' Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Signature Potions', 'Artisan Brews', 'Magical Bakes')),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  lore TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Create 'orders' Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'COD')),
  status TEXT NOT NULL DEFAULT 'Placed' CHECK (status IN ('Placed', 'Accepted', 'Brewing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  courier_name TEXT,
  delivery_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. Automatic Timestamp Updating Function & Triggers
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Menu Items (Everyone can read, authenticated staff / anon can toggle)
DROP POLICY IF EXISTS "Allow public read access on menu_items" ON public.menu_items;
CREATE POLICY "Allow public read access on menu_items"
  ON public.menu_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow staff update on menu_items" ON public.menu_items;
CREATE POLICY "Allow staff update on menu_items"
  ON public.menu_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff insert on menu_items" ON public.menu_items;
CREATE POLICY "Allow staff insert on menu_items"
  ON public.menu_items
  FOR INSERT
  WITH CHECK (true);

-- Policy: Orders (Public can insert orders, track orders, and staff can update status)
DROP POLICY IF EXISTS "Allow public to place orders" ON public.orders;
CREATE POLICY "Allow public to place orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to orders" ON public.orders;
CREATE POLICY "Allow public read access to orders"
  ON public.orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow staff update on orders" ON public.orders;
CREATE POLICY "Allow staff update on orders"
  ON public.orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. Enable Realtime Replication
-- ------------------------------------------------------------------------------
-- Set replica identity to full so that update events include complete row data
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
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
-- 7. Seed Initial Menu Items
-- ------------------------------------------------------------------------------
INSERT INTO public.menu_items (id, name, category, price, description, lore, badge, is_available)
VALUES
  ('potion-butterscotch', 'Butterscotch Cold Brew', 'Signature Potions', 280, '18-hour cold-steeped Arabica infused with caramel essence, topped with thick clotted butter-cream cold foam and toasted gold sugar crystals.', 'Brewed secretly in cellar barrels behind the Three Broomsticks, favored by weary Aurors.', 'House Favorite', true),
  ('potion-polyjuice', 'Polyjuice Sparkler', 'Signature Potions', 340, 'Effervescent kiwi, crushed Persian lime, and spirulina mist layered with edible emerald pearl shimmer that swirls when stirred.', 'Contains powdered bicorn horn essence (synthetic, Ministry-approved). Tastes shockingly crisp.', 'Shimmer Effect', true),
  ('potion-felix', 'Felix Felicis Gold Elixir', 'Signature Potions', 380, 'Kashmiri saffron blossom syrup, wild forest honey, crushed cardamom, and sparkling liquid gold flakes over cold brew concentrate.', 'Grants +100 Luck Boost for your O.W.L. exams and afternoon meetings. A singular draught of fortune.', '+100 Luck Boost', true),
  ('potion-amortentia', 'Amortentia Berry Latte', 'Signature Potions', 320, 'Silky rose oat milk steamed with forest wild berry coulis, topped with mother-of-pearl edible vapor and pink crystal sprinkles.', 'Emits a distinct aroma personalized to whatever enchants your heart most.', 'Love Draught', true),
  ('brew-dragons-breath', 'Dragon''s Breath Dark Roast', 'Artisan Brews', 220, 'Quad-shot dark roast espresso with Hungarian Horntail chili-infused cacao dust and a whisper of smoked hickory peat.', 'Roasted over genuine dragon fire coals. Guaranteed to wake even the deepest sleeping giant.', 'High Caffeine', true),
  ('brew-mandrake', 'Mandrake Root Cortado', 'Artisan Brews', 260, 'Equal parts velvety steamed whole milk and double espresso pulled through roasted chicory and earth-grown ginseng root.', 'Restores vitality after petrification, long study nights, or grueling work shifts.', 'Restorative', true),
  ('brew-patronus', 'Patronus Lavender Cappuccino', 'Artisan Brews', 290, 'Micro-foamed milk infused with French culinary lavender and vanilla bean, poured over double espresso with shimmering silver dusting.', 'Conjures warm, joyful thoughts. The steam reportedly takes the shape of a silver stag when first poured.', 'Silver Dust', true),
  ('brew-espresso-patronum', 'Espresso Patronum Single Origin', 'Artisan Brews', 210, 'Pure single-origin Ethiopian washed beans roasted to a medium profile, offering notes of wild jasmine, dark stone fruit, and cocoa nibs.', 'Our master brewer''s signature house blend, prepared on a brass lever machine forged in Knockturn Alley.', 'House Roast', true),
  ('bake-snitch-macaron', 'Golden Snitch Honey Macaron', 'Magical Bakes', 190, 'Large 24K gilded French macaron filled with honeycomb buttercream and spun-sugar ethereal golden wings.', 'Flesh-memory enchanted: opens at the close of your first bite to reveal a luscious liquid caramel core.', 'Spun Sugar Wings', true),
  ('bake-cauldron-pie', 'Cauldron Hand Pie', 'Magical Bakes', 240, 'Dark Valrhona cocoa puff pastry shaped like a miniature apothecary cauldron, bubbling with warm wild blackberry and plum compote.', 'Careful—the filling genuinely simmers for up to five minutes after leaving the enchanted hearth.', 'Warm Hearth', true),
  ('bake-pumpkin-pasty', 'Pumpkin Pasty of the Express', 'Magical Bakes', 210, 'Flaky golden turnover packed with heirloom spiced pumpkin puree, cinnamon stick brown sugar, and toasted spiced pecans.', 'The authentic recipe from the Hogwarts Express lunch trolley, unchanged since 1927.', 'Express Special', true),
  ('bake-chocolate-frog-tart', 'Chocolate Frog Ganache Tart', 'Magical Bakes', 230, 'Crisp hazelnut tart shell loaded with 70% dark Belgian ganache, topped with a crisp dark chocolate frog and collectible wizard card.', 'They only have one good jump in them! Eat quickly before it leaps off the plate.', 'Collectible Card', true)
ON CONFLICT (id) DO NOTHING;
