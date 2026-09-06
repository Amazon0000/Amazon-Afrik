// POST /functions/v1/ads-webhook-paddle
// Reçoit les événements Paddle. Vérifie la signature HMAC (source de vérité :
// le backend, jamais le frontend), puis relance verifyPayment() côté serveur
// avant d'activer quoi que ce soit — même contrat que les autres webhooks.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { paddleAdapter, verifyPaddleWebhookSignature } from '../_shared/paddle.ts';
import { processVerifiedPayment } from '../_shared/activate-campaign.ts';

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

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide' }, 400);
  }

  // On ne traite que les événements pertinents pour l'activation.
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
    // Re-vérification serveur réelle (ne jamais faire confiance au seul
    // contenu de l'event webhook, même signé, pour le montant final).
    const verified = await paddleAdapter.verifyPayment(providerReference);
    const result = await processVerifiedPayment({
      internalReference,
      provider: 'paddle',
      verified,
      rawWebhookPayload: event,
    });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('ads-webhook-paddle processing error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
