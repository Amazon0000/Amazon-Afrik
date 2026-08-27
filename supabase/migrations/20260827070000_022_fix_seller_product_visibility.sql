/*
# Fix: sellers could never see their own products (critical bug)

Root cause: the only SELECT policy on products was
"public_select_approved_products" (approval_status = 'approved' AND
is_active = true). New products default to approval_status = 'pending'
until an admin reviews them — so a seller who just created a product
could never read it back.

This silently broke product creation end-to-end: createProduct() chains
.insert(...).select('id').single() to get the new row's id, but with no
matching SELECT policy that select returned zero rows, .single() errored,
and createProduct() returned null — so the UI reported "product creation
failed" on every single attempt, even though the INSERT itself had
actually succeeded in the database. It also meant the seller's own
Products tab could never list their pending or rejected products, only
ones already approved (or nothing at all for a brand-new seller).

Adds a SELECT policy letting a seller see all of their own products,
in any approval_status, alongside the existing public policy that only
ever shows approved+active products to everyone else.
*/

DROP POLICY IF EXISTS "seller_read_own_products" ON products;
CREATE POLICY "seller_read_own_products" ON products FOR SELECT
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Same gap exists for product_images (a seller must be able to see the
-- images on their own not-yet-approved products, e.g. right after upload).
DROP POLICY IF EXISTS "seller_read_own_product_images" ON product_images;
CREATE POLICY "seller_read_own_product_images" ON product_images FOR SELECT
  TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN sellers s ON s.id = p.seller_id
    WHERE s.user_id = auth.uid()
  ));
