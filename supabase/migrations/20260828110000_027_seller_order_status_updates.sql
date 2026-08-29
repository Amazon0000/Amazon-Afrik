/*
# Sellers can actually update their own sales order status

Audit found no RLS policy allowing a seller to update an order at all —
only the buyer (user_update_own_orders) could. The Seller Center Orders
tab showed status as a static, unchangeable badge: a seller had no way
to ever mark an order as shipped or delivered.

Adds seller_update_own_sales_orders (their own orders only, via
seller_id). A protective trigger keeps this narrow and prevents both
sides from rewriting the wrong things:
- A seller may change `status` among the real fulfillment states, but
  can never rewrite total/payment_method/delivery_address/tracking_id/
  coupon_code/discount_amount/user_id/seller_id on an order.
- A buyer (the existing user_update_own_orders policy) may only ever
  move their own order to 'cancelled', and only while it's still
  pending/confirmed — not silently rewrite any other field, and not
  fabricate a 'delivered' status themselves.
- An admin (is_platform_admin()) is unrestricted, for dispute resolution.
*/

DROP POLICY IF EXISTS "seller_update_own_sales_orders" ON orders;
CREATE POLICY "seller_update_own_sales_orders" ON orders FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE OR REPLACE FUNCTION protect_order_fields()
RETURNS TRIGGER AS $$
DECLARE
  is_seller boolean;
  is_buyer boolean;
BEGIN
  IF is_platform_admin() THEN
    RETURN NEW;
  END IF;

  is_seller := EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id AND user_id = auth.uid());
  is_buyer := (auth.uid() = OLD.user_id);

  IF is_seller THEN
    -- Seller may only move the fulfillment status forward/around; every
    -- other field is pinned to its previous value regardless of what the
    -- client sent.
    IF NEW.status NOT IN ('confirmed', 'preparing', 'inTransit', 'delivered', 'cancelled') THEN
      NEW.status := OLD.status;
    END IF;
    NEW.user_id := OLD.user_id;
    NEW.seller_id := OLD.seller_id;
    NEW.total := OLD.total;
    NEW.payment_method := OLD.payment_method;
    NEW.delivery_address := OLD.delivery_address;
    NEW.tracking_id := OLD.tracking_id;
    NEW.coupon_code := OLD.coupon_code;
    NEW.discount_amount := OLD.discount_amount;
    NEW.guest_name := OLD.guest_name;
    NEW.guest_email := OLD.guest_email;
    NEW.guest_phone := OLD.guest_phone;
  ELSIF is_buyer THEN
    -- Buyer may only cancel their own still-pending/confirmed order —
    -- nothing else about the order can change through this path.
    IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed') THEN
      NEW := OLD;
      NEW.status := 'cancelled';
    ELSE
      NEW := OLD;
    END IF;
  ELSE
    NEW := OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_order_fields ON orders;
CREATE TRIGGER trg_protect_order_fields
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION protect_order_fields();
