/*
# Enforce flash deal stock limits (audit finding)

`flash_deals.claimed_count` and `stock_limit` existed since the original
flash deals migration, but `claimed_count` was never incremented anywhere
in the application, and never checked against `stock_limit` when serving
a deal price. A seller configuring "flash price for the first 20 units"
had no actual enforcement — the discounted price applied to unlimited
buyers until the deal expired by time alone. The frontend fetch functions
(fetchProductFlashDeal / fetchFlashDealsForProducts, src/lib/db.ts) are
updated in this same change to stop offering a deal once claimed_count
reaches stock_limit; this migration adds the atomic increment used at
checkout.
*/

CREATE OR REPLACE FUNCTION increment_flash_deal_claimed(p_flash_deal_id uuid, p_qty int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count int;
BEGIN
  UPDATE flash_deals
  SET claimed_count = claimed_count + p_qty
  WHERE id = p_flash_deal_id
  RETURNING claimed_count INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_flash_deal_claimed(uuid, int) TO anon, authenticated;
