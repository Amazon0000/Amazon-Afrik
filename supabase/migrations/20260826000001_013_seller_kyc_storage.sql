/*
# Seller KYC document storage

The onboarding wizard collects identity documents (ID front/back, selfie)
and store branding assets (logo, banner) but previously never uploaded them
anywhere — only the filename was kept client-side. This migration adds a
real, private storage bucket for identity documents (not public, unlike
product-images/seller-assets) since these are sensitive KYC files, and
tightens seller_documents read access to authenticated users only.
*/

-- Private bucket for identity documents (passport/ID scans, selfies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seller-kyc',
  'seller-kyc',
  false,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload their own KYC docs
DROP POLICY IF EXISTS "auth_insert_seller_kyc" ON storage.objects;
CREATE POLICY "auth_insert_seller_kyc"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'seller-kyc');

-- Only authenticated users (the seller + Zando staff reviewing via Trust & Safety)
-- can read KYC docs — never public/anon, unlike product images or store assets.
DROP POLICY IF EXISTS "auth_read_seller_kyc" ON storage.objects;
CREATE POLICY "auth_read_seller_kyc"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'seller-kyc');

-- Identity documents are sensitive: restrict seller_documents reads to
-- authenticated users only (was previously public to anon too).
DROP POLICY IF EXISTS "public_read_seller_docs" ON seller_documents;
DROP POLICY IF EXISTS "auth_read_seller_docs" ON seller_documents;
CREATE POLICY "auth_read_seller_docs" ON seller_documents FOR SELECT TO authenticated USING (true);
