/*
# Système de retours réel — l'onglet "Retours" du Seller Center était
purement décoratif (toujours "Aucun retour en cours", aucune table,
aucune donnée). Idem côté acheteur : aucun moyen de demander un retour.

## Règles
- Un acheteur ne peut demander un retour que sur une commande LIVRÉE
  (status='delivered') lui appartenant.
- Le vendeur voit et traite les demandes de ses propres commandes.
- Statuts séparés : requested → approved/rejected → refunded/completed.

## Vérifié réellement
Test end-to-end exécuté : commande de test livrée créée → demande de
retour insérée sous la RLS de l'acheteur → lue → nettoyage complet.
*/

CREATE TABLE IF NOT EXISTS return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'refunded', 'completed')),
  seller_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_return_requests_seller ON return_requests(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_return_requests_user ON return_requests(user_id);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_read_own_returns" ON return_requests;
CREATE POLICY "buyer_read_own_returns" ON return_requests FOR SELECT
  TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "buyer_create_own_return" ON return_requests;
CREATE POLICY "buyer_create_own_return" ON return_requests FOR INSERT
  TO authenticated WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id
        AND o.user_id = (select auth.uid())
        AND o.status = 'delivered'
    )
  );

DROP POLICY IF EXISTS "seller_read_own_returns" ON return_requests;
CREATE POLICY "seller_read_own_returns" ON return_requests FOR SELECT
  TO authenticated USING (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "seller_update_own_returns" ON return_requests;
CREATE POLICY "seller_update_own_returns" ON return_requests FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "admin_manage_returns" ON return_requests;
CREATE POLICY "admin_manage_returns" ON return_requests FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Protège les champs de décision : seul le vendeur/admin peut changer status/seller_response.
CREATE OR REPLACE FUNCTION protect_return_decision_fields()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_seller boolean;
BEGIN
  IF is_platform_admin() THEN
    RETURN NEW;
  END IF;
  is_seller := EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id AND user_id = auth.uid());
  IF NOT is_seller THEN
    NEW := OLD; -- l'acheteur ne peut rien modifier après création
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_return_decision ON return_requests;
CREATE TRIGGER trg_protect_return_decision
BEFORE UPDATE ON return_requests
FOR EACH ROW EXECUTE FUNCTION protect_return_decision_fields();
