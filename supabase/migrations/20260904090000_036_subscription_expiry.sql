/*
# Real subscription expiry + admin extension system

sellers.plan (starter/premium/enterprise) had no expiry mechanism at all
— a subscription upgrade never ended, and there was no way for an admin
to extend, shorten, or set a custom expiry date for a seller's plan.
This is a real, critical gap for a marketplace whose stated revenue
model is subscriptions.

Adds plan_expires_at. NULL means "no active paid term" (starter, or a
plan that was never given an expiry). Three admin-only functions cover
every extension mode requested: relative extension by days, by whole
months/years (calendar-aware, not a fixed day count), and setting an
exact custom end date. All three are effective immediately (plain
UPDATE, no queued/batched job) and write straight to sellers, so any
client reading the row — the seller's own dashboard, the admin panel —
sees the change on its next fetch.

Downgrade-on-expiry is enforced lazily rather than via a background
cron job (simpler, and avoids depending on pg_cron being enabled on
this project): is_seller_plan_active() computes in real time whether a
seller's current paid plan should still count as active, and the
seller's own dashboard calls it to decide whether to keep showing
premium/enterprise features or fall back to starter.
*/

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- True if the seller has no expiry set (treated as indefinite — e.g. a
-- manually-granted plan) or their expiry is still in the future.
CREATE OR REPLACE FUNCTION is_seller_plan_active(p_seller_id uuid)
RETURNS boolean AS $$
  SELECT plan = 'starter' OR plan_expires_at IS NULL OR plan_expires_at > now()
  FROM sellers WHERE id = p_seller_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_seller_plan_active(uuid) TO anon, authenticated;

-- Relative extension: adds p_days to the current expiry, or to now() if
-- there's no expiry yet / it already passed — never loses remaining time
-- a seller already paid for by resetting the clock to "now + p_days".
CREATE OR REPLACE FUNCTION admin_extend_seller_plan_days(p_seller_id uuid, p_days int)
RETURNS timestamptz AS $$
DECLARE
  new_expiry timestamptz;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE sellers
  SET plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + (p_days || ' days')::interval
  WHERE id = p_seller_id
  RETURNING plan_expires_at INTO new_expiry;
  RETURN new_expiry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_extend_seller_plan_days(uuid, int) TO authenticated;

-- Calendar-aware month/year extension (e.g. +1 month from Jan 31 lands on
-- Feb 28/29, not a fixed 30-day approximation).
CREATE OR REPLACE FUNCTION admin_extend_seller_plan_months(p_seller_id uuid, p_months int)
RETURNS timestamptz AS $$
DECLARE
  new_expiry timestamptz;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE sellers
  SET plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + (p_months || ' months')::interval
  WHERE id = p_seller_id
  RETURNING plan_expires_at INTO new_expiry;
  RETURN new_expiry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_extend_seller_plan_months(uuid, int) TO authenticated;

-- Exact custom end date — overwrites rather than adds, for "set the
-- subscription to end on this specific date" instead of "add time".
CREATE OR REPLACE FUNCTION admin_set_seller_plan_expiry(p_seller_id uuid, p_expires_at timestamptz)
RETURNS boolean AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE sellers SET plan_expires_at = p_expires_at WHERE id = p_seller_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_set_seller_plan_expiry(uuid, timestamptz) TO authenticated;

-- Admins may already UPDATE sellers via admin_update_sellers (see
-- 033_protect_seller_fields) and the trigger there doesn't touch
-- plan_expires_at, so no additional RLS/trigger change is needed for the
-- column itself — these three functions are the only intended write path
-- for it beyond that.
