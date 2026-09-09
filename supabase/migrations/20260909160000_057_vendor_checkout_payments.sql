/*
# Real vendor checkout payments (explicit request: "les PSP doivent être vrai")

## Problem
Checkout previously created an order as immediately 'confirmed' the moment
a buyer clicked "place order" — there was no actual payment verification
step at all. The seller's chosen PSP was only ever displayed as
informational text; Zando never initiated or verified a real payment
against it. Real API credentials now exist (migration 054) but were only
storage — nothing used them to actually charge anyone.

## Fix
`vendor_psp_payments` mirrors the exact same proven pattern as
`advertising_payments` / `subscription_payments`: a row created 'pending'
the moment checkout redirects the buyer to the vendor's own PSP, flipped
to 'paid' only by a webhook that re-verifies the payment server-side
before trusting it. Orders now start 'pending' (already a valid status —
see migration 003) instead of jumping straight to 'confirmed', and only
move to 'confirmed' once the matching vendor_psp_payments row is 'paid'.

Digital-only orders and orders paid via a manual method (mobile money,
bank transfer — no API key, seller confirms manually) are unaffected:
they keep the existing "confirmed/delivered immediately" behavior, since
there is no automatable PSP to verify against for those.
*/

CREATE TABLE IF NOT EXISTS vendor_psp_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  credential_id uuid NOT NULL REFERENCES seller_psp_credentials(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe', 'paddle', 'payunit', 'paystack', 'flutterwave')),
  provider_reference text NOT NULL,
  internal_reference text NOT NULL UNIQUE,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  raw_webhook_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_psp_payments_order ON vendor_psp_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_psp_payments_seller ON vendor_psp_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_vendor_psp_payments_internal_ref ON vendor_psp_payments(internal_reference);

ALTER TABLE vendor_psp_payments ENABLE ROW LEVEL SECURITY;

-- Buyer can see the payment status of their own order (guest or logged in
-- — matches the existing order visibility pattern for guests via
-- tracking, so this only exposes status for someone who already has the
-- order id, not a public listing).
DROP POLICY IF EXISTS "buyer_read_own_order_payment" ON vendor_psp_payments;
CREATE POLICY "buyer_read_own_order_payment" ON vendor_psp_payments FOR SELECT
  TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "seller_read_own_payments" ON vendor_psp_payments;
CREATE POLICY "seller_read_own_payments" ON vendor_psp_payments FOR SELECT
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
-- No client INSERT/UPDATE policy — only Edge Functions (service role)
-- create and settle vendor payments, same rule as every other payment
-- table in this codebase.
