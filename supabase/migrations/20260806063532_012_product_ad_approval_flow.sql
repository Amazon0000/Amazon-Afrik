/*
# Product & Ad Approval Flow + RLS Fixes (v2)

Same as v1 but uses sellers.user_id instead of owner_id.
*/

-- 1. Add approval columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2. Add review columns to ad_campaigns
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 3. Add is_hidden to product_images
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- 4. Backfill existing products as approved
UPDATE products SET approval_status = 'approved' WHERE approval_status = 'pending' AND is_active = true;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);

-- 6. RLS policies for products — 3-tier access
DROP POLICY IF EXISTS "select_own_products" ON products;
DROP POLICY IF EXISTS "insert_own_products" ON products;
DROP POLICY IF EXISTS "update_own_products" ON products;
DROP POLICY IF EXISTS "delete_own_products" ON products;
DROP POLICY IF EXISTS "anon_select_products" ON products;
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;
DROP POLICY IF EXISTS "public_select_approved_products" ON products;
DROP POLICY IF EXISTS "seller_insert_products" ON products;
DROP POLICY IF EXISTS "seller_update_own_products" ON products;
DROP POLICY IF EXISTS "seller_delete_own_products" ON products;

-- Public SELECT: only approved & active products
CREATE POLICY "public_select_approved_products" ON products
  FOR SELECT TO anon, authenticated
  USING (approval_status = 'approved' AND is_active = true);

-- Seller INSERT: own products
CREATE POLICY "seller_insert_products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (seller_id IN (
    SELECT id FROM sellers WHERE user_id = auth.uid()
  ));

-- Seller UPDATE: own products only
CREATE POLICY "seller_update_own_products" ON products
  FOR UPDATE TO authenticated
  USING (seller_id IN (
    SELECT id FROM sellers WHERE user_id = auth.uid()
  ))
  WITH CHECK (seller_id IN (
    SELECT id FROM sellers WHERE user_id = auth.uid()
  ));

-- Seller DELETE: own products only
CREATE POLICY "seller_delete_own_products" ON products
  FOR DELETE TO authenticated
  USING (seller_id IN (
    SELECT id FROM sellers WHERE user_id = auth.uid()
  ));

-- 7. RLS for product_images
DROP POLICY IF EXISTS "select_product_images" ON product_images;
DROP POLICY IF EXISTS "insert_product_images" ON product_images;
DROP POLICY IF EXISTS "update_product_images" ON product_images;
DROP POLICY IF EXISTS "delete_product_images" ON product_images;
DROP POLICY IF EXISTS "public_select_visible_product_images" ON product_images;
DROP POLICY IF EXISTS "seller_insert_product_images" ON product_images;
DROP POLICY IF EXISTS "seller_update_product_images" ON product_images;
DROP POLICY IF EXISTS "seller_delete_product_images" ON product_images;

CREATE POLICY "public_select_visible_product_images" ON product_images
  FOR SELECT TO anon, authenticated
  USING (is_hidden = false);

CREATE POLICY "seller_insert_product_images" ON product_images
  FOR INSERT TO authenticated
  WITH CHECK (product_id IN (
    SELECT p.id FROM products p
    JOIN sellers s ON p.seller_id = s.id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "seller_update_product_images" ON product_images
  FOR UPDATE TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN sellers s ON p.seller_id = s.id
    WHERE s.user_id = auth.uid()
  ));

CREATE POLICY "seller_delete_product_images" ON product_images
  FOR DELETE TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN sellers s ON p.seller_id = s.id
    WHERE s.user_id = auth.uid()
  ));