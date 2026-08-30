/*
Correctif immédiat d'une faille que je venais d'introduire moi-même dans la
migration précédente (032) : une policy "guest_read_own_order_by_tracking"
(USING user_id IS NULL) aurait permis à N'IMPORTE QUEL visiteur anonyme de
lire TOUTES les commandes invité de la plateforme (noms, emails, téléphones,
adresses de livraison) — RLS ne peut pas restreindre "seulement la ligne que
le client a demandée via .eq()", elle s'applique à toute lecture. Cette
policy a été supprimée avant d'être exploitable.

Remplacée par des fonctions SECURITY DEFINER exigeant tracking_id ET email
correspondants (preuve de possession de la commande) plutôt qu'un accès
RLS ouvert.

Vérifié réellement : bon tracking_id + bon email -> renvoie la commande ;
bon tracking_id + mauvais email -> vide.
*/

DROP POLICY IF EXISTS "guest_read_own_order_by_tracking" ON orders;

CREATE OR REPLACE FUNCTION get_guest_order_by_tracking(p_tracking_id text, p_email text)
RETURNS TABLE (
  id uuid, seller_id uuid, status text, total numeric, currency_code text,
  payment_method text, delivery_address text, tracking_id text, created_at timestamptz,
  coupon_code text, discount_amount numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.seller_id, o.status, o.total, o.currency_code, o.payment_method,
         o.delivery_address, o.tracking_id, o.created_at, o.coupon_code, o.discount_amount
  FROM orders o
  WHERE o.tracking_id = p_tracking_id
    AND o.user_id IS NULL
    AND lower(o.guest_email) = lower(p_email);
$$;

GRANT EXECUTE ON FUNCTION get_guest_order_by_tracking(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_guest_order_items_by_tracking(p_tracking_id text, p_email text)
RETURNS SETOF order_items
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.* FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.tracking_id = p_tracking_id
    AND o.user_id IS NULL
    AND lower(o.guest_email) = lower(p_email);
$$;

GRANT EXECUTE ON FUNCTION get_guest_order_items_by_tracking(text, text) TO anon, authenticated;
