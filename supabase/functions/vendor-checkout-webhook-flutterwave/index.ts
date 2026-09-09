// POST /functions/v1/vendor-checkout-webhook-flutterwave
// Même principe que le webhook Stripe vendeur : pas de secret webhook
// unique par vendeur stocké, sécurité assurée par la revérification
// serveur obligatoire via l'API Flutterwave avec la clé du vendeur.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { createFlutterwaveAdapterWithKey } from '../_shared/flutterwave.ts';
import { processVerifiedVendorPayment } from '../_shared/activate-vendor-payment.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    // deno-lint-ignore no-explicit-any
    let payload: any;
    try { payload = await req.json(); } catch { return jsonResponse({ error: 'Payload JSON invalide' }, 400); }

    const txRef: string | undefined = payload?.data?.tx_ref || payload?.txRef;
    const flwTransactionId = payload?.data?.id || payload?.id;
    if (!txRef || !flwTransactionId) return jsonResponse({ received: true, ignored: 'no reference' });

    const admin = getAdminClient();
    const { data: payment } = await admin.from('vendor_psp_payments').select('id, credential_id').eq('internal_reference', txRef).maybeSingle();
    if (!payment) return jsonResponse({ error: 'Paiement inconnu' }, 404);

    const { data: secretRow } = await admin.from('seller_psp_secrets').select('secret_key').eq('credential_id', payment.credential_id).maybeSingle();
    if (!secretRow?.secret_key) return jsonResponse({ error: 'Clé secrète introuvable' }, 500);

    const adapter = createFlutterwaveAdapterWithKey(secretRow.secret_key);
    const verified = await adapter.verifyPayment(String(flwTransactionId));
    const result = await processVerifiedVendorPayment({ internalReference: txRef, provider: 'flutterwave', verified, rawWebhookPayload: payload });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('vendor-checkout-webhook-flutterwave error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
