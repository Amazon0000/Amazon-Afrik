/*
# Orders, Addresses, Wishlist, Ads, Payment Providers Tables

## Purpose
Creates the shopping experience, advertising, and payment infrastructure tables.

## New Tables
1. `orders` — Customer orders with status tracking
   - id (uuid PK), user_id, seller_id FK, status, total, currency, payment_method
   - delivery_address, tracking_id, created_at
2. `order_items` — Line items per order
   - id, order_id FK, product_id FK, product_name, qty, price, image_url
3. `addresses` — Customer delivery addresses with geographic cascade
   - id, user_id, label, full_name, phone, street, country_id, city, region, district, neighborhood, landmark
4. `wishlist` — Saved products
   - id, user_id, product_id FK, created_at
5. `ad_campaigns` — Zando Ads internal advertising
   - id, seller_id FK, name, target_country, target_city, target_category, budget, impressions, clicks, conversions, status
6. `payment_providers` — Modular payment configuration
   - id, name, slug, logo_url, is_active, countries (text[]), config (jsonb)
7. `flash_sales` — Time-limited promotional events
   - id, name, start_date, end_date, is_active

## Security
- RLS enabled on all tables
- Orders: owner-scoped (user can only see own orders)
- Addresses: owner-scoped
- Wishlist: owner-scoped
- Ads, payment providers, flash sales: public read
*/

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'inTransit', 'delivered', 'cancelled')),
  total numeric NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
  payment_method text,
  delivery_address text,
  tracking_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_read_own_orders" ON orders;
CREATE POLICY "user_read_own_orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_insert_orders" ON orders;
CREATE POLICY "user_insert_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_update_own_orders" ON orders;
CREATE POLICY "user_update_own_orders" ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty int NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  image_url text
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_read_order_items" ON order_items;
CREATE POLICY "user_read_order_items" ON order_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "user_insert_order_items" ON order_items;
CREATE POLICY "user_insert_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);

-- ============ ADDRESSES ============
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  full_name text NOT NULL,
  phone text,
  street text NOT NULL,
  country_id text REFERENCES countries(id),
  city text,
  region text,
  district text,
  neighborhood text,
  landmark text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_read_own_addresses" ON addresses;
CREATE POLICY "user_read_own_addresses" ON addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_insert_addresses" ON addresses;
CREATE POLICY "user_insert_addresses" ON addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_update_own_addresses" ON addresses;
CREATE POLICY "user_update_own_addresses" ON addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_delete_own_addresses" ON addresses;
CREATE POLICY "user_delete_own_addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ WISHLIST ============
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_read_own_wishlist" ON wishlist;
CREATE POLICY "user_read_own_wishlist" ON wishlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_insert_wishlist" ON wishlist;
CREATE POLICY "user_insert_wishlist" ON wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_delete_own_wishlist" ON wishlist;
CREATE POLICY "user_delete_own_wishlist" ON wishlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ AD CAMPAIGNS ============
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_country text REFERENCES countries(id),
  target_city text,
  target_category uuid REFERENCES categories(id),
  budget numeric NOT NULL DEFAULT 0,
  duration_days int NOT NULL DEFAULT 7,
  impressions int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_seller ON ad_campaigns(seller_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ad_campaigns(status);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_ads" ON ad_campaigns;
CREATE POLICY "public_read_ads" ON ad_campaigns FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_ads" ON ad_campaigns;
CREATE POLICY "auth_insert_ads" ON ad_campaigns FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_ads" ON ad_campaigns;
CREATE POLICY "auth_update_ads" ON ad_campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============ PAYMENT PROVIDERS ============
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  countries text[] DEFAULT '{}',
  config jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_payment_providers" ON payment_providers;
CREATE POLICY "public_read_payment_providers" ON payment_providers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_payment_providers" ON payment_providers;
CREATE POLICY "auth_manage_payment_providers" ON payment_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ FLASH SALES ============
CREATE TABLE IF NOT EXISTS flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_flash_sales" ON flash_sales;
CREATE POLICY "public_read_flash_sales" ON flash_sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_flash_sales" ON flash_sales;
CREATE POLICY "auth_manage_flash_sales" ON flash_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
