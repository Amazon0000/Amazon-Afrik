/*
# Ad impressions/clicks were completely fake (audit finding, applied live 2026-09-11)

Confirmed nothing anywhere in the codebase (frontend or Edge Functions)
ever wrote to advertising_events, and ad_campaigns.impressions/clicks had
no trigger and no client-side increment path either — a seller running a
real, paid sponsored campaign would see impressions/clicks stuck at
whatever value existed at campaign creation, forever, regardless of how
many times their product was actually shown or clicked. The entire ad
performance section was built on static, never-updating numbers.

record_ad_event resolves the correct campaign server-side from
product_id + placement (same eligibility rule as
get_active_sponsored_products, migration 020) rather than trusting a
campaign_id sent directly from the browser — a buyer's client only ever
needs to say "this sponsored product was shown/clicked in this
placement", not which campaign owns it.
*/

CREATE OR REPLACE FUNCTION record_ad_event(p_product_id uuid, p_placement text, p_event_type text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
BEGIN
  IF p_event_type NOT IN ('impression', 'click') THEN
    RETURN;
  END IF;

  SELECT ac.id INTO v_campaign_id
  FROM ad_campaigns ac
  WHERE ac.product_id = p_product_id
    AND ac.status = 'active'
    AND ac.payment_status = 'paid'
    AND ac.expires_at > now()
    AND (p_placement IS NULL OR ac.placement_id = p_placement)
  ORDER BY ac.starts_at DESC
  LIMIT 1;

  IF v_campaign_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO advertising_events (campaign_id, event_type, placement_id) VALUES (v_campaign_id, p_event_type, p_placement);

  IF p_event_type = 'impression' THEN
    UPDATE ad_campaigns SET impressions = impressions + 1 WHERE id = v_campaign_id;
  ELSE
    UPDATE ad_campaigns SET clicks = clicks + 1 WHERE id = v_campaign_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION record_ad_event(uuid, text, text) TO anon, authenticated;
