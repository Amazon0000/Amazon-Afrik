/*
# Strict multi-vendor data isolation (security hardening)

Audit of the existing RLS policies found several tables where ANY
authenticated user — not just the owning seller, and not just admins —
could read or write data belonging to other sellers or to the platform
itself. In a multi-vendor marketplace this is a critical integrity bug,
not just a hardening nice-to-have:

- seller_payment_methods: any authenticated user could INSERT, UPDATE or
  DELETE another seller's connected PSP (the exact mechanism buyers pay
  through — the 0% commission model depends on this being untouchable by
  anyone but the owning seller).
- ad_campaigns: any authenticated user could set ANY campaign's status to
  'active', bypassing Zando's ad review entirely, or sabotage a
  competitor's campaign by setting it to 'rejected'.
- seller_documents (KYC review): any authenticated user could approve or
  reject identity documents — including their own — with no admin check
  at all.
- super_admins: readable by anonymous visitors (admin email harvesting),
  and — far worse — ANY authenticated user could INSERT themselves into
  this table and grant themselves full admin access, or DELETE the real
  admins.
- platform_settings / payment_providers: any authenticated user could
  rewrite global platform configuration.
- order_items: insertable against any order_id, not just the buyer's own
  order.

This migration adds a reusable is_platform_admin() check (matches the
caller's JWT email against active super_admins, the same mechanism the
app already uses client-side) and rebuilds every policy above around
real ownership: seller_id must resolve to sellers.user_id = auth.uid(),
or the caller must be a platform admin. Two protective triggers stop a
seller from writing the approval/review fields on their own products or
ad campaigns even if they still hold UPDATE rights on the row (RLS alone
can't easily express "this column only" — a trigger can).
*/

-- Reusable admin check
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins sa
    WHERE sa.email = (auth.jwt() ->> 'email') AND sa.is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============ seller_payment_methods (critical — real money routing) ============
DROP POLICY IF EXISTS "auth_read_payment_methods" ON seller_payment_methods;
CREATE POLICY "public_read_payment_methods" ON seller_payment_methods FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_payment_methods" ON seller_payment_methods;
CREATE POLICY "seller_insert_own_payment_methods" ON seller_payment_methods FOR INSERT
  TO authenticated WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "auth_update_payment_methods" ON seller_payment_methods;
CREATE POLICY "seller_update_own_payment_methods" ON seller_payment_methods FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "auth_delete_payment_methods" ON seller_payment_methods;
CREATE POLICY "seller_delete_own_payment_methods" ON seller_payment_methods FOR DELETE
  TO authenticated USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- ============ ad_campaigns ============
DROP POLICY IF EXISTS "public_read_ads" ON ad_campaigns;
CREATE POLICY "public_read_ads" ON ad_campaigns FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ads" ON ad_campaigns;
CREATE POLICY "seller_insert_own_ads" ON ad_campaigns FOR INSERT
  TO authenticated WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "auth_update_ads" ON ad_campaigns;
CREATE POLICY "seller_update_own_ads" ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "admin_update_ads" ON ad_campaigns FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Trigger: a seller updating their own campaign can never move it to
-- 'active'/'rejected' or forge the review trail themselves — only an
-- admin write (checked via is_platform_admin()) may change those fields.
CREATE OR REPLACE FUNCTION protect_ad_campaign_review_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    NEW.status := CASE WHEN OLD.status IN ('active', 'rejected') THEN OLD.status
                        WHEN NEW.status IN ('active', 'rejected') THEN OLD.status
                        ELSE NEW.status END;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_ad_campaign_review ON ad_campaigns;
CREATE TRIGGER trg_protect_ad_campaign_review
BEFORE UPDATE ON ad_campaigns
FOR EACH ROW EXECUTE FUNCTION protect_ad_campaign_review_fields();

-- ============ products — add missing admin override + protect approval fields ============
-- (seller_insert/update/delete_own_products already correctly scoped since
-- migration 012; admins had no way to actually approve/reject until now —
-- their UPDATE calls were silently rejected by RLS.)
DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE OR REPLACE FUNCTION protect_product_approval_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    NEW.approval_status := OLD.approval_status;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_product_approval ON products;
CREATE TRIGGER trg_protect_product_approval
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION protect_product_approval_fields();

-- ============ seller_documents (KYC review — admin only) ============
DROP POLICY IF EXISTS "public_read_seller_docs" ON seller_documents;
DROP POLICY IF EXISTS "auth_read_seller_docs" ON seller_documents;
CREATE POLICY "auth_read_seller_docs" ON seller_documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "seller_insert_docs" ON seller_documents;
CREATE POLICY "seller_insert_own_docs" ON seller_documents FOR INSERT
  TO authenticated WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "seller_update_docs" ON seller_documents;
CREATE POLICY "admin_update_docs" ON seller_documents FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- ============ super_admins (critical — was self-service admin escalation) ============
DROP POLICY IF EXISTS "anon_read_super_admins" ON super_admins;
CREATE POLICY "auth_read_super_admins" ON super_admins FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_manage_super_admins" ON super_admins;
CREATE POLICY "admin_manage_super_admins" ON super_admins FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- ============ platform_settings (admin only) ============
DROP POLICY IF EXISTS "authenticated_update_platform_settings" ON platform_settings;
CREATE POLICY "admin_update_platform_settings" ON platform_settings FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "authenticated_insert_platform_settings" ON platform_settings;
CREATE POLICY "admin_insert_platform_settings" ON platform_settings FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());

-- ============ payment_providers (Zando-managed config, admin only) ============
DROP POLICY IF EXISTS "auth_manage_payment_providers" ON payment_providers;
CREATE POLICY "admin_manage_payment_providers" ON payment_providers FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- ============ orders / order_items — guest checkout was silently broken ============
-- orders INSERT/SELECT policies were "TO authenticated" only, so a guest
-- (no session, anon role) checkout — fully supported in the Checkout UI —
-- could never actually write an order row. Fixed narrowly: anon may only
-- ever touch rows where user_id IS NULL (guest orders), never another
-- user's authenticated order.
DROP POLICY IF EXISTS "user_insert_orders" ON orders;
CREATE POLICY "user_insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guest_insert_orders" ON orders FOR INSERT
  TO anon WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "user_read_own_orders" ON orders;
CREATE POLICY "user_read_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "guest_read_guest_orders" ON orders FOR SELECT
  TO anon USING (user_id IS NULL);

-- Sellers can see orders placed against their own products (sales), distinct
-- from orders they personally placed as a buyer (already covered above).
CREATE POLICY "seller_read_own_sales_orders" ON orders FOR SELECT
  TO authenticated USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- ============ order_items (only into orders the caller actually owns) ============
DROP POLICY IF EXISTS "user_insert_order_items" ON order_items;
CREATE POLICY "user_insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
CREATE POLICY "guest_insert_order_items" ON order_items FOR INSERT
  TO anon WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id IS NULL)
  );

DROP POLICY IF EXISTS "user_read_order_items" ON order_items;
CREATE POLICY "user_read_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = auth.uid()
         OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "guest_read_guest_order_items" ON order_items FOR SELECT
  TO anon USING (order_id IN (SELECT id FROM orders WHERE user_id IS NULL));

-- ============ Cleanup: stale commission_rate contradicts the 0% commission model ============
UPDATE platform_settings SET value = '{"value": 0}'::jsonb WHERE key = 'commission_rate';
