/*
# Core Marketplace Schema — Countries, Currencies, Categories, Brands

## Purpose
Creates the foundational geographic and catalog taxonomy tables for Zando Africa marketplace.

## New Tables
1. `countries` — All countries (Africa-first, worldwide expansion ready)
   - id (text PK, ISO 2-letter code), name, flag emoji, phone_code, currency_code FK
   - is_active (bool, default true), is_african (bool), region, created_at
2. `currencies` — Currency reference
   - code (text PK, e.g. USD, XOF), name, symbol, exchange_rate (to USD), is_active
3. `categories` — Nested category tree with unlimited depth
   - id (uuid PK), parent_id (self-ref FK, nullable for roots), slug, name, icon
   - banner_url, is_featured, is_trending, sort_order, is_active
4. `brands` — Product brands
   - id (uuid PK), name, slug, logo_url, country_id FK, is_verified, is_active
5. `category_translations` — Bilingual category names (FR/EN)
   - category_id FK, locale (fr/en), name, description

## Security
- RLS enabled on all tables
- Public read access (anon + authenticated) for all reference data
- No public writes (managed via admin/superadmin only)
*/

-- ============ CURRENCIES ============
CREATE TABLE IF NOT EXISTS currencies (
  code text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL DEFAULT '$',
  exchange_rate numeric NOT NULL DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_currencies" ON currencies;
CREATE POLICY "public_read_currencies" ON currencies FOR SELECT TO anon, authenticated USING (true);

-- ============ COUNTRIES ============
CREATE TABLE IF NOT EXISTS countries (
  id text PRIMARY KEY,
  name text NOT NULL,
  flag text NOT NULL DEFAULT '🌍',
  phone_code text,
  currency_code text REFERENCES currencies(code),
  is_active boolean NOT NULL DEFAULT true,
  is_african boolean NOT NULL DEFAULT true,
  region text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_countries" ON countries;
CREATE POLICY "public_read_countries" ON countries FOR SELECT TO anon, authenticated USING (true);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text,
  banner_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);

-- ============ CATEGORY TRANSLATIONS ============
CREATE TABLE IF NOT EXISTS category_translations (
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('fr', 'en')),
  name text NOT NULL,
  description text,
  PRIMARY KEY (category_id, locale)
);

ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_cat_translations" ON category_translations;
CREATE POLICY "public_read_cat_translations" ON category_translations FOR SELECT TO anon, authenticated USING (true);

-- ============ BRANDS ============
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  country_id text REFERENCES countries(id),
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_brands" ON brands;
CREATE POLICY "public_read_brands" ON brands FOR SELECT TO anon, authenticated USING (true);
