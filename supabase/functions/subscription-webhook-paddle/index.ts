// POST /functions/v1/subscription-webhook-paddle
// Miroir de ads-webhook-paddle.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { paddleAdapter, verifyPaddleWebhookSignature } from '../_shared/paddle.ts';
import { processVerifiedSubscriptionPayment } from '../_shared/activate-subscription.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const webhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET manquant');
    return jsonResponse({ error: 'Webhook non configuré' }, 500);
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get('paddle-signature');

  const validSig = await verifyPaddleWebhookSignature(rawBody, sigHeader, webhookSecret);
  if (!validSig) {
    console.warn('Signature Paddle invalide — requête rejetée');
    return jsonResponse({ error: 'Signature invalide' }, 400);
  }

  // deno-lint-ignore no-explicit-any
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide' }, 400);
  }

  if (event.event_type !== 'transaction.completed' && event.event_type !== 'transaction.paid') {
    return jsonResponse({ received: true, ignored: event.event_type });
  }

  const tx = event.data;
  const internalReference = tx?.custom_data?.internal_reference;
  const providerReference = tx?.id;

  if (!internalReference || !providerReference) {
    return jsonResponse({ error: 'Référence interne manquante dans le webhook' }, 400);
  }

  try {
    const verified = await paddleAdapter.verifyPayment(providerReference);
    const result = await processVerifiedSubscriptionPayment({
      internalReference,
      provider: 'paddle',
      verified,
      rawWebhookPayload: event,
    });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('subscription-webhook-paddle processing error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
