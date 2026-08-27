/*
# Cleanup: redundant ad_campaigns policies

The strict-data-isolation migration (016_strict_data_isolation) added its
own seller/admin ad_campaigns policies as a stopgap. A later migration
(016_advertising_module, applied after it chronologically) replaced
ad_campaigns with a more complete, more correct policy set — notably
restricting seller self-service updates to payment_status = 'pending'
only (016_strict_data_isolation's version had no such restriction) and
removing public read entirely in favor of a SECURITY DEFINER function
that never exposes payment data. The two policy sets otherwise coexist
harmlessly (Postgres ORs same-command policies), but the leftover
policies here are strictly more permissive than intended, so they are
dropped in favor of the advertising module's versions. The protective
trigger (protect_ad_campaign_review_fields) from 016_strict_data_isolation
is kept as defense-in-depth — it still applies regardless of which
policy allowed the UPDATE.
*/

DROP POLICY IF EXISTS "seller_update_own_ads" ON ad_campaigns;
DROP POLICY IF EXISTS "admin_update_ads" ON ad_campaigns;
DROP POLICY IF EXISTS "seller_insert_own_ads" ON ad_campaigns;
DROP POLICY IF EXISTS "public_read_ads" ON ad_campaigns;
