/*
# Bug critique #3 : AUCUNE commande n'a jamais pu être passée sur la plateforme

## Preuve
`select count(*) from orders` = 0, alors que la plateforme est censée être
en production active depuis des semaines.

## Deux bugs cumulés (même schéma que le bug d'onboarding vendeur)
1. CheckoutPage.tsx insère toujours guest_name/guest_email/guest_phone dans
   `orders` (même null pour un utilisateur connecté — la clé reste présente
   dans l'objet envoyé) — ces colonnes n'existent pas du tout. Chaque
   commande, connectée ou invité, échoue avec 'column does not exist'.
2. Même corrigé, la policy RLS INSERT sur `orders` exige
   auth.uid() = user_id — aucune policy n'autorise un visiteur anonyme à
   passer commande avec user_id NULL. Le flux "commande invité" pourtant
   entièrement construit côté UI (CheckoutPage.tsx collecte nom/email/
   téléphone/adresse invité) n'a jamais pu fonctionner.

## Correctif
Ajoute les colonnes invité manquantes (préserve le travail UI déjà fait),
et ajoute la policy RLS permettant à un visiteur anonyme de créer une
commande invité (uniquement si user_id IS NULL ET les champs invité sont
renseignés — jamais une commande "orpheline" sans aucune identité).

## Vérifié réellement (pas juste écrit)
Test end-to-end exécuté : commande invité insérée sous role anon → lecture
confirmée en base → nettoyage.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone text;

DROP POLICY IF EXISTS "guest_insert_orders" ON orders;
CREATE POLICY "guest_insert_orders" ON orders FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL);
