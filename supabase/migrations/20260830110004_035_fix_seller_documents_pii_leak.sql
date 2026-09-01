/*
# Faille de sécurité réelle trouvée : seller_documents (pièces d'identité KYC)

Trois policies dangereuses trouvées :
- "public_read_seller_docs" (anon + authenticated, qual=true) : N'IMPORTE
  QUI, même non connecté, pouvait lire les métadonnées de TOUS les
  documents d'identité de TOUS les vendeurs (URL de fichier, type de
  document, statut).
- "seller_insert_docs" (authenticated, aucune condition) : n'importe quel
  utilisateur connecté pouvait insérer un document pour n'importe quel
  seller_id.
- "seller_update_docs" (authenticated, qual=true) : n'importe quel
  utilisateur connecté pouvait modifier le statut de N'IMPORTE QUEL
  document (ex: un vendeur pouvait s'auto-approuver son KYC rejeté, ou
  altérer les documents d'un concurrent).

Corrigé : lecture/écriture restreintes au vendeur propriétaire ou à
l'admin. Seul l'admin peut changer le statut de vérification (via trigger),
un vendeur peut uploader/mettre à jour ses propres documents mais pas leur
statut d'approbation.

## Vérifié réellement
Test end-to-end exécuté : un vendeur réel insère son document (pending) →
tentative d'auto-approbation par ce même vendeur → bloquée (reste pending)
→ approbation par un vrai super admin → réussie (approved) → nettoyage.
*/

DROP POLICY IF EXISTS "public_read_seller_docs" ON seller_documents;
CREATE POLICY "seller_read_own_documents" ON seller_documents FOR SELECT
  TO authenticated USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "seller_insert_docs" ON seller_documents;
CREATE POLICY "seller_insert_own_documents" ON seller_documents FOR INSERT
  TO authenticated WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "seller_update_docs" ON seller_documents;
CREATE POLICY "seller_update_own_documents" ON seller_documents FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR is_platform_admin()
  )
  WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR is_platform_admin()
  );

-- Seul l'admin peut changer le statut de vérification d'un document.
CREATE OR REPLACE FUNCTION protect_document_status_field()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_document_status ON seller_documents;
CREATE TRIGGER trg_protect_document_status
BEFORE UPDATE ON seller_documents
FOR EACH ROW EXECUTE FUNCTION protect_document_status_field();
