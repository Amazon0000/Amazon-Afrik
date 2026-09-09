/*
# Wire up real order tracking (audit finding)

The order-tracking page (DeliveryPage.tsx) was entirely hardcoded fake data
— a static "TRK-100" tracking ID, a timeline where every step always shows
as done/in-transit regardless of the real order, a fixed fake address
("Abidjan, Cocody, Riviera"), and a fake "estimated arrival: 2h30". It never
queried the database at all.

The secure guest-lookup RPCs from migration 033 (tracking_id + email proof
of ownership) already existed but were never called from any frontend code
either, and predate the shipping ETA / status fields added in migrations
046/049/050 — this migration adds those to the RPC's return so the real
tracking page can show a real delivery window.
*/

CREATE OR REPLACE FUNCTION get_guest_order_by_tracking(p_tracking_id text, p_email text)
RETURNS TABLE (
  id uuid, seller_id uuid, status text, total numeric, currency_code text,
  payment_method text, delivery_address text, tracking_id text, created_at timestamptz,
  coupon_code text, discount_amount numeric,
  shipping_fee numeric, shipping_min_days int, shipping_max_days int
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.seller_id, o.status, o.total, o.currency_code, o.payment_method,
         o.delivery_address, o.tracking_id, o.created_at, o.coupon_code, o.discount_amount,
         o.shipping_fee, o.shipping_min_days, o.shipping_max_days
  FROM orders o
  WHERE o.tracking_id = p_tracking_id
    AND o.user_id IS NULL
    AND lower(o.guest_email) = lower(p_email);
$$;

GRANT EXECUTE ON FUNCTION get_guest_order_by_tracking(text, text) TO anon, authenticated;

-- ============ Contact messages: give admins a way to actually see them ============
-- contact_messages had a real table, a real anon INSERT policy (footer
-- form), and a real superadmin-only SELECT policy — but zero frontend code
-- ever read from it, and there was no UPDATE policy at all. Every message
-- submitted through the footer "Need help? Contact us" form vanished with
-- no operational way for anyone to see or act on it.
DROP POLICY IF EXISTS "superadmin_update_contact_messages" ON contact_messages;
CREATE POLICY "superadmin_update_contact_messages" ON contact_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = (select auth.jwt())->>'email' AND sa.is_active = true));
