/*
# Real vendor PSP connection (audit finding + explicit request)

## Problem
`seller_payment_methods` is a manual "directory" — a free-text
`account_identifier` field (e.g. a phone number or a display note). There
is no real PSP integration at the vendor level: no API keys, no automated
checkout initiation against the vendor's own Stripe/Paddle/PayUnit/
Paystack/Flutterwave account. The checkout screen just displays whatever
text the seller typed.

Also, `seller_payment_methods` itself has `auth_read_payment_methods USING
(true)` — any authenticated user can already read every field on it, which
is fine for a phone number but would be a serious secret-key leak if API
keys were ever added directly to that table.

## Fix
Two new tables, split by sensitivity:
- `seller_psp_credentials` — safe-to-read identifiers per provider
  (publishable/public key, merchant/vendor ID). Readable by the owning
  seller (to manage it) and used server-side by checkout.
- `seller_psp_secrets` — secret keys. INSERT/UPDATE only for the owning
  seller (write, never read back) — no SELECT policy for anyone except
  the service role, which Edge Functions use. This means even the seller
  who typed their own secret key can never read it back through the app
  (standard "write-only secret" pattern) — only paste it in again to
  rotate it.
*/

CREATE TABLE IF NOT EXISTS seller_psp_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe', 'paddle', 'payunit', 'paystack', 'flutterwave', 'airwallex')),
  public_key text,           -- Stripe/Paystack/Flutterwave publishable/public key
  merchant_id text,          -- Paddle vendor ID, PayUnit API user, Airwallex client ID, etc.
  mode text NOT NULL DEFAULT 'live' CHECK (mode IN ('test', 'live')),
  is_active boolean NOT NULL DEFAULT true,
  has_secret boolean NOT NULL DEFAULT false, -- set true once a secret is stored, so the UI can show "configured" without ever reading the secret itself
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, provider)
);

ALTER TABLE seller_psp_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_manage_own_psp_credentials" ON seller_psp_credentials;
CREATE POLICY "seller_manage_own_psp_credentials" ON seller_psp_credentials FOR ALL
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
-- Public keys are safe for anyone to read (they're designed to be
-- client-exposed, e.g. Stripe publishable keys) — checkout needs this to
-- initialize the vendor's own PSP widget.
DROP POLICY IF EXISTS "public_read_psp_public_keys" ON seller_psp_credentials;
CREATE POLICY "public_read_psp_public_keys" ON seller_psp_credentials FOR SELECT
  TO anon, authenticated USING (is_active = true);

CREATE TABLE IF NOT EXISTS seller_psp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid NOT NULL REFERENCES seller_psp_credentials(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  secret_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (credential_id)
);

ALTER TABLE seller_psp_secrets ENABLE ROW LEVEL SECURITY;

-- Write-only: the owning seller can INSERT/UPDATE (paste a new secret to
-- rotate it) but there is NO SELECT policy at all for authenticated/anon —
-- only the service role (Edge Functions) can ever read a secret back.
DROP POLICY IF EXISTS "seller_write_own_psp_secret" ON seller_psp_secrets;
CREATE POLICY "seller_write_own_psp_secret" ON seller_psp_secrets FOR INSERT
  TO authenticated
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "seller_update_own_psp_secret" ON seller_psp_secrets;
CREATE POLICY "seller_update_own_psp_secret" ON seller_psp_secrets FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "seller_delete_own_psp_secret" ON seller_psp_secrets;
CREATE POLICY "seller_delete_own_psp_secret" ON seller_psp_secrets FOR DELETE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
