// POST /functions/v1/subscription-webhook-flutterwave
// Miroir de ads-webhook-flutterwave.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { flutterwaveAdapter, verifyFlutterwaveWebhookSignature } from '../_shared/flutterwave.ts';
import { processVerifiedSubscriptionPayment } from '../_shared/activate-subscription.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const secretHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_SECRET_HASH');
  if (!secretHash) {
    console.error('FLUTTERWAVE_WEBHOOK_SECRET_HASH manquant');
    return jsonResponse({ error: 'Webhook non configuré' }, 500);
  }

  const receivedHash = req.headers.get('verif-hash');
  if (!verifyFlutterwaveWebhookSignature(receivedHash, secretHash)) {
    console.warn('verif-hash Flutterwave invalide — requête rejetée');
    return jsonResponse({ error: 'Signature invalide' }, 400);
  }

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide' }, 400);
  }

  const txRef = payload?.data?.tx_ref || payload?.txRef;
  const flwTransactionId = payload?.data?.id || payload?.id;
  const internalReference = txRef;

  if (!internalReference || !flwTransactionId) {
    return jsonResponse({ error: 'tx_ref ou id manquant dans le webhook' }, 400);
  }

  try {
    const verified = await flutterwaveAdapter.verifyPayment(String(flwTransactionId));
    const result = await processVerifiedSubscriptionPayment({
      internalReference,
      provider: 'flutterwave',
      verified,
      rawWebhookPayload: payload,
    });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('subscription-webhook-flutterwave processing error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
