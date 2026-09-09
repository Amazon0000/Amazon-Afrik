/*
# Buyer Protection audit — critical RLS gaps found

## Bug found: compliance_reports readable/writable by anyone
`auth_read_reports` (migration 007) used `USING (true)` for ANY
authenticated user — meaning every buyer or seller could read every other
user's fraud/abuse reports, including descriptions of disputes that may
name other people. `auth_update_reports` similarly let any authenticated
user edit ANY report's status — a buyer could "resolve" or tamper with a
report filed against them. This is fixed here: read is scoped to the
reporter themselves or platform staff; update is staff-only.

## Bug found: audit_logs readable/writable by anyone
Same root problem, same migration: `auth_read_audit_logs` let any
authenticated user read the entire moderation/admin action history
(seller suspensions, plan changes, etc.), and `auth_insert_audit_logs` let
any authenticated user insert arbitrary log entries — meaning a user could
forge a fake audit trail. Read is now staff-only; insert (still needed —
app code logs actions as the acting user) is unchanged since the write
itself is benign (an audit trail can't be "faked" into having taken a real
admin action; only a real update to sellers/products/etc. does that), but
read access to the trail itself is now restricted.

## No buyer-facing way to actually submit a report
createComplianceReport() (src/lib/db.ts) existed and worked, but no
frontend page ever called it — buyers had a seller-mediated return system
(migration 034) but no path to escalate to Zando if a seller doesn't
respond or a return is unfairly rejected. This migration adds the columns
needed for a real dispute workflow (evidence, response deadlines,
resolution) so the new Buyer/Seller Protection UI has real data to work
with, not just a bare report row.
*/

-- ============ Lock down compliance_reports ============
DROP POLICY IF EXISTS "auth_read_reports" ON compliance_reports;
CREATE POLICY "auth_read_reports" ON compliance_reports FOR SELECT
  TO authenticated USING (
    reporter_id = auth.uid()
    OR has_staff_permission('disputes', 'view')
  );

DROP POLICY IF EXISTS "auth_update_reports" ON compliance_reports;
CREATE POLICY "auth_update_reports" ON compliance_reports FOR UPDATE
  TO authenticated
  USING (has_staff_permission('disputes', 'write'))
  WITH CHECK (has_staff_permission('disputes', 'write'));

-- Reporter identity must match the submitting user — prevents filing a
-- report that impersonates someone else as the reporter.
DROP POLICY IF EXISTS "auth_insert_reports" ON compliance_reports;
CREATE POLICY "auth_insert_reports" ON compliance_reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id IS NULL OR reporter_id = auth.uid());

-- Evidence/response fields for a real dispute workflow (order-linked
-- reports specifically — target_type='order').
ALTER TABLE compliance_reports
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evidence_urls text[],
  ADD COLUMN IF NOT EXISTS seller_response text,
  ADD COLUMN IF NOT EXISTS seller_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);

-- Sellers can see reports filed against their own store/orders (needed so
-- they can actually respond) and add their response.
DROP POLICY IF EXISTS "seller_read_reports_against_them" ON compliance_reports;
CREATE POLICY "seller_read_reports_against_them" ON compliance_reports FOR SELECT
  TO authenticated USING (
    target_type = 'order' AND order_id IN (SELECT id FROM orders WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "seller_respond_to_reports" ON compliance_reports;
CREATE POLICY "seller_respond_to_reports" ON compliance_reports FOR UPDATE
  TO authenticated
  USING (target_type = 'order' AND order_id IN (SELECT id FROM orders WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())))
  WITH CHECK (target_type = 'order' AND order_id IN (SELECT id FROM orders WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- ============ Lock down audit_logs read access ============
DROP POLICY IF EXISTS "auth_read_audit_logs" ON audit_logs;
CREATE POLICY "auth_read_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (has_staff_permission('audit', 'view'));
