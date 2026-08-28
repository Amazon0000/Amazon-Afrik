/*
# Atomic stock decrement on order placement

Audit found that placing an order never touched products.stock at all —
inventory numbers shown across the app (product page, cart, seller
dashboard) were purely decorative and could be oversold indefinitely, no
matter how many units were actually ordered.

decrement_product_stock() is a single atomic UPDATE (never negative,
GREATEST floor at 0) so concurrent checkouts can't both succeed past the
real stock count — a plain read-then-write from the client would have a
race condition between two buyers checking out the last unit at once.
SECURITY DEFINER + a narrow authenticated/anon EXECUTE grant lets the
checkout flow call it without needing a broad UPDATE policy on products
for buyers (who should not otherwise be able to write to products at all).
*/

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_qty int)
RETURNS int AS $$
DECLARE
  new_stock int;
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_qty, 0)
  WHERE id = p_product_id
  RETURNING stock INTO new_stock;
  RETURN new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrement_product_stock(uuid, int) TO anon, authenticated;
