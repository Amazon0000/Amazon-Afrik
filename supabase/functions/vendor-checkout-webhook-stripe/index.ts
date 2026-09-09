// POST /functions/v1/vendor-checkout-webhook-stripe
// Chaque vendeur a son propre compte Stripe — il n'y a pas de secret de
// signature webhook unique à vérifier ici (contrairement au webhook
// plateforme). La sécurité vient de la revérification serveur obligatoire
// via l'API Stripe du vendeur, en utilisant sa clé secrète stockée
// (jamais du payload du webhook seul — même philosophie que PayUnit,
// déjà documentée dans ce code base).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { createStripeAdapterWithKey } from '../_shared/stripe.ts';
import { processVerifiedVendorPayment } from '../_shared/activate-vendor-payment.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const rawBody = await req.text();
    // deno-lint-ignore no-explicit-any
    let event: any;
    try { event = JSON.parse(rawBody); } catch { return jsonResponse({ error: 'Payload JSON invalide' }, 400); }

    const session = event.data?.object;
    const internalReference: string | undefined = session?.client_reference_id || session?.metadata?.internal_reference;
    const sessionId: string | undefined = session?.id;
    if (!internalReference || !sessionId) return jsonResponse({ received: true, ignored: 'no reference' });

    const admin = getAdminClient();
    const { data: payment } = await admin.from('vendor_psp_payments').select('id, seller_id, credential_id').eq('internal_reference', internalReference).maybeSingle();
    if (!payment) return jsonResponse({ error: 'Paiement inconnu' }, 404);

    const { data: secretRow } = await admin.from('seller_psp_secrets').select('secret_key').eq('credential_id', payment.credential_id).maybeSingle();
    if (!secretRow?.secret_key) return jsonResponse({ error: 'Clé secrète introuvable' }, 500);

    const adapter = createStripeAdapterWithKey(secretRow.secret_key);
    const verified = await adapter.verifyPayment(sessionId);
    const result = await processVerifiedVendorPayment({ internalReference, provider: 'stripe', verified, rawWebhookPayload: event });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('vendor-checkout-webhook-stripe error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
