// POST /functions/v1/subscription-create-payment
// Body: { plan: 'starter'|'premium'|'enterprise', provider: 'stripe'|'flutterwave'|'payunit'|'paddle', returnUrl: string }
//
// Rôle : miroir de ads-create-payment. Initialise le paiement chez le
// provider choisi sur le compte marchand PLATEFORME (jamais celui d'un
// vendeur), enregistre subscription_payments en 'pending', et renvoie
// l'URL de redirection. N'active JAMAIS le plan ici — seul un webhook
// vérifié le fait (voir _shared/activate-subscription.ts).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { stripeAdapter } from '../_shared/stripe.ts';
import { flutterwaveAdapter } from '../_shared/flutterwave.ts';
import { payunitAdapter } from '../_shared/payunit.ts';
import { paddleAdapter } from '../_shared/paddle.ts';
import type { PaymentProviderAdapter, SupportedProvider } from '../_shared/payment-provider.ts';

const adapters: Record<SupportedProvider, PaymentProviderAdapter> = {
  stripe: stripeAdapter,
  flutterwave: flutterwaveAdapter,
  payunit: payunitAdapter,
  paddle: paddleAdapter,
};

// Source of truth for pricing — never trust a price sent from the client.
const PLAN_PRICE_USD: Record<string, number> = {
  starter: 9,
  premium: 29,
  enterprise: 79,
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

    const body = await req.json();
    const { plan, provider, returnUrl } = body as {
      plan: 'starter' | 'premium' | 'enterprise'; provider: SupportedProvider; returnUrl: string;
    };

    if (!plan || !provider || !returnUrl) {
      return jsonResponse({ error: 'plan, provider et returnUrl sont requis' }, 400);
    }
    if (!PLAN_PRICE_USD[plan]) return jsonResponse({ error: `Plan non supporté: ${plan}` }, 400);
    if (!adapters[provider]) return jsonResponse({ error: `Provider non supporté: ${provider}` }, 400);

    const admin = getAdminClient();

    const { data: seller, error: sellerErr } = await admin
      .from('sellers')
      .select('id, plan')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (sellerErr || !seller) return jsonResponse({ error: 'Vendeur introuvable' }, 404);

    const amount = PLAN_PRICE_USD[plan];
    const internalReference = `SUB-${seller.id}-${Date.now()}`;
    const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-webhook-${provider}`;

    const result = await adapters[provider].createPayment({
      internalReference,
      amount,
      currency: 'USD',
      description: `Zando — abonnement ${plan}`,
      returnUrl,
      notifyUrl,
      metadata: { seller_id: seller.id, plan },
    });

    const { error: insertErr } = await admin.from('subscription_payments').insert({
      seller_id: seller.id,
      plan,
      provider,
      provider_reference: result.providerReference,
      internal_reference: internalReference,
      amount,
      currency_code: 'USD',
      status: 'pending',
    });
    if (insertErr) {
      return jsonResponse({ error: `Erreur enregistrement paiement: ${insertErr.message}` }, 500);
    }

    return jsonResponse({ redirectUrl: result.redirectUrl, internalReference });
  } catch (e) {
    console.error('subscription-create-payment error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
