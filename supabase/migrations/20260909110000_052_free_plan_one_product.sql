/*
# Add the permanent Free plan (1 product) alongside paid plans

Clarified plan structure (confirmed explicitly, overriding an earlier
mistaken assumption that there was no free tier at all):
  - free: permanent, $0, 1 active product max, no trial/expiry concept.
  - starter ($9) / premium ($29) / enterprise ($79): paid, each starts with
    a 14-day free trial (full access, unbilled) before the first real
    charge via the central PSP.

This migration:
1. Widens sellers.plan to also allow 'free'.
2. Rewrites the onboarding trigger: a seller who didn't pick a paid plan
   during signup gets 'free' (permanent, no trial fields needed) instead of
   silently defaulting into a $9 trial they never asked for. A seller who
   did pick a paid plan keeps the existing 14-day trial behavior.
3. is_seller_plan_active(): 'free' is unconditionally active (it's
   permanent by definition) — separate from the product-count cap below.
4. Real enforcement of the free plan's 1-product cap at the DB layer
   (defense-in-depth alongside the app-layer guard/upgrade modal in
   SellerCenterPage) — replaces the earlier 2-product cap I built and then
   removed under the wrong "no free plan" assumption; this one is correct
   and cap=1 per this clarification.
*/

ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_plan_check;
ALTER TABLE sellers ADD CONSTRAINT sellers_plan_check
  CHECK (plan IN ('free', 'starter', 'premium', 'enterprise'));
DO $$
BEGIN
  ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_plan_selected_check;
  ALTER TABLE sellers ADD CONSTRAINT sellers_plan_selected_check
    CHECK (plan_selected IS NULL OR plan_selected IN ('free', 'starter', 'premium', 'enterprise'));
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION handle_new_seller_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  base_slug text;
  final_slug text;
  suffix int := 0;
  chosen_plan text;
BEGIN
  meta := NEW.raw_user_meta_data;

  IF coalesce(meta->>'role', '') <> 'seller' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM sellers WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  base_slug := coalesce(nullif(meta->>'store_slug', ''), lower(regexp_replace(coalesce(meta->>'business_name', 'store'), '[^a-z0-9]+', '-', 'gi')));
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM sellers WHERE store_slug = final_slug) LOOP
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  END LOOP;

  -- Default to the permanent free plan unless the seller explicitly chose
  -- a paid tier during onboarding (via the Plans page deep-link).
  chosen_plan := coalesce(nullif(meta->>'seller_plan', ''), 'free');
  IF chosen_plan NOT IN ('free', 'starter', 'premium', 'enterprise') THEN
    chosen_plan := 'free';
  END IF;

  INSERT INTO sellers (
    user_id, business_name, store_slug, description, business_address,
    country_id, business_type, registration_number, vat_number,
    warehouse_address, shipping_zone,
    bank_name, bank_iban, bank_swift, mobile_money_number,
    ship_national, ship_international, ship_express, ship_local, ship_pickup,
    plan, plan_selected, subscription_status, trial_starts_at, trial_ends_at, status
  ) VALUES (
    NEW.id,
    coalesce(meta->>'business_name', meta->>'store_name', 'My Store'),
    final_slug,
    meta->>'store_desc',
    meta->>'business_address',
    nullif(meta->>'country_id', ''),
    nullif(meta->>'business_type', ''),
    meta->>'registration_number',
    meta->>'vat_number',
    meta->>'warehouse_address',
    meta->>'shipping_zone',
    meta->>'bank_name',
    meta->>'iban',
    meta->>'swift',
    meta->>'mobile_money',
    coalesce((meta->>'ship_national')::boolean, true),
    coalesce((meta->>'ship_international')::boolean, false),
    coalesce((meta->>'ship_express')::boolean, false),
    coalesce((meta->>'ship_local')::boolean, true),
    coalesce((meta->>'ship_pickup')::boolean, false),
    chosen_plan,
    chosen_plan,
    CASE WHEN chosen_plan = 'free' THEN 'active' ELSE 'trial' END,
    CASE WHEN chosen_plan = 'free' THEN NULL ELSE now() END,
    CASE WHEN chosen_plan = 'free' THEN NULL ELSE now() + interval '14 days' END,
    'approved' -- auto-approved: seller can sell immediately, unverified badge shown until KYC review
  );

  RETURN NEW;
END;
$$;

-- ============ is_seller_plan_active(): free plan is always active ============
CREATE OR REPLACE FUNCTION is_seller_plan_active(p_seller_id uuid)
RETURNS boolean AS $$
  SELECT
    plan = 'free' -- permanent by definition
    OR (subscription_status = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at > now())
    OR (plan_expires_at IS NOT NULL AND plan_expires_at > now())
    OR (plan_expires_at IS NULL AND subscription_status = 'active' AND plan <> 'free') -- explicit admin-granted indefinite paid plan
  FROM sellers WHERE id = p_seller_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============ Real 1-product cap for the free plan ============
CREATE OR REPLACE FUNCTION enforce_free_plan_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_plan text;
  active_count int;
BEGIN
  SELECT plan INTO seller_plan FROM sellers WHERE id = NEW.seller_id;
  IF seller_plan IS DISTINCT FROM 'free' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO active_count FROM products
    WHERE seller_id = NEW.seller_id AND is_active = true
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_count >= 1 THEN
    RAISE EXCEPTION 'FREE_PLAN_LIMIT_REACHED: Free plan sellers are limited to 1 active product. Upgrade to add more.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_free_plan_product_limit ON products;
CREATE TRIGGER trg_enforce_free_plan_product_limit
BEFORE INSERT OR UPDATE OF is_active, seller_id ON products
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION enforce_free_plan_product_limit();
