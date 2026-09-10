/*
# CRITICAL: strict multi-vendor data isolation (audit finding, applied live 2026-09-10)

Deep audit found this fix had been written early in the project
(originally filed as "016_strict_data_isolation") but a filename
collision with a different, already-applied "016" migration silently
hid that it had NEVER been applied to the live database. Verified
directly against the live schema — the result was catastrophic:

  - super_admins: ANY authenticated user (any buyer or seller) could
    INSERT themselves into this table and grant themselves full
    platform admin access, or DELETE the real admins. Also readable by
    anonymous visitors.
  - seller_payment_methods: any authenticated user could INSERT, UPDATE
    or DELETE another seller's connected PSP — the exact mechanism
    buyers pay through.
  - seller_documents (KYC review): any authenticated user — including
    the seller themself — could approve or reject identity documents,
    with no admin check at all.
  - platform_settings / payment_providers: any authenticated user could
    rewrite global platform configuration.

This file applies only the portions still needed at the time this gap
was found — ad_campaigns and products approval-field protection, and
orders/order_items scoping, were confirmed already covered by other
migrations that HAD been applied (024_fix_advertising_rls_performance
and 062_fix_orders_order_items_rls_gaps respectively) — so they are not
repeated here to avoid redundant/conflicting policy churn.
*/

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

-- ============ seller_documents (KYC review — admin only) ============
DROP POLICY IF EXISTS "public_read_seller_docs" ON seller_documents;
DROP POLICY IF EXISTS "seller_read_own_documents" ON seller_documents;
CREATE POLICY "auth_read_seller_docs" ON seller_documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "seller_update_own_documents" ON seller_documents;
CREATE POLICY "admin_update_docs" ON seller_documents FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- ============ super_admins (CRITICAL — was self-service admin escalation) ============
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
