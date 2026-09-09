/*
# Real affiliate tracking + richer application (explicit request)

## Problem
`affiliate_referrals` only records a SIGNUP (a seller who used the code) —
there was no tracking of raw link clicks at all, so an affiliate could
never see "how many people clicked my link" the way Amazon Associates
shows. The application also only asked for a name/email/audience
description, no verifiable social media link or photo.

## Fix
- `affiliates.social_link` (required at application) and `photo_url`
  (required, private-storage-backed like KYC docs).
- New `affiliate_clicks` table — one row per link visit, logged the
  moment `?ref=CODE` is seen (see store.tsx), independent of whether that
  visitor ever signs up. This is the real, per-link tracking the affiliate
  dashboard now shows (clicks vs. signups vs. paid conversions — the full
  Amazon-Associates-style funnel).
*/

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS social_link text,
  ADD COLUMN IF NOT EXISTS photo_url text;

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  landing_page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created ON affiliate_clicks(created_at);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can log a click — that's the whole
-- point, tracking real traffic before any signup happens. No PII is
-- captured, just a timestamp against the affiliate's own id.
DROP POLICY IF EXISTS "anyone_log_affiliate_click" ON affiliate_clicks;
CREATE POLICY "anyone_log_affiliate_click" ON affiliate_clicks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "affiliate_read_own_clicks" ON affiliate_clicks;
CREATE POLICY "affiliate_read_own_clicks" ON affiliate_clicks FOR SELECT
  TO authenticated USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Resolve a referral code to its affiliate id without exposing the whole
-- affiliates table publicly (mirrors the existing validate-code-style
-- function pattern already used elsewhere in this codebase).
CREATE OR REPLACE FUNCTION log_affiliate_click(p_referral_code text, p_landing_page text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  SELECT id INTO v_affiliate_id FROM affiliates WHERE referral_code = upper(p_referral_code) AND status = 'approved';
  IF v_affiliate_id IS NOT NULL THEN
    INSERT INTO affiliate_clicks (affiliate_id, landing_page) VALUES (v_affiliate_id, p_landing_page);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION log_affiliate_click(text, text) TO anon, authenticated;

-- Private storage for affiliate application photos — same pattern as
-- seller-kyc (private, sensitive), not public like product images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('affiliate-photos', 'affiliate-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_insert_affiliate_photos" ON storage.objects;
CREATE POLICY "auth_insert_affiliate_photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'affiliate-photos');

DROP POLICY IF EXISTS "auth_read_own_affiliate_photo" ON storage.objects;
CREATE POLICY "auth_read_own_affiliate_photo"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'affiliate-photos'
  AND (
    has_staff_permission('affiliates', 'view')
    OR (storage.foldername(storage.objects.name))[1] = auth.uid()::text
  )
);
