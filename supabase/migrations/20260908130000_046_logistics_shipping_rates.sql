/*
# International logistics — per-country shipping rates

Lets each seller define, for physical products only, which destination
countries they ship to, what the shipping fee is per country, and an
estimated delivery window (e.g. Cameroon -> USA = 7-10 days). Digital
products never need this — they're excluded entirely at the app layer
(instant delivery, no shipping).

## New table: seller_shipping_rates
One row per (seller, destination country). Read is public (anon +
authenticated) since a guest checking out without an account still needs
to see the shipping fee before paying — this mirrors the existing public
read pattern already used for payment_providers/flash_sales in migration
003. Writes are restricted to the seller who owns the row.
*/

CREATE TABLE IF NOT EXISTS seller_shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  country_id text NOT NULL REFERENCES countries(id),
  fee numeric NOT NULL DEFAULT 0 CHECK (fee >= 0),
  min_days int NOT NULL DEFAULT 3 CHECK (min_days > 0),
  max_days int NOT NULL DEFAULT 7 CHECK (max_days >= min_days),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, country_id)
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_seller ON seller_shipping_rates(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_country ON seller_shipping_rates(country_id);

ALTER TABLE seller_shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_shipping_rates" ON seller_shipping_rates;
CREATE POLICY "public_read_shipping_rates" ON seller_shipping_rates
  FOR SELECT TO anon, authenticated USING (true);

-- Only the owning seller (via sellers.user_id) can manage their own rates.
DROP POLICY IF EXISTS "seller_manage_own_shipping_rates" ON seller_shipping_rates;
CREATE POLICY "seller_manage_own_shipping_rates" ON seller_shipping_rates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sellers WHERE sellers.id = seller_shipping_rates.seller_id AND sellers.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sellers WHERE sellers.id = seller_shipping_rates.seller_id AND sellers.user_id = auth.uid()));

-- Snapshot the actual fee + delivery window charged, on the order itself —
-- so a later rate change by the seller never retroactively changes what a
-- buyer already paid or was promised.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_min_days int,
  ADD COLUMN IF NOT EXISTS shipping_max_days int,
  ADD COLUMN IF NOT EXISTS destination_country_id text REFERENCES countries(id);
