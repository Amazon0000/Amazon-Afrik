/*
# Real "verified purchase" reviews, one review per buyer per product

createReview() hardcoded is_verified: true for every single review, with
zero purchase check behind it — the "Verified Purchase" badge shown
throughout the app (product cards, product page, reviews list) was
meaningless: anyone with an account could post a fake verified review on
any product they'd never bought, and the reviews_confirmed_buyers_only
platform setting did nothing at all. There was also no protection
against the same buyer posting multiple reviews for the same product.

Fixed with a trigger that computes is_verified server-side (true only if
the reviewing user has a delivered order containing this exact product —
never trusted from client input) and a UNIQUE(product_id, user_id)
constraint so a buyer can only ever have one review per product (they
can still edit it via UPDATE).
*/

-- One review per buyer per product. Deduplicate first (keep the most
-- recent) so this migration is safe to run against real data that may
-- already contain duplicates from before this constraint existed.
DELETE FROM reviews a USING reviews b
WHERE a.product_id = b.product_id
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL
  AND a.created_at < b.created_at;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_user_unique;
ALTER TABLE reviews ADD CONSTRAINT reviews_product_user_unique UNIQUE (product_id, user_id);

CREATE OR REPLACE FUNCTION set_review_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_verified := EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = NEW.product_id
      AND o.user_id = NEW.user_id
      AND o.status = 'delivered'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_review_verified ON reviews;
CREATE TRIGGER trg_set_review_verified
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_review_verified_status();

-- A reviewer may only ever insert a review under their own user_id (was
-- previously WITH CHECK (true) — anyone could insert a review authored
-- as anyone else).
DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "auth_update_own_review" ON reviews;
CREATE POLICY "auth_update_own_review" ON reviews FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "auth_delete_own_review" ON reviews;
CREATE POLICY "auth_delete_own_review" ON reviews FOR DELETE
  TO authenticated USING (user_id = auth.uid());
