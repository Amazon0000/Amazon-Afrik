/*
# CRITICAL: sellers table had zero write protection beyond ownership

Deep audit found that a migration written earlier this project
(033_protect_seller_fields) had a filename collision with a different,
already-applied "033" migration — which silently hid the fact it had
NEVER actually been applied to the live database. Verified directly
against the live schema: there was no trigger at all on `sellers`, and
the only RLS control was ownership (auth.uid() = user_id). That meant
any seller could write ANY column on their own row directly via the
Supabase client, including:

  - is_verified/verified_at/verified_by -> self-grant the Verified
    Merchant badge with zero KYC review
  - subscription_status/plan_expires_at/trial_ends_at -> set an active
    paid plan forever with zero payment, defeating the whole
    subscription billing system
  - status/rating/is_official/total_reviews/total_products -> fake
    approval, inflate trust signals
  - risk_score/compliance_score/health_status/strikes_count/
    compliance_status/phone_verified/email_verified/bank_verified ->
    erase any negative compliance history
  - suspension_reason/rejection_reason/status_changed_at/
    suspended_reason/suspended_at -> tamper with moderation records
  - referred_by_affiliate_id -> redirect commission to any affiliate

This was found and fixed live on 2026-09-10 via direct database
inspection (Supabase MCP); this file brings the migration history back
in sync with what's actually deployed.
*/

CREATE OR REPLACE FUNCTION protect_seller_fields()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.total_reviews := OLD.total_reviews;
    NEW.total_products := OLD.total_products;
    NEW.is_official := OLD.is_official;
    NEW.joined_year := OLD.joined_year;
    NEW.user_id := OLD.user_id;
    NEW.risk_score := OLD.risk_score;
    NEW.compliance_score := OLD.compliance_score;
    NEW.health_status := OLD.health_status;
    NEW.strikes_count := OLD.strikes_count;
    NEW.compliance_status := OLD.compliance_status;
    NEW.suspended_reason := OLD.suspended_reason;
    NEW.suspended_at := OLD.suspended_at;
    NEW.phone_verified := OLD.phone_verified;
    NEW.email_verified := OLD.email_verified;
    NEW.bank_verified := OLD.bank_verified;
    NEW.trial_starts_at := OLD.trial_starts_at;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.subscription_status := OLD.subscription_status;
    NEW.plan_expires_at := OLD.plan_expires_at;
    NEW.is_verified := OLD.is_verified;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
    NEW.suspension_reason := OLD.suspension_reason;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.status_changed_at := OLD.status_changed_at;
    NEW.referred_by_affiliate_id := OLD.referred_by_affiliate_id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_seller_fields ON sellers;
CREATE TRIGGER trg_protect_seller_fields
BEFORE UPDATE ON sellers
FOR EACH ROW EXECUTE FUNCTION protect_seller_fields();

DROP POLICY IF EXISTS "admin_update_sellers" ON sellers;
CREATE POLICY "admin_update_sellers" ON sellers FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
