CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_payouts" ON payouts;
CREATE POLICY "auth_read_payouts" ON payouts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_payouts" ON payouts;
CREATE POLICY "auth_insert_payouts" ON payouts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_payouts" ON payouts;
CREATE POLICY "auth_update_payouts" ON payouts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts (seller_id);
