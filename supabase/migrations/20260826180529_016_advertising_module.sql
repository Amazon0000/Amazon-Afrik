/*
# Seller Advertising / Sponsored Products — Module publicitaire

## Contexte
Le projet possède déjà `ad_campaigns` (migration 003) utilisée aujourd'hui pour un
système de campagnes très simple (budget/durée, pas de paiement réel). Cette
migration NE remplace PAS cette table : elle l'étend avec les colonnes
nécessaires au nouveau flux payant, et ajoute les tables manquantes.

## Règle business critique
La marketplace ne prend AUCUNE commission sur les ventes des vendeurs.
Les seuls revenus marketplace sont : abonnements vendeurs + publicité.
Les paiements publicitaires vont sur les comptes marchands de la marketplace
(configurés via des secrets Edge Function), JAMAIS sur `payment_providers`
(qui reste réservé aux moyens d'encaissement des VENTES des vendeurs).

## Nouvelles tables
1. `advertising_plans` — formules publicitaires configurables par le Super Admin
   (durée, prix, emplacements autorisés, statut)
2. `advertising_placements` — registre extensible des emplacements disponibles
3. `advertising_payments` — transactions publicitaires (source de vérité paiement),
   séparées du statut de la campagne
4. `advertising_events` — impressions/clics bruts, agrégeables plus tard

## Colonnes ajoutées à `ad_campaigns` (existante)
plan_id, placement_id, product_id, payment_status, payment_provider,
payment_reference, starts_at, expires_at, reviewed flags déjà présents (012).
`status` existant (pending/active/ended/rejected) est conservé pour compat,
on ajoute des valeurs possibles ('paused','expired','cancelled') sans supprimer
les anciennes, et on n'écrit JAMAIS dans ce champ depuis le frontend pour
l'activation — seul le backend (Edge Function post-vérification) le fait.

## Sécurité
- RLS stricte : un vendeur ne voit/modifie que ses propres campagnes et paiements
  publicitaires (via sellers.user_id = auth.uid()).
- Les webhooks utilisent la Service Role Key côté Edge Function (bypass RLS de
  façon contrôlée côté serveur uniquement) — jamais exposée au frontend.
- Le Super Admin (table super_admins existante) gère les plans/placements.
*/

-- ============ ADVERTISING PLACEMENTS ============
CREATE TABLE IF NOT EXISTS advertising_placements (
  id text PRIMARY KEY, -- slug stable ex: 'homepage', 'search_results'
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advertising_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_placements" ON advertising_placements;
CREATE POLICY "public_read_placements" ON advertising_placements
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "superadmin_manage_placements" ON advertising_placements;
CREATE POLICY "superadmin_manage_placements" ON advertising_placements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true));

INSERT INTO advertising_placements (id, name, description, sort_order) VALUES
  ('homepage', 'Homepage', 'Bannière et carrousel en page d''accueil', 1),
  ('featured_products', 'Featured Products', 'Section produits en vedette', 2),
  ('category_page', 'Category Page', 'En tête de page catégorie', 3),
  ('search_results', 'Search Results', 'Résultats de recherche sponsorisés', 4),
  ('product_recommendations', 'Product Recommendations', 'Recommandations sur fiche produit', 5),
  ('sponsored_section', 'Sponsored Section', 'Section dédiée "Sponsorisé"', 6)
ON CONFLICT (id) DO NOTHING;

-- ============ ADVERTISING PLANS ============
CREATE TABLE IF NOT EXISTS advertising_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_days int NOT NULL CHECK (duration_days > 0),
  price numeric NOT NULL CHECK (price >= 0),
  currency_code text NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
  allowed_placements text[] NOT NULL DEFAULT '{}', -- références logiques vers advertising_placements.id
  max_active_per_seller int, -- limite optionnelle
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_plans_active ON advertising_plans(is_active);

ALTER TABLE advertising_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_plans" ON advertising_plans;
CREATE POLICY "public_read_active_plans" ON advertising_plans
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "superadmin_read_all_plans" ON advertising_plans;
CREATE POLICY "superadmin_read_all_plans" ON advertising_plans
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true));
DROP POLICY IF EXISTS "superadmin_manage_plans" ON advertising_plans;
CREATE POLICY "superadmin_manage_plans" ON advertising_plans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true));

INSERT INTO advertising_plans (name, description, duration_days, price, currency_code, allowed_placements, sort_order) VALUES
  ('Boost 7 jours', 'Mise en avant courte durée', 7, 9.99, 'USD', ARRAY['homepage','search_results','featured_products'], 1),
  ('Boost 15 jours', 'Mise en avant intermédiaire', 15, 17.99, 'USD', ARRAY['homepage','search_results','featured_products','category_page'], 2),
  ('Boost 30 jours', 'Mise en avant longue durée, meilleure visibilité', 30, 29.99, 'USD', ARRAY['homepage','search_results','featured_products','category_page','sponsored_section'], 3)
ON CONFLICT DO NOTHING;

