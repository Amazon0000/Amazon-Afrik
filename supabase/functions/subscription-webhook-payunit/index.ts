// POST /functions/v1/subscription-webhook-payunit (= notify_url PayUnit)
// Miroir de ads-webhook-payunit. Le payload n'est jamais utilisé comme
// source de vérité — seul le GET paymentstatus côté serveur l'est.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { payunitAdapter } from '../_shared/payunit.ts';
import { processVerifiedSubscriptionPayment } from '../_shared/activate-subscription.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide' }, 400);
  }

  const transactionId = payload?.data?.transaction_id || payload?.transaction_id;
  if (!transactionId) {
    return jsonResponse({ error: 'transaction_id manquant dans la notification' }, 400);
  }

  try {
    const verified = await payunitAdapter.verifyPayment(transactionId);
    const result = await processVerifiedSubscriptionPayment({
      internalReference: transactionId,
      provider: 'payunit',
      verified,
      rawWebhookPayload: payload,
    });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('subscription-webhook-payunit processing error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
