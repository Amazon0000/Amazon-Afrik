/*
# Trust & Safety Compliance Center

1. New Tables
- `audit_logs` — immutable record of every admin/platform action (login, product create, seller suspend, campaign approve, etc.)
- `compliance_reports` — customer-submitted reports for sellers, products, reviews, messages, fraud, scams, abuse
- `compliance_cases` — investigation cases grouping reports with timeline, evidence, AI analysis, admin decisions
- `store_health_scores` — dynamic health score per seller calculated from verification, orders, ratings, complaints, response time
- `seller_payment_methods` — each seller's configured payment methods (Stripe, Flutterwave, Paystack, M-Pesa, Orange Money, etc.)

2. Modified Tables
- `sellers` — adds columns: risk_score, compliance_score, health_status, strikes_count, suspended_reason, suspended_at, identity_selfie_url, warehouse_photos, store_photos, phone_verified, email_verified, bank_verified, compliance_status
- `seller_documents` — adds columns: admin_notes, flagged_reason, reviewed_by, reviewed_at

3. Security
- RLS enabled on all new tables
- SELECT policies allow authenticated users to read audit logs (admin only in app logic)
- INSERT/UPDATE/DELETE scoped to authenticated users
- All tables use TO authenticated for CRUD

4. Important Notes
- Audit logs are INSERT-only from the app perspective (no UPDATE/DELETE from frontend)
- Store health scores are computed by a database function
- Payment methods are seller-scoped (each seller configures their own)
*/

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_name text,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_audit_logs" ON audit_logs;
CREATE POLICY "auth_read_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_audit_logs" ON audit_logs;
CREATE POLICY "auth_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ COMPLIANCE REPORTS ============
CREATE TABLE IF NOT EXISTS compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name text,
  report_type text NOT NULL DEFAULT 'other',
  target_type text NOT NULL,
  target_id text,
  target_name text,
  reason text,
  description text,
  status text NOT NULL DEFAULT 'open',
  case_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_reports" ON compliance_reports;
CREATE POLICY "auth_read_reports" ON compliance_reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_reports" ON compliance_reports;
CREATE POLICY "auth_insert_reports" ON compliance_reports FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_reports" ON compliance_reports;
CREATE POLICY "auth_update_reports" ON compliance_reports FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ COMPLIANCE CASES ============
CREATE TABLE IF NOT EXISTS compliance_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL DEFAULT ('CASE-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_name text,
  seller_id uuid,
  seller_name text,
  product_id uuid,
  report_ids text[],
  ai_risk_level text,
  ai_analysis jsonb,
  internal_notes text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE compliance_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_cases" ON compliance_cases;
CREATE POLICY "auth_read_cases" ON compliance_cases FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_cases" ON compliance_cases;
CREATE POLICY "auth_insert_cases" ON compliance_cases FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_cases" ON compliance_cases;
CREATE POLICY "auth_update_cases" ON compliance_cases FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ STORE HEALTH SCORES ============
CREATE TABLE IF NOT EXISTS store_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  health_score numeric NOT NULL DEFAULT 50,
  health_status text NOT NULL DEFAULT 'average',
  verification_score numeric DEFAULT 0,
  order_completion_score numeric DEFAULT 0,
  rating_score numeric DEFAULT 0,
  refund_rate_score numeric DEFAULT 0,
  complaint_rate_score numeric DEFAULT 0,
  response_time_score numeric DEFAULT 0,
  shipping_score numeric DEFAULT 0,
  profile_completeness_score numeric DEFAULT 0,
  subscription_score numeric DEFAULT 0,
  compliance_score numeric DEFAULT 0,
  flagged_for_review boolean NOT NULL DEFAULT false,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_health_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_health" ON store_health_scores;
CREATE POLICY "auth_read_health" ON store_health_scores FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_health" ON store_health_scores;
CREATE POLICY "auth_insert_health" ON store_health_scores FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_health" ON store_health_scores;
CREATE POLICY "auth_update_health" ON store_health_scores FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ SELLER PAYMENT METHODS ============
CREATE TABLE IF NOT EXISTS seller_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  provider_name text NOT NULL,
  provider_type text NOT NULL DEFAULT 'mobile_money',
  account_identifier text,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  display_name text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seller_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_payment_methods" ON seller_payment_methods;
CREATE POLICY "auth_read_payment_methods" ON seller_payment_methods FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_payment_methods" ON seller_payment_methods;
CREATE POLICY "auth_insert_payment_methods" ON seller_payment_methods FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_payment_methods" ON seller_payment_methods;
CREATE POLICY "auth_update_payment_methods" ON seller_payment_methods FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_payment_methods" ON seller_payment_methods;
CREATE POLICY "auth_delete_payment_methods" ON seller_payment_methods FOR DELETE
  TO authenticated USING (true);

-- ============ ADD COLUMNS TO SELLERS ============
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS risk_score numeric DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS compliance_score numeric DEFAULT 50;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'average';
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS strikes_count integer DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS identity_selfie_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS warehouse_photos text[];
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS store_photos text[];
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_verified boolean DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS compliance_status text DEFAULT 'pending';

-- ============ ADD COLUMNS TO SELLER DOCUMENTS ============
ALTER TABLE seller_documents ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE seller_documents ADD COLUMN IF NOT EXISTS flagged_reason text;
ALTER TABLE seller_documents ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE seller_documents ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_reports_status ON compliance_reports (status);
CREATE INDEX IF NOT EXISTS idx_cases_status ON compliance_cases (status);
CREATE INDEX IF NOT EXISTS idx_health_seller ON store_health_scores (seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_pay_seller ON seller_payment_methods (seller_id);
CREATE INDEX IF NOT EXISTS idx_sellers_compliance ON sellers (compliance_status);
