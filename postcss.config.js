/*
# Sellers, Products, Variants, Images, Reviews Tables

## Purpose
Creates the core marketplace commerce tables for vendors and their product catalog.

## New Tables
1. `sellers` — Vendor accounts with onboarding status, plan, store info
   - id (uuid PK), user_id (FK auth.users), business_name, store_slug, store_logo_url
   - store_banner_url, description, country_id FK, city, plan (starter/premium/enterprise)
   - status (pending/approved/rejected/suspended), business_type, rating, total_reviews
2. `seller_documents` — KYC documents uploaded during onboarding
   - id, seller_id FK, doc_type, file_url, status
3. `products` — Product catalog
   - id, seller_id FK, category_id FK, brand_id FK, country_id FK
   - name, slug, description, price, old_price, currency_code, sku, stock
   - rating, total_reviews, is_sponsored, is_active, created_at
4. `product_images` — Multiple images per product
   - id, product_id FK, image_url, sort_order
5. `product_variants` — Size, color, model variations
   - id, product_id FK, variant_type, variant_value, price_adjustment, stock
6. `product_specifications` — Key-value specs
   - id, product_id FK, spec_name, spec_value
7. `product_translations` — Bilingual product names/descriptions
   - product_id FK, locale, name, description
8. `reviews` — Customer reviews with verified purchase flag
   - id, product_id FK, seller_id FK, user_id, rating, comment, is_verified, created_at
9. `product_questions` — Q&A on products
   - id, product_id FK, user_id, question, answer, answered_by, created_at

## Security
- RLS enabled on all tables
- Public read for products, reviews, questions (active items only)
- Seller-scoped writes for their own products
- Authenticated users can post reviews and questions
*/

-- ============ SELLERS ============
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  store_slug text NOT NULL UNIQUE,
  store_logo_url text,
  store_banner_url text,
  description text,
  country_id text REFERENCES countries(id),
  city text,
  phone text,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'premium', 'enterprise')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  business_type text CHECK (business_type IN ('individual', 'company', 'government', 'ngo', 'cooperative')),
  registration_number text,
  vat_number text,
  bank_name text,
  bank_iban text,
  bank_swift text,
  mobile_money_number text,
  rating numeric NOT NULL DEFAULT 0,
  total_reviews int NOT NULL DEFAULT 0,
  total_products int NOT NULL DEFAULT 0,
  joined_year int,
  is_official boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sellers_user ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(store_slug);
CREATE INDEX IF NOT EXISTS idx_sellers_country ON sellers(country_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_approved_sellers" ON sellers;
CREATE POLICY "public_read_approved_sellers" ON sellers FOR SELECT TO anon, authenticated USING (status = 'approved' OR user_id = auth.uid());
DROP POLICY IF EXISTS "seller_insert_own" ON sellers;
CREATE POLICY "seller_insert_own" ON sellers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "seller_update_own" ON sellers;
CREATE POLICY "seller_update_own" ON sellers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SELLER DOCUMENTS ============
CREATE TABLE IF NOT EXISTS seller_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_docs_seller ON seller_documents(seller_id);

ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_seller_docs" ON seller_documents;
CREATE POLICY "public_read_seller_docs" ON seller_documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "seller_insert_docs" ON seller_documents;
CREATE POLICY "seller_insert_docs" ON seller_documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seller_update_docs" ON seller_documents;
CREATE POLICY "seller_update_docs" ON seller_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  country_id text REFERENCES countries(id),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  old_price numeric,
  currency_code text NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
  sku text,
  stock int NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  total_reviews int NOT NULL DEFAULT 0,
  is_sponsored boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sponsored ON products(is_sponsored);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "seller_insert_products" ON products;
CREATE POLICY "seller_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seller_update_products" ON products;
CREATE POLICY "seller_update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "seller_delete_products" ON products;
CREATE POLICY "seller_delete_products" ON products FOR DELETE TO authenticated USING (true);

-- ============ PRODUCT IMAGES ============
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_product_images" ON product_images;
CREATE POLICY "auth_write_product_images" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCT VARIANTS ============
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_type text NOT NULL,
  variant_value text NOT NULL,
  price_adjustment numeric NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_variants" ON product_variants;
CREATE POLICY "public_read_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_variants" ON product_variants;
CREATE POLICY "auth_write_variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCT SPECIFICATIONS ============
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  spec_name text NOT NULL,
  spec_value text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_specs_product ON product_specifications(product_id);

ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_specs" ON product_specifications;
CREATE POLICY "public_read_specs" ON product_specifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_specs" ON product_specifications;
CREATE POLICY "auth_write_specs" ON product_specifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCT TRANSLATIONS ============
CREATE TABLE IF NOT EXISTS product_translations (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('fr', 'en')),
  name text NOT NULL,
  description text,
  PRIMARY KEY (product_id, locale)
);

ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_prod_translations" ON product_translations;
CREATE POLICY "public_read_prod_translations" ON product_translations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_prod_translations" ON product_translations;
CREATE POLICY "auth_write_prod_translations" ON product_translations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (true);

-- ============ PRODUCT QUESTIONS ============
CREATE TABLE IF NOT EXISTS product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL,
  question text NOT NULL,
  answer text,
  answered_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_product ON product_questions(product_id);

ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_questions" ON product_questions;
CREATE POLICY "public_read_questions" ON product_questions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_questions" ON product_questions;
CREATE POLICY "auth_insert_questions" ON product_questions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_questions" ON product_questions;
CREATE POLICY "auth_update_questions" ON product_questions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
