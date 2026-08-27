// POST /functions/v1/ads-refund-campaign
// Body: { campaignId: string, amount?: number }
// Réservé au Super Admin. Appelle le vrai endpoint de remboursement du
// provider utilisé pour cette campagne, puis met à jour advertising_payments
// (status='refunded') et ad_campaigns (payment_status='refunded',
// status='cancelled') — jamais l'inverse. PayUnit n'a pas d'endpoint de
// remboursement public documenté : dans ce cas on renvoie une erreur claire
// plutôt que de fabriquer un faux succès (section 7 et 19 du cahier des charges).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { stripeAdapter } from '../_shared/stripe.ts';
import { flutterwaveAdapter } from '../_shared/flutterwave.ts';
import { payunitAdapter } from '../_shared/payunit.ts';
import { notifyUser } from '../_shared/notify.ts';
import type { PaymentProviderAdapter, SupportedProvider } from '../_shared/payment-provider.ts';

const adapters: Record<SupportedProvider, PaymentProviderAdapter> = {
  stripe: stripeAdapter,
  flutterwave: flutterwaveAdapter,
  payunit: payunitAdapter,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Non authentifié' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: 'Non authentifié' }, 401);

    const admin = getAdminClient();
    const { data: isSuperAdmin } = await admin
      .from('super_admins').select('id').eq('email', userData.user.email).eq('is_active', true).maybeSingle();
    if (!isSuperAdmin) return jsonResponse({ error: 'Réservé au Super Admin' }, 403);

    const { campaignId, amount } = await req.json();
    if (!campaignId) return jsonResponse({ error: 'campaignId requis' }, 400);

    const { data: campaign } = await admin
      .from('ad_campaigns').select('*, sellers(user_id)').eq('id', campaignId).maybeSingle();
    if (!campaign) return jsonResponse({ error: 'Campagne introuvable' }, 404);
    if (campaign.payment_status !== 'paid') {
      return jsonResponse({ error: 'Seule une campagne payée peut être remboursée' }, 409);
    }

    const { data: payment } = await admin
      .from('advertising_payments').select('*').eq('campaign_id', campaignId).eq('status', 'paid').maybeSingle();
    if (!payment) return jsonResponse({ error: 'Paiement confirmé introuvable pour cette campagne' }, 404);

    const provider = payment.provider as SupportedProvider;
    const refundResult = await adapters[provider].refundPayment({
      providerReference: payment.provider_reference,
      amount,
    });

    if (!refundResult.success) {
      return jsonResponse({ error: refundResult.message || 'Remboursement refusé par le provider' }, 502);
    }

    await admin.from('advertising_payments').update({
      status: 'refunded', updated_at: new Date().toISOString(),
    }).eq('id', payment.id);
    await admin.from('ad_campaigns').update({
      payment_status: 'refunded', status: 'cancelled', updated_at: new Date().toISOString(),
    }).eq('id', campaignId);

    await admin.from('audit_logs').insert({
      actor_id: userData.user.id, action: 'payment_refunded',
      target_type: 'ad_campaign', target_id: campaignId,
      new_value: { provider, refund_reference: refundResult.refundReference },
      created_at: new Date().toISOString(),
    });

    const sellerUserId = campaign.sellers?.user_id;
    if (sellerUserId) {
      await notifyUser(
        admin, sellerUserId, 'ad_refund',
        'Campagne remboursée',
        `Votre campagne "${campaign.name}" a été remboursée et annulée par l'équipe Zando.`,
        'ads', { campaignId }
      );
    }

    return jsonResponse({ ok: true, refundReference: refundResult.refundReference });
  } catch (e) {
    console.error('ads-refund-campaign error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
