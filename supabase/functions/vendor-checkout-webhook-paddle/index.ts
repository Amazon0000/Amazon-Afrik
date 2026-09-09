// POST /functions/v1/vendor-checkout-webhook-paddle
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { createPaddleAdapterWithKey } from '../_shared/paddle.ts';
import { processVerifiedVendorPayment } from '../_shared/activate-vendor-payment.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const rawBody = await req.text();
    // deno-lint-ignore no-explicit-any
    let event: any;
    try { event = JSON.parse(rawBody); } catch { return jsonResponse({ error: 'Payload JSON invalide' }, 400); }

    const tx = event.data;
    const internalReference: string | undefined = tx?.custom_data?.internal_reference;
    const providerReference: string | undefined = tx?.id;
    if (!internalReference || !providerReference) return jsonResponse({ received: true, ignored: 'no reference' });

    const admin = getAdminClient();
    const { data: payment } = await admin.from('vendor_psp_payments').select('id, credential_id').eq('internal_reference', internalReference).maybeSingle();
    if (!payment) return jsonResponse({ error: 'Paiement inconnu' }, 404);

    const { data: secretRow } = await admin.from('seller_psp_secrets').select('secret_key').eq('credential_id', payment.credential_id).maybeSingle();
    if (!secretRow?.secret_key) return jsonResponse({ error: 'Clé secrète introuvable' }, 500);

    const adapter = createPaddleAdapterWithKey(secretRow.secret_key);
    const verified = await adapter.verifyPayment(providerReference);
    const result = await processVerifiedVendorPayment({ internalReference, provider: 'paddle', verified, rawWebhookPayload: event });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('vendor-checkout-webhook-paddle error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
