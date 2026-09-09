/*
# Real affiliate tracking (audit finding + explicit request)

## Problem
The affiliate program only ever tracked two funnel stages: signup
(affiliate_referrals row created) and conversion (paid plan). It never
tracked raw link clicks at all — an affiliate had no way to know how many
people actually clicked their link, only how many of those went on to
create a seller account. A real "affiliate marketing, paid by link" model
(Amazon Associates style) needs the full funnel: clicks -> signups ->
conversions.

Also: applying as an affiliate only collected a name/email/audience
description — no social media link and no photo, which makes it hard to
actually vet who's applying to represent the brand.

## Fix
- `affiliates.social_link` / `affiliates.photo_url` — captured at
  application.
- `affiliate_clicks` — one row per real click on a ?ref= link, resolved
  server-side via a SECURITY DEFINER function (same trust pattern as the
  existing resolve_affiliate_code) so a click can never be attributed to a
  fabricated affiliate id from the client. Public INSERT (clicks happen
  before any login), but only the owning affiliate (or staff) can read
  their own click rows back.
*/

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS social_link text,
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Affiliate profile photos — public bucket, mirrors seller-assets (this
-- is a public-facing profile picture, not a sensitive document).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'affiliate-photos',
  'affiliate-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_affiliate_photos" ON storage.objects;
CREATE POLICY "public_read_affiliate_photos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'affiliate-photos');

DROP POLICY IF EXISTS "auth_insert_affiliate_photos" ON storage.objects;
CREATE POLICY "auth_insert_affiliate_photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'affiliate-photos');

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  landing_page text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_read_own_clicks" ON affiliate_clicks;
CREATE POLICY "affiliate_read_own_clicks" ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));
-- No client INSERT policy — clicks are recorded exclusively through the
-- record_affiliate_click() function below (SECURITY DEFINER), which
-- resolves the code server-side rather than trusting an affiliate_id sent
-- directly from the browser.

CREATE OR REPLACE FUNCTION record_affiliate_click(p_code text, p_landing_page text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  SELECT id INTO v_affiliate_id FROM affiliates WHERE referral_code = upper(p_code) AND status = 'approved';
  IF v_affiliate_id IS NOT NULL THEN
    INSERT INTO affiliate_clicks (affiliate_id, landing_page) VALUES (v_affiliate_id, p_landing_page);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION record_affiliate_click(text, text) TO anon, authenticated;