-- ============ EXTEND ad_campaigns (existing table) ============
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES advertising_plans(id) ON DELETE SET NULL;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS placement_id text REFERENCES advertising_placements(id) ON DELETE SET NULL;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS currency_code text REFERENCES currencies(code);
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS payment_provider text CHECK (payment_provider IN ('stripe','flutterwave','payunit') OR payment_provider IS NULL);
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','cancelled'));
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Élargir les valeurs possibles de campaign_status (status) sans casser l'existant :
-- pending | active | paused | expired | cancelled | ended | rejected (ended/rejected conservés pour compat)
DO $$ BEGIN
  ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
  ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_status_check
    CHECK (status IN ('pending','active','paused','expired','cancelled','ended','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_campaigns_payment_reference ON ad_campaigns(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_product ON ad_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement ON ad_campaigns(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_payment_status ON ad_campaigns(payment_status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_expires_at ON ad_campaigns(expires_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active_lookup ON ad_campaigns(status, payment_status, expires_at) WHERE status = 'active' AND payment_status = 'paid';

-- RLS stricte pour ad_campaigns : remplace les policies trop permissives (003)
DROP POLICY IF EXISTS "auth_insert_ads" ON ad_campaigns;
DROP POLICY IF EXISTS "auth_update_ads" ON ad_campaigns;

DROP POLICY IF EXISTS "seller_insert_own_campaigns" ON ad_campaigns;
CREATE POLICY "seller_insert_own_campaigns" ON ad_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    AND product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "seller_read_own_campaigns" ON ad_campaigns;
CREATE POLICY "seller_read_own_campaigns" ON ad_campaigns
  FOR SELECT TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true)
  );

DROP POLICY IF EXISTS "seller_cancel_own_pending_campaigns" ON ad_campaigns;
CREATE POLICY "seller_cancel_own_pending_campaigns" ON ad_campaigns
  FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()) AND payment_status = 'pending')
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "superadmin_manage_campaigns" ON ad_campaigns;
CREATE POLICY "superadmin_manage_campaigns" ON ad_campaigns
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true));

-- La lecture publique existante (public_read_ads) est supprimée : les campagnes
-- ne doivent plus être lisibles publiquement telles quelles (contiennent des
-- données de paiement). Le produit sponsorisé public passe par la fonction
-- SQL get_active_sponsored_products() ci-dessous, qui n'expose aucune donnée
-- de paiement.
DROP POLICY IF EXISTS "public_read_ads" ON ad_campaigns;

-- ============ ADVERTISING PAYMENTS (source de vérité paiement) ============
CREATE TABLE IF NOT EXISTS advertising_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe','flutterwave','payunit')),
  provider_reference text NOT NULL, -- ID transaction chez le provider
  internal_reference text NOT NULL UNIQUE, -- référence unique générée par nous (idempotency key)
  amount numeric NOT NULL CHECK (amount >= 0),
  currency_code text NOT NULL REFERENCES currencies(code),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  raw_webhook_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_payments_campaign ON advertising_payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_seller ON advertising_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_status ON advertising_payments(status);
CREATE INDEX IF NOT EXISTS idx_ad_payments_provider_ref ON advertising_payments(provider, provider_reference);

ALTER TABLE advertising_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_read_own_payments" ON advertising_payments;
CREATE POLICY "seller_read_own_payments" ON advertising_payments
  FOR SELECT TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true)
  );
-- Aucune policy INSERT/UPDATE pour authenticated : seules les Edge Functions
-- (via Service Role Key, qui bypass RLS) créent/mettent à jour ces lignes.

-- ============ ADVERTISING EVENTS (impressions/clics bruts) ============
CREATE TABLE IF NOT EXISTS advertising_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression','click')),
  placement_id text REFERENCES advertising_placements(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_events_campaign ON advertising_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_type ON advertising_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_events_created ON advertising_events(created_at);

ALTER TABLE advertising_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_events" ON advertising_events;
CREATE POLICY "anon_insert_events" ON advertising_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seller_read_own_events" ON advertising_events;
CREATE POLICY "seller_read_own_events" ON advertising_events
  FOR SELECT TO authenticated
  USING (
    campaign_id IN (
      SELECT ac.id FROM ad_campaigns ac
      JOIN sellers s ON ac.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM super_admins sa WHERE sa.email = auth.jwt()->>'email' AND sa.is_active = true)
  );

-- ============ AUDIT LOG ENTRIES via table existante ============
-- Le projet a déjà `logAuditAction()` / une table d'audit (compliance center,
-- migration 007). On la réutilise depuis les Edge Functions pour tracer :
-- campaign_created, payment_initiated, payment_confirmed, campaign_activated,
-- campaign_expired, campaign_cancelled, payment_refunded.
-- Rien à créer ici, juste une convention d'action côté Edge Functions.

-- ============ FONCTION : produits sponsorisés actifs (source de vérité) ============
CREATE OR REPLACE FUNCTION get_active_sponsored_products(p_placement text DEFAULT NULL, p_limit int DEFAULT 20)
RETURNS SETOF products
LANGUAGE sql STABLE
AS $$
  SELECT p.*
  FROM products p
  INNER JOIN ad_campaigns ac ON ac.product_id = p.id
  INNER JOIN sellers s ON s.id = p.seller_id
  WHERE ac.status = 'active'
    AND ac.payment_status = 'paid'
    AND ac.expires_at > now()
    AND (p_placement IS NULL OR ac.placement_id = p_placement)
    AND p.is_active = true
    AND p.approval_status = 'approved'
    AND s.status = 'approved'
  ORDER BY ac.starts_at DESC
  LIMIT p_limit;
$$;

-- ============ FONCTION : expiration automatique (appelée par cron Edge Function) ============
CREATE OR REPLACE FUNCTION expire_ad_campaigns()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  affected int;
BEGIN
  UPDATE ad_campaigns
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
