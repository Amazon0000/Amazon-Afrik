/*
# Protect seller-editable fields from self-service tampering

Audit found seller_update_own (sellers table) only checked ownership
(auth.uid() = user_id), not which columns were being changed. A seller
could legitimately edit their own store profile through this policy —
but could just as easily call the same update to set their own
status = 'approved' (bypassing admin review entirely), rating = 5,
is_official = true, or total_reviews/total_products to anything, all
directly, with no admin action involved.

Same protective-trigger pattern as products/ad_campaigns/affiliates:
sellers may freely edit their own store profile fields, but status,
rating, total_reviews, total_products, is_official, and joined_year are
pinned to their previous value unless the caller is a platform admin.
plan/plan_selected are deliberately left seller-editable — self-service
plan changes are the real, intended flow (see updateSellerPlan()).
*/

CREATE OR REPLACE FUNCTION protect_seller_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.total_reviews := OLD.total_reviews;
    NEW.total_products := OLD.total_products;
    NEW.is_official := OLD.is_official;
    NEW.joined_year := OLD.joined_year;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_seller_fields ON sellers;
CREATE TRIGGER trg_protect_seller_fields
BEFORE UPDATE ON sellers
FOR EACH ROW EXECUTE FUNCTION protect_seller_fields();

-- Admin needs an actual UPDATE policy to pass RLS in the first place
-- (previously only the owning seller could ever update their own row).
DROP POLICY IF EXISTS "admin_update_sellers" ON sellers;
CREATE POLICY "admin_update_sellers" ON sellers FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
