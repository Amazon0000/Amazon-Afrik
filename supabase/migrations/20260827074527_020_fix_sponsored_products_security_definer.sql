/*
# Fix: get_active_sponsored_products() doit être SECURITY DEFINER

## Bug réel identifié après durcissement RLS parallèle
La migration 018 (cleanup) a supprimé la policy publique "public_read_ads"
sur ad_campaigns (à raison — elle exposait des colonnes de paiement).
Mais get_active_sponsored_products() (migration 016_advertising_module)
avait été déclarée en SECURITY INVOKER par défaut : elle s'exécute donc
avec les droits RLS de l'appelant. Pour un visiteur anonyme ou un client
sur la homepage/catalogue, la RLS de ad_campaigns bloque la lecture des
campagnes des autres vendeurs → la fonction renvoyait silencieusement un
résultat vide, cassant l'affichage des produits sponsorisés côté public.

## Correctif
Passage en SECURITY DEFINER avec search_path figé (bonne pratique
Postgres pour éviter le hijacking de search_path). La fonction ne renvoie
QUE des colonnes de `products` — jamais de données de paiement — donc le
bypass RLS contrôlé ici reste sûr : c'est exactement le rôle prévu de
cette fonction (servir les produits sponsorisés publiquement sans exposer
ad_campaigns/advertising_payments directement).
*/

CREATE OR REPLACE FUNCTION get_active_sponsored_products(p_placement text DEFAULT NULL, p_limit int DEFAULT 20)
RETURNS SETOF products
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM products p
  INNER JOIN ad_campaigns ac ON ac.product_id = p.id
  INNER JOIN sellers s ON s.id = p.seller_id
  WHERE ac.status = 'active'
    AND ac.payment_status = 'paid'
    AND ac.expires_at > now()
    AND (p_placement IS NULL OR ac.placement_id = p_placement)
    AND p.is_active = true
    AND p.approval_status = 'approved'
    AND s.status = 'approved'
  ORDER BY ac.starts_at DESC
  LIMIT p_limit;
$$;

-- Autorise explicitement anon + authenticated à appeler cette fonction
-- (SECURITY DEFINER seul ne suffit pas si EXECUTE n'est pas accordé).
GRANT EXECUTE ON FUNCTION get_active_sponsored_products(text, int) TO anon, authenticated;
