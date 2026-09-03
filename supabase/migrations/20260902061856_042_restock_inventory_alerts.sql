/*
# Restock / Inventory Alerts (modèle Amazon Seller Central — "Manage Inventory"
> Restock Recommendations / Low Stock)

## Ajout réel
`products.low_stock_threshold` — seuil configurable par le vendeur, produit
par produit (Amazon calcule un seuil dynamique par historique de ventes ;
ici, plus simple et honnête : un seuil fixe configurable, avec une valeur
par défaut raisonnable de 5).

## Fonction réelle
get_seller_inventory_alerts(seller_id) renvoie les produits actifs dont le
stock est à 0 (rupture) ou sous le seuil (stock faible), avec les vraies
quantités vendues sur les 30 derniers jours pour prioriser (produit qui se
vend vite + stock faible = urgent).

## Vérifié réellement
Produit de test créé (stock=2, seuil=5) -> apparaît bien dans les alertes
avec alert_level='low_stock' ; nettoyage effectué.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold int NOT NULL DEFAULT 5;

CREATE OR REPLACE FUNCTION get_seller_inventory_alerts(p_seller_id uuid)
RETURNS TABLE (
  product_id uuid,
  name text,
  sku text,
  stock int,
  low_stock_threshold int,
  alert_level text,
  units_sold_30d bigint,
  image_url text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_platform_admin()
    OR EXISTS (SELECT 1 FROM sellers WHERE id = p_seller_id AND user_id = auth.uid())
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    p.stock,
    p.low_stock_threshold,
    CASE WHEN p.stock = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
    coalesce((
      SELECT sum(oi.qty)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = p.id AND o.created_at > now() - interval '30 days'
        AND o.status != 'cancelled'
    ), 0),
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1)
  FROM products p
  WHERE p.seller_id = p_seller_id
    AND p.is_active = true
    AND p.approval_status = 'approved'
    AND p.stock <= p.low_stock_threshold
  ORDER BY (p.stock = 0) DESC, units_sold_30d DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_seller_inventory_alerts(uuid) TO authenticated;
