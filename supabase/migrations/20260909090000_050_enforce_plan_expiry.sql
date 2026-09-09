/*
# Real plan-expiry enforcement (full block) — audit finding

## Problem found
`is_seller_plan_active()` (migration 036) existed but was never called by
any frontend code, and even its own logic was broken for the current plan
model:
  - It returned TRUE unconditionally whenever `plan = 'starter'` — but
    starter is now a paid $9/mo tier (migration 049), not a free plan, so a
    lapsed starter subscriber was still being treated as permanently active.
  - It never looked at `trial_ends_at` / `subscription_status` at all, so
    the 14-day trial was purely decorative — nothing ever expired it.
Net effect: today, a seller pays once (or never pays, during trial) and
keeps full storefront access forever. No re-billing enforcement exists.

## Fix (per explicit decision: full block, not a soft downgrade)
- `is_seller_plan_active()` rewritten: active only while genuinely on an
  unexpired trial, OR while `plan_expires_at` is in the future. An admin
  can still grant indefinite access by leaving `plan_expires_at` NULL
  while `subscription_status = 'active'` (explicit manual override,
  distinct from "just never set").
- Public read policies on `products` and `sellers` now also require
  `is_seller_plan_active(seller_id)` — this is enforced at the RLS layer,
  not scattered across individual fetch functions, so it's impossible for
  a new query added later to accidentally bypass it. The seller's own
  session can always see their own row/products regardless (existing
  `user_id = auth.uid()` / `seller_read_own_products` policies untouched)
  — they need to be able to log in, see the "please pay" state, and pay.
*/

CREATE OR REPLACE FUNCTION is_seller_plan_active(p_seller_id uuid)
RETURNS boolean AS $$
  SELECT
    (subscription_status = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at > now())
    OR (plan_expires_at IS NOT NULL AND plan_expires_at > now())
    OR (plan_expires_at IS NULL AND subscription_status = 'active') -- explicit admin-granted indefinite plan
  FROM sellers WHERE id = p_seller_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============ Storefront enforcement ============
DROP POLICY IF EXISTS "public_select_approved_products" ON products;
CREATE POLICY "public_select_approved_products" ON products
  FOR SELECT TO anon, authenticated
  USING (approval_status = 'approved' AND is_active = true AND is_seller_plan_active(seller_id));

DROP POLICY IF EXISTS "public_read_approved_sellers" ON sellers;
CREATE POLICY "public_read_approved_sellers" ON sellers FOR SELECT TO anon, authenticated
  USING ((status = 'approved' AND is_seller_plan_active(id)) OR user_id = auth.uid());
