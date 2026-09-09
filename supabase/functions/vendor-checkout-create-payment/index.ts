// POST /functions/v1/vendor-checkout-create-payment
// Body: { orderId: string, provider: 'stripe'|'paddle'|'payunit'|'paystack'|'flutterwave', returnUrl: string, buyerEmail?: string }
//
// Rôle : initialise un vrai paiement chez le PSP du VENDEUR (pas la
// plateforme) en utilisant ses propres clés stockées de façon sécurisée
// (seller_psp_credentials + seller_psp_secrets — jamais lisibles par le
// client, voir migration 054). Enregistre vendor_psp_payments en
// 'pending'. N'active/ne confirme JAMAIS la commande ici — seul un
// webhook vérifié le fait (activate-vendor-payment.ts).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { createStripeAdapterWithKey } from '../_shared/stripe.ts';
import { createFlutterwaveAdapterWithKey } from '../_shared/flutterwave.ts';
import { createPayunitAdapterWithKey } from '../_shared/payunit.ts';
import { createPaddleAdapterWithKey } from '../_shared/paddle.ts';
import { createPaystackAdapterWithKey } from '../_shared/paystack.ts';

type Provider = 'stripe' | 'paddle' | 'payunit' | 'paystack' | 'flutterwave';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { orderId, provider, returnUrl, buyerEmail } = body as {
      orderId?: string; provider?: Provider; returnUrl?: string; buyerEmail?: string;
    };
    if (!orderId || !provider || !returnUrl) {
      return jsonResponse({ error: 'orderId, provider et returnUrl sont requis' }, 400);
    }

    const admin = getAdminClient();

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, seller_id, total, currency_code, status, tracking_id')
      .eq('id', orderId)
      .maybeSingle();
    if (orderErr || !order) return jsonResponse({ error: 'Commande introuvable' }, 404);
    if (order.status !== 'pending') return jsonResponse({ error: `Commande déjà en statut ${order.status}` }, 400);

    const { data: credential, error: credErr } = await admin
      .from('seller_psp_credentials')
      .select('id, public_key, merchant_id, mode')
      .eq('seller_id', order.seller_id)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();
    if (credErr || !credential) return jsonResponse({ error: `Ce vendeur n'a pas connecté ${provider}` }, 404);

    const { data: secretRow, error: secretErr } = await admin
      .from('seller_psp_secrets')
      .select('secret_key')
      .eq('credential_id', credential.id)
      .maybeSingle();
    if (secretErr || !secretRow?.secret_key) {
      return jsonResponse({ error: `Clé secrète ${provider} manquante pour ce vendeur — reconnectez le PSP` }, 400);
    }

    const internalReference = `VENDOR-${order.seller_id}-${Date.now()}`;
    const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/vendor-checkout-webhook-${provider}`;

    let adapter;
    switch (provider) {
      case 'stripe': adapter = createStripeAdapterWithKey(secretRow.secret_key); break;
      case 'flutterwave': adapter = createFlutterwaveAdapterWithKey(secretRow.secret_key); break;
      case 'paddle': adapter = createPaddleAdapterWithKey(secretRow.secret_key); break;
      case 'paystack': adapter = createPaystackAdapterWithKey(secretRow.secret_key); break;
      case 'payunit': {
        if (!credential.merchant_id) return jsonResponse({ error: "ID marchand PayUnit manquant pour ce vendeur" }, 400);
        // PayUnit sépare api_user (merchant_id ici) / api_password (secret) / x-api-key.
        // Le vendeur doit avoir fourni les 3 — public_key sert de x-api-key.
        if (!credential.public_key) return jsonResponse({ error: "Clé API PayUnit (x-api-key) manquante pour ce vendeur" }, 400);
        adapter = createPayunitAdapterWithKey(credential.merchant_id, secretRow.secret_key, credential.public_key, credential.mode);
        break;
      }
      default:
        return jsonResponse({ error: `Provider non supporté: ${provider}` }, 400);
    }

    const result = await adapter.createPayment({
      internalReference,
      amount: Number(order.total),
      currency: order.currency_code || 'USD',
      description: `Zando — commande ${order.tracking_id || order.id}`,
      returnUrl,
      notifyUrl,
      metadata: buyerEmail ? { buyer_email: buyerEmail } : undefined,
    });

    const { error: insertErr } = await admin.from('vendor_psp_payments').insert({
      order_id: order.id,
      seller_id: order.seller_id,
      credential_id: credential.id,
      provider,
      provider_reference: result.providerReference,
      internal_reference: internalReference,
      amount: Number(order.total),
      currency_code: order.currency_code || 'USD',
      status: 'pending',
    });
    if (insertErr) return jsonResponse({ error: `Erreur enregistrement paiement: ${insertErr.message}` }, 500);

    return jsonResponse({ redirectUrl: result.redirectUrl, internalReference });
  } catch (e) {
    console.error('vendor-checkout-create-payment error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
