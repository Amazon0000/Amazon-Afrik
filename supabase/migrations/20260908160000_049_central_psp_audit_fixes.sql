/*
# Audit fixes ahead of connecting the central PSP

## Bug 1 — Paddle silently broken for ad campaigns (confirmed, found by audit)
`advertising_payments.provider` CHECK only allows ('stripe','flutterwave',
'payunit') — but `ads-create-payment`'s adapter map includes `paddle`, and
`ads-webhook-paddle` exists and is deployed. Today: a seller picking Paddle
for an ad campaign gets a Paddle checkout session created server-side, then
the INSERT into advertising_payments fails the CHECK constraint, the
Edge Function returns a 500, and the seller never even reaches the Paddle
page. Fixed by widening the CHECK to include 'paddle'.

## Bug 2 — Subscription "upgrade" never charges anything (confirmed, found by audit)
`updateSellerPlan()` (src/lib/db.ts) wrote `sellers.plan` directly with NO
payment step at all — clicking "Choose" on any paid plan instantly granted
it for free. There is no central-PSP integration point for subscriptions
to plug into at all, which blocks "connect the central PSP" — there was
nothing to connect. This migration adds the `subscription_payments` table
(mirrors the existing, working `advertising_payments` pattern) so a
matching Edge Function set (subscription-create-payment + one webhook per
provider) requires and verifies real payment before any plan change is
applied — using the exact same Stripe/Flutterwave/PayUnit/Paddle adapters
and idempotent-activation pattern already proven for ad campaigns.

Pricing: 3 paid tiers only — starter $9, premium $29, enterprise $79.
There is no free/lifetime plan; every new seller gets the existing 14-day
trial (subscription_status='trial', trial_starts_at/trial_ends_at — see
migration 036_subscription_expiry), then must pay for one of these tiers.
*/

-- ============ Bug 1: Paddle constraint ============
ALTER TABLE advertising_payments DROP CONSTRAINT IF EXISTS advertising_payments_provider_check;
ALTER TABLE advertising_payments ADD CONSTRAINT advertising_payments_provider_check
  CHECK (provider IN ('stripe', 'flutterwave', 'payunit', 'paddle'));

-- ============ Bug 2: real subscription payments ============
CREATE TABLE IF NOT EXISTS subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('starter', 'premium', 'enterprise')),
  provider text NOT NULL CHECK (provider IN ('stripe', 'flutterwave', 'payunit', 'paddle')),
  provider_reference text NOT NULL,
  internal_reference text NOT NULL UNIQUE,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_code text NOT NULL REFERENCES currencies(code),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  raw_webhook_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_seller ON subscription_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_sub_payments_internal_ref ON subscription_payments(internal_reference);

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_read_own_subscription_payments" ON subscription_payments;
CREATE POLICY "seller_read_own_subscription_payments" ON subscription_payments
  FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
-- No client INSERT/UPDATE policy — only Edge Functions (service role)
-- create and settle subscription payments, same rule as advertising_payments
-- and notifications: never trust the frontend to grant paid plan access.
