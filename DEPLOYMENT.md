# Déploiement du module Advertising / Sponsored Products

## État réel au 28/08/2026 — IMPORTANT

Ce module a été **réellement déployé et vérifié** sur le projet Supabase de
production (`tysbzwgzeyqtzluvdria`, "Amazon0000's Project") via le
connecteur MCP Supabase officiel (accès réel, pas simulé) :

- Toutes les migrations du module (016 à 025 + 020-021-023 du travail
  parallèle) ont été **réellement appliquées** à cette base.
- Un test de bout en bout a été exécuté avec de vraies données (vendeur,
  produit, campagne active/payée), confirmant que `get_active_sponsored_products()`
  fonctionne pour un visiteur anonyme tout en gardant `ad_campaigns`
  totalement inaccessible en lecture directe pour ce même rôle — puis les
  données de test ont été nettoyées.
- Les Security et Performance Advisors Supabase ont été lancés ; les
  avertissements sur mon périmètre (search_path mutable, RLS non optimisée)
  ont été corrigés et re-vérifiés comme résolus.
- **Découverte critique** : l'historique de migrations réellement appliqué à
  cette base divergeait des fichiers Git au-delà de la migration 012 (trois
  migrations `013_marketplace_aggregator`, `014_seller_product_visibility`,
  `015_super_admin_access` existent en prod sans fichier Git correspondant).
  Plusieurs fonctionnalités étaient donc cassées en silence en production :
  `flash_deals` (le code appelait cette table, seule `flash_sales`, sans
  rapport, existait), `contact_messages` (table absente + RLS trop
  permissive dans la version Git d'origine), `coupons`, l'expansion pays
  globale, et la conversion de devises (bug de convention inversée pour
  les devises non-africaines). Tout cela a été corrigé et appliqué
  réellement, pas seulement écrit dans le dépôt.
- Les fichiers de migration Git ont été renommés/complétés pour que leurs
  timestamps correspondent exactement aux versions réellement enregistrées
  par Supabase (`supabase migration list`), afin qu'un futur `supabase db
  push` reste cohérent et idempotent plutôt que de rejouer ou dupliquer du
  contenu déjà en place.
- Note de résidu : quelques anciens fichiers Git (`013_seller_kyc_storage`,
  `014_flash_deals` original, `015_contact_messages` original,
  `016_strict_data_isolation`, `020_fix_sponsored_products_security_definer`)
  correspondent à du contenu déjà superseded/appliqué différemment sur cette
  base précise. Ils restent dans le dépôt (tous idempotents — `IF NOT
  EXISTS` / `DROP POLICY IF EXISTS` partout — donc sans danger à rejouer)
  mais leur statut d'application "telle quelle" sur ce projet spécifique est
  incertain ; la réalité de production fait foi via les fichiers timestampés
  `2026082803xxxx` et `2026082808xxxx`.

Ce qui reste **non déployé** (hors de portée de l'accès MCP Supabase, qui ne
couvre pas les Edge Functions/secrets) : les 7 Edge Functions elles-mêmes,
les secrets de paiement, les webhooks côté provider, et le cron
d'expiration. La suite de ce document reste le guide pour cette partie.

---

Ce guide part du principe que vous lancez ces commandes depuis une machine
(ou un CI) qui a un accès réseau normal à Supabase, Stripe, Flutterwave et
PayUnit — l'environnement dans lequel ce code a été écrit ne l'a pas
(pare-feu sortant restreint à npm/GitHub/PyPI), donc ces commandes n'ont
jamais été exécutées et ce guide n'a pas pu être testé de bout en bout.
Vérifiez chaque résultat avant de passer à l'étape suivante.

## Prérequis

```bash
npm install -g supabase
supabase --version   # doit s'afficher sans erreur
```

Vous aurez besoin de :
- Votre **project ref** Supabase (visible dans l'URL du dashboard : `https://supabase.com/dashboard/project/<PROJECT_REF>`)
- Un **access token** Supabase (dashboard → Account → Access Tokens)
- Vos vraies clés **Stripe**, **Flutterwave**, **PayUnit** (comptes marchands marketplace, jamais ceux des vendeurs)

## 1. Connexion et lien du projet

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxx   # votre access token
supabase login --token "$SUPABASE_ACCESS_TOKEN"
supabase link --project-ref <PROJECT_REF>
```

## 2. Appliquer les migrations (dans l'ordre, elles sont déjà numérotées/datées)

```bash
supabase db push
```

Cette commande applique automatiquement toutes les migrations non encore
appliquées dans `supabase/migrations/`, dans l'ordre chronologique de leur
nom de fichier. Vérifiez la sortie : elle doit lister les migrations 016 à
020 (module Advertising, notifications, cleanup RLS, correctif
SECURITY DEFINER) sans erreur.

**Vérification post-migration** (dans le SQL Editor du dashboard Supabase) :

```sql
select count(*) from advertising_plans;        -- doit renvoyer 3 (plans seedés)
select count(*) from advertising_placements;   -- doit renvoyer 6
select proname, prosecdef from pg_proc where proname = 'get_active_sponsored_products';
-- prosecdef doit être 't' (true) — sinon la migration 020 n'est pas passée
```

## 3. Configurer les secrets des Edge Functions

**Ne jamais utiliser les comptes de paiement des vendeurs ici** — ce sont
les comptes marchands de la marketplace elle-même (revenu publicitaire).

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx \
  FLUTTERWAVE_WEBHOOK_SECRET_HASH=votre-secret-hash-dashboard-flutterwave \
  PAYUNIT_API_USER=xxx \
  PAYUNIT_API_PASSWORD=xxx \
  PAYUNIT_API_KEY=xxx \
  PAYUNIT_MODE=live
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont
injectées automatiquement par Supabase dans les Edge Functions — pas besoin
de les définir manuellement.

Vérifier :
```bash
supabase secrets list
```

## 4. Déployer les Edge Functions

```bash
supabase functions deploy ads-create-payment
supabase functions deploy ads-cancel-campaign
supabase functions deploy ads-refund-campaign
supabase functions deploy ads-webhook-stripe --no-verify-jwt
supabase functions deploy ads-webhook-flutterwave --no-verify-jwt
supabase functions deploy ads-webhook-payunit --no-verify-jwt
supabase functions deploy ads-expire-campaigns --no-verify-jwt
```

(`supabase/config.toml` définit déjà `verify_jwt = false` pour les
fonctions webhooks/cron — le flag `--no-verify-jwt` ci-dessus est une
sécurité supplémentaire si votre version de la CLI ne lit pas encore ce
fichier automatiquement.)

**Vérification** : chaque commande doit afficher une URL du type
`https://<PROJECT_REF>.supabase.co/functions/v1/ads-create-payment`.
Notez ces URLs, elles servent aux étapes suivantes.

## 5. Configurer les webhooks côté chaque provider

### Stripe
Dashboard Stripe → Developers → Webhooks → Add endpoint :
- URL : `https://<PROJECT_REF>.supabase.co/functions/v1/ads-webhook-stripe`
- Événements à écouter : `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- Copier le "Signing secret" affiché → c'est votre `STRIPE_WEBHOOK_SECRET` (étape 3)

### Flutterwave
Dashboard Flutterwave → Settings → Webhooks :
- URL : `https://<PROJECT_REF>.supabase.co/functions/v1/ads-webhook-flutterwave`
- "Secret Hash" que vous définissez ici = votre `FLUTTERWAVE_WEBHOOK_SECRET_HASH` (étape 3, doivent être identiques)

### PayUnit
Le `notify_url` est envoyé dynamiquement à chaque paiement par
`ads-create-payment` (pas de configuration dashboard nécessaire) :
`https://<PROJECT_REF>.supabase.co/functions/v1/ads-webhook-payunit`

## 6. Programmer le cron d'expiration

Deux options :

**Option A — Supabase Scheduled Functions (interface dashboard)** :
Dashboard → Edge Functions → `ads-expire-campaigns` → Schedule → toutes les 5 minutes.

**Option B — pg_cron (SQL Editor)** :
```sql
select cron.schedule(
  'expire-ad-campaigns',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ads-expire-campaigns',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```
(Nécessite l'extension `pg_cron` et `pg_net` activées : Database → Extensions.)

## 7. Test de bout en bout (recommandé avant mode `live`)

1. Mettre `PAYUNIT_MODE=test` et utiliser les clés de test Stripe (`sk_test_...`) / Flutterwave (`FLWSECK_TEST-...`) le temps du test.
2. Depuis l'app : Seller Center → Publicité → créer une campagne → payer avec une carte de test.
3. Vérifier dans Supabase :
   ```sql
   select * from advertising_payments order by created_at desc limit 5;
   select id, status, payment_status, starts_at, expires_at from ad_campaigns order by created_at desc limit 5;
   ```
4. Vérifier qu'une notification est bien créée : `select * from notifications order by created_at desc limit 5;`
5. Tester un webhook dupliqué (relancer manuellement le même événement depuis le dashboard Stripe/Flutterwave) → la campagne ne doit **pas** se dupliquer ni se réactiver.

Une fois validé, repasser les clés en mode `live` (étape 3) et redéployer les secrets.

## 8. Tests automatisés

Les tests unitaires de la logique de paiement (idempotence, validation
montant/devise, signatures webhook) sont dans
`supabase/functions/_shared/*.test.ts` et se lancent avec :

```bash
npm run test:functions
```

25 tests, aucune dépendance réseau — peuvent tourner dans n'importe quel
environnement CI sans configuration supplémentaire.
