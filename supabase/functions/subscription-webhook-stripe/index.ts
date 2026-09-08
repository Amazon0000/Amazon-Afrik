// POST /functions/v1/subscription-webhook-stripe
// Miroir de ads-webhook-stripe : vérifie la signature, revérifie le
// paiement côté serveur, puis délègue l'activation à
// processVerifiedSubscriptionPayment (jamais d'activation directe ici).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { stripeAdapter, verifyStripeWebhookSignature } from '../_shared/stripe.ts';
import { processVerifiedSubscriptionPayment } from '../_shared/activate-subscription.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET manquant');
    return jsonResponse({ error: 'Webhook non configuré' }, 500);
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get('stripe-signature');

  const validSig = await verifyStripeWebhookSignature(rawBody, sigHeader, webhookSecret);
  if (!validSig) {
    console.warn('Signature Stripe invalide — requête rejetée');
    return jsonResponse({ error: 'Signature invalide' }, 400);
  }

  // deno-lint-ignore no-explicit-any
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide' }, 400);
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return jsonResponse({ received: true, ignored: event.type });
  }

  const session = event.data?.object;
  const internalReference = session?.client_reference_id || session?.metadata?.internal_reference;
  const sessionId = session?.id;

  if (!internalReference || !sessionId) {
    return jsonResponse({ error: 'Référence interne manquante dans le webhook' }, 400);
  }

  try {
    const verified = await stripeAdapter.verifyPayment(sessionId);
    const result = await processVerifiedSubscriptionPayment({
      internalReference,
      provider: 'stripe',
      verified,
      rawWebhookPayload: event,
    });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('subscription-webhook-stripe processing error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
