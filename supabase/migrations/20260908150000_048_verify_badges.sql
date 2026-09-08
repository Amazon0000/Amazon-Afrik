/*
# Verify Badges — decouple "can sell" from "KYC verified"

## Problem found
`sellers.status` currently does two unrelated jobs at once: it's both the
switch that makes a seller's shop/products visible to buyers (every
buyer-facing query filters `status = 'approved'`) AND the record of
whether Zando has manually reviewed anything. The onboarding trigger
(migration 030) hardcodes new sellers to `status = 'pending'`, which means
today a brand-new seller's shop is invisible and they cannot effectively
sell anything until a Super Admin manually flips one flag — contradicting
the intended flow: sellers should be able to post products and sell
immediately, carrying an "Unverified Seller" badge, with manual KYC review
only upgrading them to a trust badge, not gating their ability to operate.

## Fix
- `sellers.is_verified` (new, independent axis): false by default. Only a
  Super Admin approving KYC sets this true. Never touched by signup.
- `sellers.verified_at` / `verified_by`: audit trail of who approved and
  when.
- Onboarding trigger now creates sellers as `status = 'approved'`
  (able to operate immediately) instead of `'pending'`. `status` remains
  fully available for its original purpose — Trust & Safety can still
  suspend or reject a seller (`status = 'suspended' | 'rejected'`) which
  still correctly removes them from all buyer-facing queries, since those
  already filter on `status = 'approved'`. Only the DEFAULT on signup
  changes; nothing about how existing suspension/rejection works changes.
*/

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id);

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
    coalesce(nullif(meta->>'seller_plan', ''), 'starter'),
    coalesce(nullif(meta->>'seller_plan', ''), 'starter'),
    'trial',
    now(),
    now() + interval '14 days',
    'approved' -- auto-approved: seller can sell immediately, unverified badge shown until KYC review
  );

  RETURN NEW;
END;
$$;

-- One-time catch-up: sellers stuck on 'pending' from before this fix, who
-- have no rejection/suspension history, should not remain invisible.
UPDATE sellers SET status = 'approved' WHERE status = 'pending';

-- ============ Tighten seller-kyc read access ============
-- Migration 013 gave every authenticated user read access to the whole
-- seller-kyc bucket (`USING (bucket_id = 'seller-kyc')`, no ownership
-- check) — meaning any logged-in buyer could browse any seller's ID scan
-- by path. Files are stored as "{seller_id}/{doc_type}-{ts}.ext", so we can
-- now scope reads to the owning seller or a platform admin/qualified staff
-- member, using the role helpers already introduced in migration 037.
DROP POLICY IF EXISTS "auth_read_seller_kyc" ON storage.objects;
CREATE POLICY "auth_read_seller_kyc"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-kyc'
  AND (
    has_staff_permission('kyc', 'view')
    OR EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id::text = (storage.foldername(storage.objects.name))[1]
        AND sellers.user_id = auth.uid()
    )
  )
);
