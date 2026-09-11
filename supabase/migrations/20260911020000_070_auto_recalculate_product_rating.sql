/*
# products.rating / total_reviews were never actually recalculated
# (audit finding, applied live 2026-09-11)

Confirmed by searching every function in the database for any reference
to total_reviews — nothing updated it. A buyer submitting a real,
verified review never changed the product's displayed star rating or
review count at all; those fields were static from whenever the product
was created. This also matters directly for review moderation: deleting
a fake/abusive review must correctly update the product's rating, or an
admin's moderation action would silently leave a stale, wrong rating
displayed to every buyer.
*/

CREATE OR REPLACE FUNCTION recalculate_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_product_id uuid;
  new_avg numeric;
  new_count int;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO new_avg, new_count
  FROM reviews WHERE product_id = target_product_id;

  UPDATE products
  SET rating = ROUND(new_avg::numeric, 1), total_reviews = new_count
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_product_rating ON reviews;
CREATE TRIGGER trg_recalculate_product_rating
AFTER INSERT OR UPDATE OF rating OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION recalculate_product_rating();

-- Backfill existing products so current displayed ratings match reality
-- immediately, not just going forward.
UPDATE products p
SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.product_id = p.id), 0),
    total_reviews = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id), 0);
