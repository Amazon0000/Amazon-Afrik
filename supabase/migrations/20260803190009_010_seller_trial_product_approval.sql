/*
# Seller trial, product approval, reviews config, super admin emails

1. New columns on `sellers`:
- `trial_starts_at` (timestamptz) — when the 14-day free trial begins
- `trial_ends_at` (timestamptz) — when the trial expires
- `subscription_status` (text, default 'trial') — trial | active | expired | suspended
- `plan_selected` (text) — which plan the seller chose during onboarding

2. New column on `products`:
- `approval_status` (text, default 'pending') — pending | approved | rejected
- Index on approval_status for fast filtering

3. New table `platform_settings`:
- Key-value store for Super Admin configurable settings
- `reviews_enabled` (boolean, default true)
- `reviews_confirmed_buyers_only` (boolean, default true)
- Seed with default settings

4. New table `super_admins`:
- Stores super admin email addresses
- Seed with vincentnogue2@gmail.com and vincentnogue@yahoo.com

5. Plan-based staff limits on `seller_staff` (if table exists) or as platform setting
*/

-- Add trial columns to sellers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'trial_starts_at') THEN
    ALTER TABLE sellers ADD COLUMN trial_starts_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE sellers ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'subscription_status') THEN
    ALTER TABLE sellers ADD COLUMN subscription_status text DEFAULT 'trial';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'plan_selected') THEN
    ALTER TABLE sellers ADD COLUMN plan_selected text;
  END IF;
END $$;

-- Add approval_status to products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approval_status') THEN
    ALTER TABLE products ADD COLUMN approval_status text DEFAULT 'pending';
  END IF;
END $$;

-- Index for filtering approved products
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);

-- Platform settings table (key-value)
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_platform_settings" ON platform_settings;
CREATE POLICY "anon_read_platform_settings" ON platform_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_platform_settings" ON platform_settings;
CREATE POLICY "authenticated_update_platform_settings" ON platform_settings FOR UPDATE
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_insert_platform_settings" ON platform_settings;
CREATE POLICY "authenticated_insert_platform_settings" ON platform_settings FOR INSERT
  TO authenticated WITH CHECK (true);

-- Seed default settings
INSERT INTO platform_settings (key, value) VALUES
  ('reviews_enabled', '{"value": true}'::jsonb),
  ('reviews_confirmed_buyers_only', '{"value": true}'::jsonb),
  ('guest_checkout_enabled', '{"value": true}'::jsonb),
  ('product_approval_required', '{"value": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Super admins table
CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  added_by uuid
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_super_admins" ON super_admins;
CREATE POLICY "anon_read_super_admins" ON super_admins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_manage_super_admins" ON super_admins;
CREATE POLICY "authenticated_manage_super_admins" ON super_admins FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Seed official super admin emails
INSERT INTO super_admins (email, full_name) VALUES
  ('vincentnogue2@gmail.com', 'Vincent Nogue'),
  ('vincentnogue@yahoo.com', 'Vincent Nogue')
ON CONFLICT (email) DO NOTHING;

-- Plan-based staff limits as a platform setting
INSERT INTO platform_settings (key, value) VALUES
  ('plan_staff_limits', '{"starter": 1, "premium": 5, "enterprise": 20}'::jsonb)
ON CONFLICT (key) DO NOTHING;
