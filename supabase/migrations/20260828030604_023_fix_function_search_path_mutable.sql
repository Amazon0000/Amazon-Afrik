/*
# Fix: function_search_path_mutable (Security Advisor Supabase)

Détecté via les Security Advisors Supabase après application du module
Advertising : expire_ad_campaigns() et decrement_product_stock() avaient un
search_path non figé — risque de détournement si un rôle malveillant peut
manipuler le search_path de la session. Corrigé avec SET search_path = public.
*/

CREATE OR REPLACE FUNCTION expire_ad_campaigns()
RETURNS int
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  affected int;
BEGIN
  UPDATE ad_campaigns
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_qty int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_stock int;
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_qty, 0)
  WHERE id = p_product_id
  RETURNING stock INTO new_stock;
  RETURN new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_product_stock(uuid, int) TO anon, authenticated;
