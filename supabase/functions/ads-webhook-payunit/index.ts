// POST /functions/v1/ads-webhook-payunit (= notify_url PayUnit)
// PayUnit ne documente pas de signature HMAC pour son notify_url. Par
// conséquent on ne fait JAMAIS confiance au contenu de la notification :
// on l'utilise uniquement comme déclencheur pour aller ré-interroger
// GET /api/gateway/paymentstatus/{transactionID} côté serveur, qui est la
// seule source de vérité utilisée pour activer la campagne.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { payunitAdapter } from '../_shared/payunit.ts';
import { processVerifiedPayment } from '../_shared/activate-campaign.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide' }, 400);
  }

  // PayUnit renvoie le transaction_id (= notre internalReference, transmis
  // tel quel à l'initialisation) dans la notification.
  const transactionId = payload?.data?.transaction_id || payload?.transaction_id;
  if (!transactionId) {
    return jsonResponse({ error: 'transaction_id manquant dans la notification' }, 400);
  }

  try {
    // Seule source de vérité : l'appel serveur à paymentstatus, jamais le payload reçu.
    const verified = await payunitAdapter.verifyPayment(transactionId);
    const result = await processVerifiedPayment({
      internalReference: transactionId,
      provider: 'payunit',
      verified,
      rawWebhookPayload: payload,
    });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('ads-webhook-payunit processing error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
