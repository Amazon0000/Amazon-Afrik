// Adaptateur PayUnit — basé sur la documentation officielle réelle
// (developer.payunit.net/rest-api/*), vérifiée le 26/08/2026 :
//  - BASE_URL: https://gateway.payunit.net
//  - POST {BASE_URL}/api/gateway/initialize
//  - GET  {BASE_URL}/api/gateway/paymentstatus/{transactionID}
// Auth: Basic Auth (api_user:api_password en base64) + header x-api-key
// (token d'application) + header mode: live|test.
//
// IMPORTANT : PayUnit ne documente pas de vérification de webhook par
// signature HMAC comme Stripe. Le `notify_url` envoie une notification, mais
// la doc recommande de toujours re-vérifier via GET paymentstatus côté
// serveur avant d'accorder quoi que ce soit — c'est ce que fait webhook-payunit
// (voir index.ts de cette fonction). Ne JAMAIS faire confiance au payload du
// notify_url seul.
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderAdapter,
  RefundPaymentResult,
  VerifyPaymentResult,
} from './payment-provider.ts';

const PAYUNIT_BASE = 'https://gateway.payunit.net';

function payunitAuthHeaders(): Record<string, string> {
  const apiUser = Deno.env.get('PAYUNIT_API_USER');
  const apiPassword = Deno.env.get('PAYUNIT_API_PASSWORD');
  const apiKey = Deno.env.get('PAYUNIT_API_KEY'); // x-api-key
  const mode = Deno.env.get('PAYUNIT_MODE') || 'test';
  if (!apiUser || !apiPassword || !apiKey) {
    throw new Error('PAYUNIT_API_USER / PAYUNIT_API_PASSWORD / PAYUNIT_API_KEY manquants dans les secrets Edge Function');
  }
  const basic = btoa(`${apiUser}:${apiPassword}`);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basic}`,
    'x-api-key': apiKey,
    'mode': mode,
  };
}

export const payunitAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const res = await fetch(`${PAYUNIT_BASE}/api/gateway/initialize`, {
      method: 'POST',
      headers: payunitAuthHeaders(),
      body: JSON.stringify({
        total_amount: input.amount,
        currency: input.currency, // ex: 'XAF'
        transaction_id: input.internalReference,
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'SUCCESS') {
      throw new Error(`PayUnit createPayment error: ${data?.message || res.statusText}`);
    }
    return {
      providerReference: data.data.transaction_id,
      redirectUrl: data.data.transaction_url,
    };
  },

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    const res = await fetch(`${PAYUNIT_BASE}/api/gateway/paymentstatus/${providerReference}`, {
      headers: payunitAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`PayUnit verifyPayment error: ${data?.message || res.statusText}`);
    }
    const txStatus = data?.data?.transaction_status;
    let status: VerifyPaymentResult['status'] = 'pending';
    if (txStatus === 'SUCCESS') status = 'paid';
    else if (txStatus === 'FAILED') status = 'failed';
    else if (txStatus === 'CANCELLED') status = 'cancelled';
    return {
      providerReference,
      status,
      amount: Number(data?.data?.transaction_amount ?? 0),
      currency: data?.data?.transaction_currency ?? '',
    };
  },

  async refundPayment(): Promise<RefundPaymentResult> {
    // La documentation publique PayUnit ne décrit pas d'endpoint de
    // remboursement automatisé au moment de cette implémentation.
    // On ne fabrique pas un faux endpoint : le remboursement PayUnit doit
    // être traité manuellement (support PayUnit) et enregistré ensuite via
    // le statut 'refunded' côté admin. À réévaluer si PayUnit publie un
    // endpoint dédié.
    return {
      success: false,
      message: 'Remboursement PayUnit non automatisable via API publique — traitement manuel requis (contacter support PayUnit), puis marquer refunded côté admin.',
    };
  },
};
