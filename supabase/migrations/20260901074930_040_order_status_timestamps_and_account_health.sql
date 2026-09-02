/*
# Account Health / Performance Metrics (modèle Amazon Seller Central)

## Prérequis manquant trouvé
La table `orders` n'avait aucun horodatage par transition de statut
(confirmed_at, shipped_at, delivered_at, cancelled_at) — impossible de
calculer un vrai "Late Shipment Rate" ou "Valid Tracking Rate" à la Amazon
sans cela. Ajouté ici avec un trigger qui les alimente automatiquement à
chaque changement de statut, à partir de maintenant (les commandes déjà
existantes avant ce trigger n'ont pas cet historique rétroactif — ce n'est
techniquement pas reconstituible sans l'avoir enregistré au fil de l'eau).

## Métriques réelles calculées (fonction SQL, pas de fake data)
- Order Defect Rate (ODR) : commandes annulées par le vendeur OU ayant un
  retour approuvé/remboursé, sur le total des commandes.
- Late Shipment Rate : commandes confirmées puis passées "en transit" plus
  de 48h après confirmation, sur les commandes ayant les deux horodatages.
- Valid Tracking Rate : commandes livrées avec un tracking_id renseigné,
  sur le total des commandes livrées.
- Cancellation Rate : commandes annulées, sur le total.

Note : la version de get_seller_account_health() définie ici est corrigée
par la migration suivante (041) — un bug d'autorisation a été trouvé et
corrigé immédiatement après ce premier jet, avant tout risque réel.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE OR REPLACE FUNCTION track_order_status_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    ELSIF NEW.status = 'inTransit' AND NEW.shipped_at IS NULL THEN
      NEW.shipped_at := now();
    ELSIF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    ELSIF NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_order_status_timestamps ON orders;
CREATE TRIGGER trg_track_order_status_timestamps
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION track_order_status_timestamps();

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

GRANT EXECUTE ON FUNCTION get_seller_account_health(uuid) TO authenticated;
