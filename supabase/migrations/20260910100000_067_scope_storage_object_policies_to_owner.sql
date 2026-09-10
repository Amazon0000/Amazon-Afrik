/*
# Storage-layer equivalent of the products/product_images RLS gaps
# (applied live 2026-09-10)

product-images, digital-products, and seller-assets INSERT/UPDATE/DELETE
policies only checked bucket_id — not ownership. Any authenticated user
could upload into, overwrite, or delete another seller's product photos,
paid digital product files, or store logo/banner directly in storage,
independent of the (correctly-scoped) database row policies. All three
buckets use the same upload path convention (${sellerId}/filename, see
uploadProductImage/uploadDigitalFile/uploadSellerAsset in src/lib/db.ts),
so ownership can be verified the same way seller-kyc already does, via
the first path segment.
*/

DROP POLICY IF EXISTS "auth_insert_product_images" ON storage.objects;
CREATE POLICY "seller_insert_own_product_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "seller_update_own_product_images" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "seller_delete_own_product_images" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_insert_digital_products" ON storage.objects;
CREATE POLICY "seller_insert_own_digital_products" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'digital-products'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_update_digital_products" ON storage.objects;
CREATE POLICY "seller_update_own_digital_products" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'digital-products'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_delete_digital_products" ON storage.objects;
CREATE POLICY "seller_delete_own_digital_products" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'digital-products'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_insert_seller_assets" ON storage.objects;
CREATE POLICY "seller_insert_own_assets" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'seller-assets'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM sellers WHERE user_id = auth.uid())
  );
