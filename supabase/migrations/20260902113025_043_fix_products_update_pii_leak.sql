/*
# Faille de sécurité critique réelle trouvée : products UPDATE

Une policy résiduelle "seller_update_products" (qual=true, TO authenticated)
coexistait avec la bonne policy restrictive "seller_update_own_products"
(qual = seller_id appartient au vendeur connecté). Postgres RLS combine les
policies permissives du même type par OR — la présence de la policy
qual=true rendait donc la restriction de l'autre COMPLÈTEMENT inopérante :
N'IMPORTE QUEL utilisateur connecté pouvait modifier N'IMPORTE QUEL produit
de N'IMPORTE QUEL vendeur (prix, stock, description, statut d'approbation...).

Trouvée en vérifiant les policies avant de brancher la mise à jour de stock
du module Inventory Alerts.

Supprimée. La policy restrictive existante (seller_update_own_products) +
admin_update_products couvrent déjà tous les cas légitimes.

## Vérifié réellement
Un vendeur B a tenté de modifier le prix d'un produit du vendeur A après ce
correctif -> 0 ligne affectée (bloqué). Nettoyage effectué.
*/

DROP POLICY IF EXISTS "seller_update_products" ON products;
