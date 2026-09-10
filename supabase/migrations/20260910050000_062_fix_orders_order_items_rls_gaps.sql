/*
# Critical gaps found auditing orders/order_items RLS directly

1. orders had NO SELECT policy granting sellers access to their own
   sales — fetchSellerOrders() (Seller Center order list) queries orders
   directly with .eq('seller_id', sellerId), but with no matching policy
   this silently returned zero rows under RLS. Sellers could not see
   their own orders at all on the live site until this fix.
2. order_items INSERT/SELECT policies had with_check/qual literally
   'true' — ANY authenticated user could read every order_item from
   every order (buyer names, items, prices) or insert fake items into
   someone else's order.

Found and fixed live on 2026-09-10 via direct database inspection
(Supabase MCP); this file brings the migration history back in sync.
*/

DROP POLICY IF EXISTS "seller_read_own_sales_orders" ON orders;
CREATE POLICY "seller_read_own_sales_orders" ON orders FOR SELECT
  TO authenticated USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "guest_read_guest_orders" ON orders;
CREATE POLICY "guest_read_guest_orders" ON orders FOR SELECT
  TO anon USING (user_id IS NULL);

DROP POLICY IF EXISTS "user_insert_order_items" ON order_items;
CREATE POLICY "user_insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "guest_insert_order_items" ON order_items;
CREATE POLICY "guest_insert_order_items" ON order_items FOR INSERT
  TO anon WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id IS NULL)
  );

DROP POLICY IF EXISTS "user_read_order_items" ON order_items;
CREATE POLICY "user_read_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = auth.uid()
         OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "guest_read_guest_order_items" ON order_items;
CREATE POLICY "guest_read_guest_order_items" ON order_items FOR SELECT
  TO anon USING (order_id IN (SELECT id FROM orders WHERE user_id IS NULL));
