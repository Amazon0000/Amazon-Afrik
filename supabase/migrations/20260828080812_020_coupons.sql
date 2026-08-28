/*
# Seller coupons (discount codes)

The home page already advertised "exclusive coupons" as a marketing line
with nothing real behind it. This adds a real, seller-owned coupon system
consistent with the rest of the platform's model: each seller creates and
owns their own codes (like flash_deals), Zando never takes a cut of the
discount, and validation happens server-side via SECURITY DEFINER
functions rather than trusting client-computed discounts — a coupon's
discount amount is always authoritative from the database, never from
whatever the browser sent.
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric NOT NULL DEFAULT 0,
  usage_limit int,
  times_used int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, code)
);

CREATE INDEX IF NOT EXISTS idx_coupons_seller ON coupons(seller_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Sellers manage only their own coupons. No public SELECT policy: codes
-- are validated through validate_coupon() below, which never leaks the
-- full coupon list (a buyer can check one code, not browse all of them).
DROP POLICY IF EXISTS "seller_read_own_coupons" ON coupons;
CREATE POLICY "seller_read_own_coupons" ON coupons FOR SELECT
  TO authenticated USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "seller_insert_own_coupons" ON coupons;
CREATE POLICY "seller_insert_own_coupons" ON coupons FOR INSERT
  TO authenticated WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "seller_update_own_coupons" ON coupons;
CREATE POLICY "seller_update_own_coupons" ON coupons FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Read-only check: does this code work for this seller right now, and what
-- discount does it produce on this subtotal? No side effects.
CREATE OR REPLACE FUNCTION validate_coupon(p_code text, p_seller_id uuid, p_subtotal numeric)
RETURNS jsonb AS $$
DECLARE
  c coupons%ROWTYPE;
  discount numeric;
BEGIN
  SELECT * INTO c FROM coupons
  WHERE seller_id = p_seller_id AND code = upper(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  IF c.usage_limit IS NOT NULL AND c.times_used >= c.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'limit_reached');
  END IF;
  IF p_subtotal < c.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'min_order_not_met', 'min_order_amount', c.min_order_amount);
  END IF;

  IF c.discount_type = 'percent' THEN
    discount := round(p_subtotal * (c.discount_value / 100.0), 2);
  ELSE
    discount := least(c.discount_value, p_subtotal);
  END IF;

  RETURN jsonb_build_object('valid', true, 'discount_amount', discount, 'coupon_id', c.id, 'discount_type', c.discount_type, 'discount_value', c.discount_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION validate_coupon(text, uuid, numeric) TO anon, authenticated;

-- Atomically consumes one use, only if still valid at redemption time
-- (protects against a race between two buyers on the last use of a
-- limited coupon). Called once per seller-group at order placement.
CREATE OR REPLACE FUNCTION redeem_coupon(p_code text, p_seller_id uuid)
RETURNS boolean AS $$
DECLARE
  updated_rows int;
BEGIN
  UPDATE coupons
  SET times_used = times_used + 1
  WHERE seller_id = p_seller_id
    AND code = upper(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR times_used < usage_limit);
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION redeem_coupon(text, uuid) TO anon, authenticated;

-- Coupon codes are stored/matched uppercase for consistent, case-insensitive redemption.
CREATE OR REPLACE FUNCTION uppercase_coupon_code() RETURNS TRIGGER AS $$
BEGIN
  NEW.code := upper(NEW.code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uppercase_coupon_code ON coupons;
CREATE TRIGGER trg_uppercase_coupon_code
BEFORE INSERT OR UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION uppercase_coupon_code();

-- Track which order actually used which coupon (for seller-side reporting).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;
