/*
# Correctif du bug critique : aucun vendeur ne pouvait créer sa boutique

## Deux bugs cumulés trouvés en conditions réelles (2 vrais comptes bloqués
## en base : liyahjoha@proton.me, matajea@hmail.com, et un 3e déjà confirmé
## dimifogang237@gmail.com — prouvant que le bug touchait TOUT le monde,
## pas seulement les emails non confirmés)

1. OnboardingPage.tsx insérait dans `sellers` des colonnes qui n'existaient
   PAS sur cette base réelle : store_name, store_description,
   warehouse_address, shipping_zone, iban, swift, mobile_money,
   business_address, ship_national/international/express/local/pickup.
   Chaque tentative d'insertion échouait donc à coup sûr avec une erreur
   Postgres "column does not exist", indépendamment de tout problème de
   session.

2. Le projet Supabase Auth exige la confirmation d'email
   (email_confirmed_at = null pour les comptes récents). `signUp()` ne
   renvoie donc AUCUNE session active tant que l'email n'est pas confirmé.
   L'insertion `sellers` qui suivait immédiatement s'exécutait donc en tant
   qu'utilisateur anonyme, et la RLS (auth.uid() = user_id) la bloquait
   silencieusement. Même en corrigeant le bug n°1, la création de compte
   vendeur serait restée cassée pour quiconque n'a pas confirmé son email
   avant de continuer.

## Correctif
- Ajoute les colonnes réellement manquantes (préservant le travail UI déjà
  fait pour les collecter : adresse entrepôt, zone de livraison, options de
  livraison, adresse professionnelle) plutôt que de perdre ces données.
- Crée la ligne `sellers` via un trigger AFTER INSERT sur `auth.users`
  (SECURITY DEFINER, s'exécute indépendamment de toute session côté
  client) — élimine complètement la dépendance à un état de session actif.
- Anti-collision sur store_slug : si le slug choisi est déjà pris, un
  suffixe est ajouté automatiquement plutôt que de faire échouer tout
  le compte.
- Rattrape rétroactivement les comptes déjà bloqués.

## Vérifié réellement (pas juste écrit)
Test end-to-end exécuté : insertion simulée dans auth.users (email non
confirmé, comme le cas réel qui a cassé) → vérification que le trigger crée
bien la ligne sellers avec toutes les données (adresse, banque, livraison)
→ vérification qu'un produit peut ensuite être inséré sous la RLS de ce
vendeur (set role authenticated + jwt.sub simulé) → nettoyage complet des
données de test.
*/

-- ============ Colonnes réellement manquantes (additives) ============
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_address text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS warehouse_address text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS shipping_zone text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS ship_national boolean NOT NULL DEFAULT true;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS ship_international boolean NOT NULL DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS ship_express boolean NOT NULL DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS ship_local boolean NOT NULL DEFAULT true;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS ship_pickup boolean NOT NULL DEFAULT false;

-- ============ Trigger de création automatique du vendeur ============
CREATE OR REPLACE FUNCTION handle_new_seller_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  base_slug text;
  final_slug text;
  suffix int := 0;
BEGIN
  meta := NEW.raw_user_meta_data;

  IF coalesce(meta->>'role', '') <> 'seller' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM sellers WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  base_slug := coalesce(nullif(meta->>'store_slug', ''), lower(regexp_replace(coalesce(meta->>'business_name', 'store'), '[^a-z0-9]+', '-', 'gi')));
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM sellers WHERE store_slug = final_slug) LOOP
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  END LOOP;

  INSERT INTO sellers (
    user_id, business_name, store_slug, description, business_address,
    country_id, business_type, registration_number, vat_number,
    warehouse_address, shipping_zone,
    bank_name, bank_iban, bank_swift, mobile_money_number,
    ship_national, ship_international, ship_express, ship_local, ship_pickup,
    plan, plan_selected, subscription_status, trial_starts_at, trial_ends_at, status
  ) VALUES (
    NEW.id,
    coalesce(meta->>'business_name', meta->>'store_name', 'My Store'),
    final_slug,
    meta->>'store_desc',
    meta->>'business_address',
    nullif(meta->>'country_id', ''),
    nullif(meta->>'business_type', ''),
    meta->>'registration_number',
    meta->>'vat_number',
    meta->>'warehouse_address',
    meta->>'shipping_zone',
    meta->>'bank_name',
    meta->>'iban',
    meta->>'swift',
    meta->>'mobile_money',
    coalesce((meta->>'ship_national')::boolean, true),
    coalesce((meta->>'ship_international')::boolean, false),
    coalesce((meta->>'ship_express')::boolean, false),
    coalesce((meta->>'ship_local')::boolean, true),
    coalesce((meta->>'ship_pickup')::boolean, false),
    coalesce(nullif(meta->>'seller_plan', ''), 'starter'),
    coalesce(nullif(meta->>'seller_plan', ''), 'starter'),
    'trial',
    now(),
    now() + interval '14 days',
    'pending'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_seller_signup ON auth.users;
CREATE TRIGGER trg_handle_new_seller_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_seller_signup();

-- ============ Rattrapage des comptes déjà bloqués ============
DO $$
DECLARE
  u RECORD;
  base_slug text;
  final_slug text;
  suffix int;
BEGIN
  FOR u IN
    SELECT au.id, au.raw_user_meta_data AS meta
    FROM auth.users au
    LEFT JOIN sellers s ON s.user_id = au.id
    WHERE coalesce(au.raw_user_meta_data->>'role', '') = 'seller'
      AND s.id IS NULL
  LOOP
    base_slug := lower(regexp_replace(coalesce(u.meta->>'business_name', u.meta->>'full_name', 'store'), '[^a-z0-9]+', '-', 'gi'));
    final_slug := base_slug;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM sellers WHERE store_slug = final_slug) LOOP
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    END LOOP;

    INSERT INTO sellers (user_id, business_name, store_slug, plan, plan_selected, subscription_status, trial_starts_at, trial_ends_at, status)
    VALUES (
      u.id,
      coalesce(u.meta->>'business_name', u.meta->>'full_name', 'My Store'),
      final_slug,
      coalesce(nullif(u.meta->>'seller_plan', ''), 'starter'),
      coalesce(nullif(u.meta->>'seller_plan', ''), 'starter'),
      'trial', now(), now() + interval '14 days', 'pending'
    );
  END LOOP;
END $$;
