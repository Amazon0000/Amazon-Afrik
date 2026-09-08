/*
# Digital products (instant delivery)

Adds support for digital goods (PDF/ZIP/audio/etc.) alongside existing
physical products, with secure, purchase-gated file delivery.

## Schema changes
- `products.product_type` ('physical' | 'digital', default 'physical' so
  every existing row stays physical with zero backfill needed)
- `products.digital_file_path` / `digital_file_name` / `digital_file_size`
  — set only when product_type = 'digital'
- `order_items.product_type` and `order_items.digital_file_path` — a
  SNAPSHOT taken at purchase time. This matters: if a seller later
  replaces or deletes the file on the product, a buyer who already paid
  keeps working access to the exact file they bought.

## Storage
Private bucket `digital-products` (unlike product-images/seller-assets,
this is NOT publicly readable — these are paid files). Sellers can upload
into it like the other buckets (same authenticated-write convention used
by product-images/seller-assets in migration 006). Critically, this
migration does NOT add a SELECT policy on storage.objects for this
bucket — there is no safe RLS shortcut here, since any policy scoped to
"authenticated" would let any logged-in buyer download any seller's paid
file for free. Reads are only ever granted through the `digital-download`
Edge Function using the service role, after it verifies the requester
actually purchased that exact product (checked against `orders` +
`order_items`, covering both logged-in buyers and guest checkout via
email match). This mirrors the tighter pattern already used for
`seller-kyc` (private, sensitive) rather than the looser public buckets.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital')),
  ADD COLUMN IF NOT EXISTS digital_file_path text,
  ADD COLUMN IF NOT EXISTS digital_file_name text,
  ADD COLUMN IF NOT EXISTS digital_file_size bigint;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital')),
  ADD COLUMN IF NOT EXISTS digital_file_path text;

-- Private bucket for paid digital files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  false,
  524288000, -- 500 MB per file (ebooks/zips/audio)
  ARRAY[
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a',
    'video/mp4', 'video/quicktime',
    'application/epub+zip', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Sellers can upload their digital files (same broad authenticated-write
-- convention as product-images/seller-assets — see migration 006).
DROP POLICY IF EXISTS "auth_insert_digital_products" ON storage.objects;
CREATE POLICY "auth_insert_digital_products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'digital-products');

DROP POLICY IF EXISTS "auth_update_digital_products" ON storage.objects;
CREATE POLICY "auth_update_digital_products"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'digital-products');

DROP POLICY IF EXISTS "auth_delete_digital_products" ON storage.objects;
CREATE POLICY "auth_delete_digital_products"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'digital-products');

-- Deliberately NO SELECT policy here — reads only via the digital-download
-- Edge Function (service role), gated on actual purchase. See header note.
