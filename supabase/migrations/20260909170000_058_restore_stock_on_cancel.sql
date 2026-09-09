/*
# Restore stock on order cancellation (audit finding)

`cancelOwnOrder()` (buyer) and `updateOrderStatus()` (seller/admin) both
flip an order to 'cancelled' without ever restoring the stock that was
decremented when the order was placed — a buyer cancelling their own
order permanently cost the seller inventory for a sale that never
completed. Adds the missing inverse of decrement_product_stock()
(migration 019/023); the client functions are updated in this same change
to call it when cancelling an order that had actually reserved stock
(never called for orders still 'pending' a real PSP payment — those never
decremented stock in the first place, see migration 057).
*/

CREATE OR REPLACE FUNCTION restore_product_stock(p_product_id uuid, p_qty int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_stock int;
BEGIN
  UPDATE products
  SET stock = stock + p_qty
  WHERE id = p_product_id
  RETURNING stock INTO new_stock;
  RETURN new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION restore_product_stock(uuid, int) TO anon, authenticated;
