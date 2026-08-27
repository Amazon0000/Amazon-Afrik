// Adaptateur Flutterwave v3 Standard Checkout.
// Endpoints réels (developer.flutterwave.com/v3.0/docs) :
//  - POST https://api.flutterwave.com/v3/payments
//  - GET  https://api.flutterwave.com/v3/transactions/{id}/verify
// Webhook : header 'verif-hash' comparé au secret hash configuré côté
// dashboard Flutterwave (PAS de HMAC calculé, comparaison directe du secret).
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderAdapter,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
} from './payment-provider.ts';

const FLW_API_BASE = 'https://api.flutterwave.com/v3';

function flwSecretKey(): string {
  const key = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY manquant dans les secrets Edge Function');
  return key;
}

export const flutterwaveAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const res = await fetch(`${FLW_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: input.internalReference,
        amount: input.amount,
        currency: input.currency,
        redirect_url: input.returnUrl,
        customizations: { title: 'Zando Ads', description: input.description },
        meta: { internal_reference: input.internalReference, ...input.metadata },
      }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      throw new Error(`Flutterwave createPayment error: ${data?.message || res.statusText}`);
    }
    // Flutterwave ne donne le transaction id numérique qu'au webhook/verify ;
    // on utilise notre tx_ref (internalReference) comme référence provisoire
    // jusqu'à réception du vrai id via le webhook.
    return { providerReference: input.internalReference, redirectUrl: data.data.link };
  },

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    // providerReference doit être l'ID numérique Flutterwave (reçu dans le
    // payload du webhook sous `data.id`), pas le tx_ref, conformément à la doc.
    const res = await fetch(`${FLW_API_BASE}/transactions/${providerReference}/verify`, {
      headers: { 'Authorization': `Bearer ${flwSecretKey()}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Flutterwave verifyPayment error: ${data?.message || res.statusText}`);
    }
    const txStatus = data?.data?.status;
    let status: VerifyPaymentResult['status'] = 'pending';
    if (txStatus === 'successful') status = 'paid';
    else if (txStatus === 'failed') status = 'failed';
    else if (txStatus === 'cancelled') status = 'cancelled';
    return {
      providerReference,
      status,
      amount: data?.data?.amount ?? 0,
      currency: data?.data?.currency ?? '',
    };
  },

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const body: Record<string, unknown> = {};
    if (input.amount) body.amount = input.amount;
    const res = await fetch(`${FLW_API_BASE}/transactions/${input.providerReference}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      return { success: false, message: data?.message || res.statusText };
    }
    return { success: true, refundReference: String(data?.data?.id ?? '') };
  },
};

// Vérification du webhook Flutterwave : comparaison directe du header
// 'verif-hash' avec le secret hash configuré dans le dashboard Flutterwave
// (Settings > Webhooks). Ce n'est PAS un HMAC calculé sur le payload —
// c'est le mécanisme officiel documenté par Flutterwave.
export function verifyFlutterwaveWebhookSignature(
  receivedHash: string | null,
  expectedSecretHash: string
): boolean {
  if (!receivedHash) return false;
  if (receivedHash.length !== expectedSecretHash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < receivedHash.length; i++) {
    mismatch |= receivedHash.charCodeAt(i) ^ expectedSecretHash.charCodeAt(i);
  }
  return mismatch === 0;
}
