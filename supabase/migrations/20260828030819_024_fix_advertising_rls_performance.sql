/*
# Fix: auth_rls_initplan (Performance Advisor Supabase)

auth.uid()/auth.jwt() était réévalué ligne par ligne dans les policies du
module Advertising au lieu d'une fois par requête. Wrap en
(select auth.<fn>()) comme recommandé par Supabase. Comportement identique,
juste plus rapide à l'échelle. Supprime aussi idx_ads_status, doublon de
idx_ad_campaigns_status détecté par le Performance Advisor.
*/

DROP POLICY IF EXISTS "superadmin_manage_placements" ON advertising_placements;
CREATE POLICY "superadmin_manage_placements" ON advertising_placements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));

DROP POLICY IF EXISTS "superadmin_read_all_plans" ON advertising_plans;
CREATE POLICY "superadmin_read_all_plans" ON advertising_plans
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));

DROP POLICY IF EXISTS "superadmin_manage_plans" ON advertising_plans;
CREATE POLICY "superadmin_manage_plans" ON advertising_plans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));

DROP POLICY IF EXISTS "seller_insert_own_campaigns" ON ad_campaigns;
CREATE POLICY "seller_insert_own_campaigns" ON ad_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    AND product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "seller_read_own_campaigns" ON ad_campaigns;
CREATE POLICY "seller_read_own_campaigns" ON ad_campaigns
  FOR SELECT TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true)
  );

DROP POLICY IF EXISTS "seller_cancel_own_pending_campaigns" ON ad_campaigns;
CREATE POLICY "seller_cancel_own_pending_campaigns" ON ad_campaigns
  FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())) AND payment_status = 'pending')
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "superadmin_manage_campaigns" ON ad_campaigns;
CREATE POLICY "superadmin_manage_campaigns" ON ad_campaigns
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));

DROP POLICY IF EXISTS "seller_read_own_payments" ON advertising_payments;
CREATE POLICY "seller_read_own_payments" ON advertising_payments
  FOR SELECT TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true)
  );

DROP POLICY IF EXISTS "seller_read_own_events" ON advertising_events;
CREATE POLICY "seller_read_own_events" ON advertising_events
  FOR SELECT TO authenticated
  USING (
    campaign_id IN (
      SELECT ac.id FROM ad_campaigns ac
      JOIN sellers s ON ac.seller_id = s.id
      WHERE s.user_id = (select auth.uid())
    )
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true)
  );

DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
CREATE POLICY "user_read_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
CREATE POLICY "user_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "seller_insert_flash_deals" ON flash_deals;
CREATE POLICY "seller_insert_flash_deals" ON flash_deals FOR INSERT TO authenticated
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "seller_update_flash_deals" ON flash_deals;
CREATE POLICY "seller_update_flash_deals" ON flash_deals FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "superadmin_read_contact_messages" ON contact_messages;
CREATE POLICY "superadmin_read_contact_messages" ON contact_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));

DROP INDEX IF EXISTS idx_ads_status;
