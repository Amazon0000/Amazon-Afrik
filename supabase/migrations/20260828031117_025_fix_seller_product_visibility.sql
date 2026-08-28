/*
# Fix: sellers could never see their own products (session concurrente)

Cette migration a été appliquée directement sur la base de production par
une autre session travaillant en parallèle sur ce projet pendant les
vérifications du module Advertising (détectée via `supabase db list
migrations` — apparue sous ce nom/version sans que je l'aie appliquée
moi-même). Contenu reconstitué fidèlement à partir de l'état réel des
policies observé en base (pg_policies), pour que ce fichier Git reflète
exactement la production.

Root cause (comme documenté dans la migration Git préexistante
20260827070000_022_fix_seller_product_visibility.sql) : la seule policy
SELECT sur products ne montrait que approval_status = 'approved' — un
vendeur ne pouvait donc jamais relire son propre produit fraîchement créé
(en attente d'approbation), ce qui faisait échouer silencieusement
createProduct() à chaque fois.
*/

DROP POLICY IF EXISTS "seller_read_own_products" ON products;
CREATE POLICY "seller_read_own_products" ON products FOR SELECT
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "seller_read_own_product_images" ON product_images;
CREATE POLICY "seller_read_own_product_images" ON product_images FOR SELECT
  TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN sellers s ON s.id = p.seller_id
    WHERE s.user_id = (select auth.uid())
  ));
