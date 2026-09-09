// POST /functions/v1/vendor-checkout-webhook-payunit
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { createPayunitAdapterWithKey } from '../_shared/payunit.ts';
import { processVerifiedVendorPayment } from '../_shared/activate-vendor-payment.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    // deno-lint-ignore no-explicit-any
    let payload: any;
    try { payload = await req.json(); } catch { return jsonResponse({ error: 'Payload JSON invalide' }, 400); }

    const transactionId: string | undefined = payload?.data?.transaction_id || payload?.transaction_id;
    if (!transactionId) return jsonResponse({ received: true, ignored: 'no reference' });

    const admin = getAdminClient();
    const { data: payment } = await admin.from('vendor_psp_payments').select('id, credential_id').eq('internal_reference', transactionId).maybeSingle();
    if (!payment) return jsonResponse({ error: 'Paiement inconnu' }, 404);

    const { data: credential } = await admin.from('seller_psp_credentials').select('merchant_id, public_key, mode').eq('id', payment.credential_id).maybeSingle();
    const { data: secretRow } = await admin.from('seller_psp_secrets').select('secret_key').eq('credential_id', payment.credential_id).maybeSingle();
    if (!secretRow?.secret_key || !credential?.merchant_id || !credential?.public_key) {
      return jsonResponse({ error: 'Identifiants PayUnit incomplets' }, 500);
    }

    const adapter = createPayunitAdapterWithKey(credential.merchant_id, secretRow.secret_key, credential.public_key, credential.mode as 'test' | 'live');
    const verified = await adapter.verifyPayment(transactionId);
    const result = await processVerifiedVendorPayment({ internalReference: transactionId, provider: 'payunit', verified, rawWebhookPayload: payload });
    return jsonResponse({ received: true, result });
  } catch (e) {
    console.error('vendor-checkout-webhook-payunit error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
