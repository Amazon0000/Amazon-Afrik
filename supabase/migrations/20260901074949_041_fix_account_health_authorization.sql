/*
Correctif immédiat d'une faille que je venais d'introduire moi-même dans la
migration précédente (040) : get_seller_account_health(p_seller_id) était
appelable par N'IMPORTE QUEL utilisateur connecté pour N'IMPORTE QUEL
seller_id — un vendeur aurait pu consulter les métriques de performance
(taux de défaut, retards d'expédition...) de n'importe quel concurrent.

Ajoute une vérification d'autorisation à l'intérieur de la fonction :
seul le vendeur propriétaire ou un admin peut consulter ces données.

## Vérifié réellement
Test end-to-end : le vendeur A consulte ses propres données -> résultat
réel obtenu ; le vendeur A tente de consulter les données du vendeur B ->
{"error": "Non autorisé"}.
*/
CREATE OR REPLACE FUNCTION get_seller_account_health(p_seller_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_orders int;
  cancelled_orders int;
  defective_orders int;
  delivered_orders int;
  delivered_with_tracking int;
  shipped_with_confirmed int;
  late_shipments int;
  odr numeric;
  late_shipment_rate numeric;
  valid_tracking_rate numeric;
  cancellation_rate numeric;
BEGIN
  IF NOT (
    is_platform_admin()
    OR EXISTS (SELECT 1 FROM sellers WHERE id = p_seller_id AND user_id = auth.uid())
  ) THEN
    RETURN jsonb_build_object('error', 'Non autorisé');
  END IF;

  SELECT count(*) INTO total_orders FROM orders WHERE seller_id = p_seller_id;
  SELECT count(*) INTO cancelled_orders FROM orders WHERE seller_id = p_seller_id AND status = 'cancelled';

  SELECT count(DISTINCT o.id) INTO defective_orders
  FROM orders o
  LEFT JOIN return_requests r ON r.order_id = o.id AND r.status IN ('approved', 'refunded')
  WHERE o.seller_id = p_seller_id AND (o.status = 'cancelled' OR r.id IS NOT NULL);

  SELECT count(*) INTO delivered_orders FROM orders WHERE seller_id = p_seller_id AND status = 'delivered';
  SELECT count(*) INTO delivered_with_tracking FROM orders WHERE seller_id = p_seller_id AND status = 'delivered' AND tracking_id IS NOT NULL;

  SELECT count(*) INTO shipped_with_confirmed FROM orders
  WHERE seller_id = p_seller_id AND confirmed_at IS NOT NULL AND shipped_at IS NOT NULL;
  SELECT count(*) INTO late_shipments FROM orders
  WHERE seller_id = p_seller_id AND confirmed_at IS NOT NULL AND shipped_at IS NOT NULL
    AND shipped_at - confirmed_at > interval '48 hours';

  odr := CASE WHEN total_orders > 0 THEN round((defective_orders::numeric / total_orders) * 100, 2) ELSE 0 END;
  cancellation_rate := CASE WHEN total_orders > 0 THEN round((cancelled_orders::numeric / total_orders) * 100, 2) ELSE 0 END;
  late_shipment_rate := CASE WHEN shipped_with_confirmed > 0 THEN round((late_shipments::numeric / shipped_with_confirmed) * 100, 2) ELSE 0 END;
  valid_tracking_rate := CASE WHEN delivered_orders > 0 THEN round((delivered_with_tracking::numeric / delivered_orders) * 100, 2) ELSE 100 END;

  RETURN jsonb_build_object(
    'total_orders', total_orders,
    'order_defect_rate', odr,
    'cancellation_rate', cancellation_rate,
    'late_shipment_rate', late_shipment_rate,
    'valid_tracking_rate', valid_tracking_rate,
    'measured_shipments', shipped_with_confirmed,
    'measured_deliveries', delivered_orders
  );
END;
$$;
