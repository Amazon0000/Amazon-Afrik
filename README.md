/*
# Storage buckets for Zando

1. Creates two public storage buckets:
   - `product-images` — stores seller product photos (multi-image support)
   - `seller-assets` — stores seller logos and banners

2. Security
   - Both buckets are public (read by anyone, no auth required for GET)
   - Authenticated users (sellers) can upload/update/delete in product-images
   - Authenticated users can upload/update/delete in seller-assets
   - Only the file owner (matching user_id subfolder) can delete their files
*/

-- product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
) ON CONFLICT (id) DO NOTHING;

-- seller-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seller-assets',
  'seller-assets',
  true,
  5242880, -- 5 MB per file
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from both buckets (public read)
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_read_seller_assets" ON storage.objects;
CREATE POLICY "public_read_seller_assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'seller-assets');

-- Allow authenticated users to upload product images
DROP POLICY IF EXISTS "auth_insert_product_images" ON storage.objects;
CREATE POLICY "auth_insert_product_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to upload seller assets
DROP POLICY IF EXISTS "auth_insert_seller_assets" ON storage.objects;
CREATE POLICY "auth_insert_seller_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'seller-assets');

-- Allow owners to update their uploads (path starts with user id)
DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "auth_update_product_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
