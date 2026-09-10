/*
# Systematic sweep: every write policy with qual/with_check literally 'true'
# (audit finding, applied live 2026-09-10) — found by directly querying
# pg_policies for the exact pattern that caused the super_admins/sellers
# vulnerabilities found earlier the same day.
*/

-- CRITICAL: products had TWO DELETE policies — a correctly-scoped one
-- from migration 012 (seller_delete_own_products) and the ORIGINAL,
-- never-removed one from migration 002 (seller_delete_products, USING
-- true). RLS policies are permissive-OR'd, so the dangerous one won:
-- any authenticated user could delete ANY seller's product.
DROP POLICY IF EXISTS "seller_delete_products" ON products;

-- compliance_cases (internal admin workflow — assigned_to, ai_risk_level,
-- internal_notes, resolution) was fully writable by any authenticated user.
DROP POLICY IF EXISTS "auth_insert_cases" ON compliance_cases;
CREATE POLICY "staff_insert_cases" ON compliance_cases FOR INSERT
  TO authenticated WITH CHECK (has_staff_permission('disputes', 'write'));
DROP POLICY IF EXISTS "auth_update_cases" ON compliance_cases;
CREATE POLICY "staff_update_cases" ON compliance_cases FOR UPDATE
  TO authenticated USING (has_staff_permission('disputes', 'write')) WITH CHECK (has_staff_permission('disputes', 'write'));

-- payouts (financial records the platform issues to sellers) was
-- insertable/updatable by any authenticated user.
DROP POLICY IF EXISTS "auth_insert_payouts" ON payouts;
CREATE POLICY "admin_insert_payouts" ON payouts FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());
DROP POLICY IF EXISTS "auth_update_payouts" ON payouts;
CREATE POLICY "admin_update_payouts" ON payouts FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- product_images/specifications/translations/variants were writable by
-- ANY authenticated user for ANY product — a competing seller could
-- delete or corrupt another seller's listing images, specs, or variants.
-- (Some of these turned out to already have separately-named, correctly
-- scoped policies too — this is additive/redundant there, harmless.)
DROP POLICY IF EXISTS "auth_write_product_images" ON product_images;
CREATE POLICY "seller_write_own_product_images" ON product_images FOR ALL
  TO authenticated
  USING (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "auth_write_specs" ON product_specifications;
CREATE POLICY "seller_write_own_product_specs" ON product_specifications FOR ALL
  TO authenticated
  USING (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "auth_write_prod_translations" ON product_translations;
CREATE POLICY "seller_write_own_product_translations" ON product_translations FOR ALL
  TO authenticated
  USING (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "auth_write_variants" ON product_variants;
CREATE POLICY "seller_write_own_product_variants" ON product_variants FOR ALL
  TO authenticated
  USING (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT p.id FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.user_id = auth.uid()));

-- store_health_scores was fully writable by any authenticated user —
-- anyone could fabricate or tamper with any seller's public trust score.
DROP POLICY IF EXISTS "auth_insert_health" ON store_health_scores;
CREATE POLICY "admin_insert_health" ON store_health_scores FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());
DROP POLICY IF EXISTS "auth_update_health" ON store_health_scores;
CREATE POLICY "admin_update_health" ON store_health_scores FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- flash_sales — legacy/unused table (no code references found), locked
-- down for hygiene in case it's ever wired up later.
DROP POLICY IF EXISTS "auth_manage_flash_sales" ON flash_sales;
CREATE POLICY "admin_manage_flash_sales" ON flash_sales FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- audit_logs INSERT stays open (many legitimate client-side log calls
-- throughout the app), but now prevents impersonating another user's
-- actor_id — a minor integrity hardening now that we're here.
DROP POLICY IF EXISTS "auth_insert_audit_logs" ON audit_logs;
CREATE POLICY "auth_insert_own_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());
