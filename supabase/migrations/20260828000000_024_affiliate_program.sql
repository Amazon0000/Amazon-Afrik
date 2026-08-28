/*
# Affiliate program (influencers / promoters)

Consistent with the 0% commission model: affiliates are paid by ZANDO out
of its own revenue (a share of the seller subscription fee a referred
seller ends up paying), never out of a seller's sales — those still go
100% directly to the seller via their own PSP, untouched.

- affiliates: one row per applicant, with a unique referral code, review
  status (mirrors the seller KYC review pattern), payout details, and
  running totals.
- sellers gains referred_by_affiliate_id: set once, at signup, when a
  ?ref=CODE link was used — never changes after signup, so a code can't
  be swapped in after the fact.
- affiliate_referrals: one row per referred seller, tracking whether they
  ever converted to a paid plan, and how much commission that generated.
  A referral becomes 'converted' (and a commission is recorded) exactly
  once — when the referred seller's plan changes away from 'starter' for
  the first time.
*/

CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  audience_description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  commission_rate numeric NOT NULL DEFAULT 20 CHECK (commission_rate > 0 AND commission_rate <= 50),
  payout_provider text,
  payout_account_identifier text,
  total_earned numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS referred_by_affiliate_id uuid REFERENCES affiliates(id);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'converted')),
  commission_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  UNIQUE (referred_seller_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- An affiliate reads/edits only their own record. No public read at all —
-- referral codes are validated through a function (below), never browsed.
DROP POLICY IF EXISTS "affiliate_read_own" ON affiliates;
CREATE POLICY "affiliate_read_own" ON affiliates FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "affiliate_insert_own" ON affiliates;
CREATE POLICY "affiliate_insert_own" ON affiliates FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "affiliate_update_own_payout_details" ON affiliates;
CREATE POLICY "affiliate_update_own_payout_details" ON affiliates FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_affiliates" ON affiliates;
CREATE POLICY "admin_manage_affiliates" ON affiliates FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Prevent an affiliate from approving themselves or editing earnings —
-- same pattern as the product/ad-campaign approval-field triggers.
CREATE OR REPLACE FUNCTION protect_affiliate_review_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    NEW.status := OLD.status;
    NEW.commission_rate := OLD.commission_rate;
    NEW.total_earned := OLD.total_earned;
    NEW.total_paid := OLD.total_paid;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_affiliate_review ON affiliates;
CREATE TRIGGER trg_protect_affiliate_review
BEFORE UPDATE ON affiliates
FOR EACH ROW EXECUTE FUNCTION protect_affiliate_review_fields();

DROP POLICY IF EXISTS "affiliate_read_own_referrals" ON affiliate_referrals;
CREATE POLICY "affiliate_read_own_referrals" ON affiliate_referrals FOR SELECT
  TO authenticated USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_manage_affiliate_referrals" ON affiliate_referrals;
CREATE POLICY "admin_manage_affiliate_referrals" ON affiliate_referrals FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Resolves a referral code to an affiliate id at signup time — never
-- exposes the affiliate's earnings/payout data, just whether the code is
-- live and, if so, its id.
CREATE OR REPLACE FUNCTION resolve_affiliate_code(p_code text)
RETURNS uuid AS $$
  SELECT id FROM affiliates WHERE referral_code = upper(p_code) AND status = 'approved' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resolve_affiliate_code(text) TO anon, authenticated;

-- Called once, right when a referred seller's plan first moves away from
-- 'starter' — records the referral as converted and credits the
-- affiliate's running total, atomically (no double-counting on repeat
-- calls thanks to the UNIQUE(referred_seller_id) + status check).
CREATE OR REPLACE FUNCTION record_affiliate_conversion(p_seller_id uuid, p_plan_price numeric)
RETURNS boolean AS $$
DECLARE
  r affiliate_referrals%ROWTYPE;
  commission numeric;
BEGIN
  SELECT * INTO r FROM affiliate_referrals WHERE referred_seller_id = p_seller_id AND status = 'signed_up';
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT round(p_plan_price * (a.commission_rate / 100.0), 2) INTO commission
  FROM affiliates a WHERE a.id = r.affiliate_id;

  UPDATE affiliate_referrals
  SET status = 'converted', commission_amount = commission, converted_at = now()
  WHERE id = r.id;

  UPDATE affiliates SET total_earned = total_earned + commission WHERE id = r.affiliate_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_affiliate_conversion(uuid, numeric) TO anon, authenticated;
