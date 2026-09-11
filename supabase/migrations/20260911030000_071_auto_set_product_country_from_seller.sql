/*
# products.country_id was never set for real seller-created products
# (audit finding, applied live 2026-09-11) — "Shop by Location" would
# silently show nothing for any real product

"Shop by Location" (CatalogPage) filters products by products.country_id,
matching the intended behavior: selecting a location shows every product
sold FROM that location (the seller's country); leaving it on all
locations shows the whole marketplace. Confirmed the existing products in
the database that DO have a country_id are seed/demo data — the real Add
Product form (createProduct in src/lib/db.ts) never passes a countryId at
all, so every product a real seller creates would have country_id = NULL
and would never appear for a buyer filtering by any specific location,
only under "all locations".

Fixed at the trigger level (not just the client call) so this can never
be silently forgotten again by any future insert path — a product's
country is automatically set from its seller's registered country unless
explicitly provided.
*/

CREATE OR REPLACE FUNCTION set_product_country_from_seller()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.country_id IS NULL THEN
    SELECT country_id INTO NEW.country_id FROM sellers WHERE id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_product_country ON products;
CREATE TRIGGER trg_set_product_country
BEFORE INSERT ON products
FOR EACH ROW EXECUTE FUNCTION set_product_country_from_seller();

-- Backfill existing products so any already-missing country immediately
-- matches their seller's, not just going forward. One product remained
-- unbackfilled because its own seller also had no country set — that's
-- the exact gap the new Store Settings country editor (this same
-- session) exists to let a seller fix themselves.
UPDATE products p SET country_id = s.country_id
FROM sellers s WHERE p.seller_id = s.id AND p.country_id IS NULL AND s.country_id IS NOT NULL;
