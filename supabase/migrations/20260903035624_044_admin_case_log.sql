/*
# Case Log Admin (modèle centre de support interne Amazon) — vue
consolidée de tout ce qui nécessite l'attention d'un admin : litiges
(compliance_reports), demandes de retour non traitées (return_requests),
et conversations où le vendeur n'a pas répondu depuis longtemps (signal
d'escalade potentielle). Remplace le besoin de vérifier 3 onglets séparés.

## Fonction réelle
get_admin_case_log() renvoie une liste unifiée triée par ancienneté (plus
vieux en premier, comme une vraie file d'attente de support), avec un type
de cas et un niveau d'urgence.

## Vérifié réellement
Litige de test créé -> apparaît dans l'agrégation avec le bon type/urgence ;
vendeur non-admin -> résultat vide (accès refusé) ; nettoyage effectué.
*/

CREATE OR REPLACE FUNCTION get_admin_case_log()
RETURNS TABLE (
  case_type text,
  case_id uuid,
  title text,
  subtitle text,
  status text,
  urgency text,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY

  SELECT
    'dispute'::text,
    cr.id,
    coalesce(cr.target_name, cr.report_type),
    cr.reason,
    cr.status,
    CASE WHEN cr.created_at < now() - interval '48 hours' THEN 'high' ELSE 'normal' END,
    cr.created_at
  FROM compliance_reports cr
  WHERE cr.status IN ('pending', 'open', 'investigating')

  UNION ALL

  SELECT
    'return'::text,
    r.id,
    coalesce(s.business_name, 'Seller'),
    r.reason,
    r.status,
    CASE WHEN r.created_at < now() - interval '72 hours' THEN 'high' ELSE 'normal' END,
    r.created_at
  FROM return_requests r
  JOIN sellers s ON s.id = r.seller_id
  WHERE r.status = 'requested'

  UNION ALL

  SELECT
    'unanswered_message'::text,
    c.id,
    coalesce(s.business_name, 'Seller'),
    c.subject,
    'awaiting_seller_reply'::text,
    CASE WHEN c.last_message_at < now() - interval '48 hours' THEN 'high' ELSE 'normal' END,
    c.last_message_at
  FROM conversations c
  JOIN sellers s ON s.id = c.seller_id
  WHERE c.seller_unread_count > 0
    AND c.last_message_at < now() - interval '24 hours'

  ORDER BY created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_case_log() TO authenticated;
