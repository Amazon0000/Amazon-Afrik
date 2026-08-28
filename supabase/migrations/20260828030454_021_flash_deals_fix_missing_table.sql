/*
# Bug d'incohérence réel #1 trouvé en production (via accès direct MCP Supabase)

Le code frontend (fetchActiveFlashDeals, fetchProductFlashDeal,
fetchSellerFlashDeals, createFlashDeal, endFlashDeal dans src/lib/db.ts)
interroge une table `flash_deals` qui n'existait pas du tout sur la base de
production — seule une table `flash_sales` sans rapport (name/start_date/
end_date, pas de product_id) existait. La fonctionnalité "Flash Deals" par
produit était donc entièrement cassée en silence (chaque appel échouait et
était avalé par un try/catch qui retournait un tableau vide).

Contenu identique à la migration locale 20260826010000_014_flash_deals.sql
déjà présente dans le dépôt — seule son application réelle manquait.
*/

CREATE TABLE IF NOT EXISTS flash_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  discount_percent numeric NOT NULL CHECK (discount_percent > 0 AND discount_percent < 100),
  deal_price numeric NOT NULL,
  stock_limit int,
  claimed_count int NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flash_deals_product ON flash_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller ON flash_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active_window ON flash_deals(is_active, starts_at, ends_at);

ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_flash_deals" ON flash_deals;
CREATE POLICY "public_read_flash_deals" ON flash_deals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "seller_insert_flash_deals" ON flash_deals;
CREATE POLICY "seller_insert_flash_deals" ON flash_deals FOR INSERT TO authenticated
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "seller_update_flash_deals" ON flash_deals;
CREATE POLICY "seller_update_flash_deals" ON flash_deals FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())))
  WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid())));
