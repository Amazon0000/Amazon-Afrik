// POST /functions/v1/ads-create-payment
// Body: { campaignId: string, provider: 'stripe'|'flutterwave'|'payunit', returnUrl: string }
//
// Rôle : vérifier que l'utilisateur authentifié est bien propriétaire de la
// campagne, créer une référence interne unique, initialiser le paiement chez
// le provider choisi (sur les comptes marchands MARKETPLACE, pas ceux du
// vendeur), enregistrer la ligne advertising_payments en 'pending', et
// renvoyer l'URL de redirection. N'active JAMAIS la campagne ici — seul un
// webhook vérifié le fait.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { stripeAdapter } from '../_shared/stripe.ts';
import { flutterwaveAdapter } from '../_shared/flutterwave.ts';
import { payunitAdapter } from '../_shared/payunit.ts';
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

    // Client "utilisateur" (respecte RLS) pour vérifier l'identité et la propriété.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: 'Non authentifié' }, 401);

    const body = await req.json();
    const { campaignId, provider, returnUrl } = body as {
      campaignId: string; provider: SupportedProvider; returnUrl: string;
    };

    if (!campaignId || !provider || !returnUrl) {
      return jsonResponse({ error: 'campaignId, provider et returnUrl sont requis' }, 400);
    }
    if (!adapters[provider]) {
      return jsonResponse({ error: `Provider non supporté: ${provider}` }, 400);
    }

    const admin = getAdminClient();

    // Vérifier que la campagne appartient bien au vendeur authentifié (défense
    // en profondeur en plus de la RLS déjà en place sur ad_campaigns).
    const { data: campaign, error: campaignErr } = await admin
      .from('ad_campaigns')
      .select('*, sellers!inner(user_id)')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignErr || !campaign) return jsonResponse({ error: 'Campagne introuvable' }, 404);
    if (campaign.sellers.user_id !== userData.user.id) {
      return jsonResponse({ error: "Cette campagne n'appartient pas à ce vendeur" }, 403);
    }
    if (campaign.payment_status === 'paid') {
      return jsonResponse({ error: 'Cette campagne est déjà payée' }, 409);
    }
    if (!campaign.price || !campaign.currency_code) {
      return jsonResponse({ error: 'Campagne mal configurée (prix/devise manquants)' }, 400);
    }

    // Référence interne unique et stable pour cette tentative de paiement —
    // sert de clé d'idempotence de bout en bout.
    const internalReference = `ADS-${campaign.id}-${Date.now()}`;
    const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ads-webhook-${provider}`;

    const result = await adapters[provider].createPayment({
      internalReference,
      amount: Number(campaign.price),
      currency: campaign.currency_code,
      description: `Zando Ads — campagne ${campaign.id}`,
      returnUrl,
      notifyUrl,
      metadata: { campaign_id: campaign.id, seller_id: campaign.seller_id },
    });

    const { error: insertErr } = await admin.from('advertising_payments').insert({
      campaign_id: campaign.id,
      seller_id: campaign.seller_id,
      provider,
      provider_reference: result.providerReference,
      internal_reference: internalReference,
      amount: campaign.price,
      currency_code: campaign.currency_code,
      status: 'pending',
    });
    if (insertErr) {
      return jsonResponse({ error: `Erreur enregistrement paiement: ${insertErr.message}` }, 500);
    }

    await admin.from('ad_campaigns').update({
      payment_provider: provider,
      payment_reference: internalReference,
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id);

    return jsonResponse({ redirectUrl: result.redirectUrl, internalReference });
  } catch (e) {
    console.error('ads-create-payment error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
