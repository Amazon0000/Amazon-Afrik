// POST /functions/v1/vendor-checkout-webhook-paystack
// Paystack utilise la même clé secrète pour l'API et la signature webhook
// (x-paystack-signature = HMAC-SHA512(body, secret key)) — contrairement
// à Stripe/Paddle, on peut donc vérifier la signature ici en plus de la
// revérification serveur obligatoire.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { createPaystackAdapterWithKey, verifyPaystackWebhookSignature } from '../_shared/paystack.ts';
import { processVerifiedVendorPayment } from '../_shared/activate-vendor-payment.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const rawBody = await req.text();
    // deno-lint-ignore no-explicit-any
    let event: any;
    try { event = JSON.parse(rawBody); } catch { return jsonResponse({ error: 'Payload JSON invalide' }, 400); }

    const reference: string | undefined = event?.data?.reference;
    if (!reference) return jsonResponse({ received: true, ignored: 'no reference' });

    const admin = getAdminClient();
    const { data: payment } = await admin.from('vendor_psp_payments').select('id, credential_id').eq('internal_reference', reference).maybeSingle();
    if (!payment) return jsonResponse({ error: 'Paiement inconnu' }, 404);

    const { data: secretRow } = await admin.from('seller_psp_secrets').select('secret_key').eq('credential_id', payment.credential_id).maybeSingle();
    if (!secretRow?.secret_key) return jsonResponse({ error: 'Clé secrète introuvable' }, 500);

    const sigHeader = req.headers.get('x-paystack-signature');
    const validSig = await verifyPaystackWebhookSignature(rawBody, sigHeader, secretRow.secret_key);
    if (!validSig) {
      console.warn('Signature Paystack invalide — requête rejetée');
      return jsonResponse({ error: 'Signature invalide' }, 400);
    }

    const adapter = createPaystackAdapterWithKey(secretRow.secret_key);
    const verified = await adapter.verifyPayment(reference);
    const result = await processVerifiedVendorPayment({ internalReference: reference, provider: 'paystack', verified, rawWebhookPayload: event });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('vendor-checkout-webhook-paystack error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
