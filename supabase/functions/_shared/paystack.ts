// Adaptateur Paystack — API réelle (paystack.com/docs/api/) :
//  - POST https://api.paystack.co/transaction/initialize
//  - GET  https://api.paystack.co/transaction/verify/{reference}
//  - POST https://api.paystack.co/refund
// Webhook : header 'x-paystack-signature' = HMAC-SHA512(body, secret key)
// en hexadécimal, comparaison en temps constant.
//
// Paystack n'était pas dans le jeu de providers "plateforme centrale"
// (ads/abonnements) — ce fichier n'existe que pour le checkout vendeur,
// où chaque vendeur connecte sa propre clé secrète Paystack.
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderAdapter,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
} from './payment-provider.ts';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

export function createPaystackAdapterWithKey(secretKey: string): PaymentProviderAdapter {
  return {
    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const res = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Paystack exige un email — on utilise une adresse générique liée
          // à la référence si l'appelant n'en fournit pas dans metadata.
          email: input.metadata?.buyer_email || `buyer+${input.internalReference}@zando.checkout`,
          amount: Math.round(input.amount * 100), // kobo/cents
          currency: input.currency.toUpperCase(),
          reference: input.internalReference,
          callback_url: input.returnUrl,
          metadata: { internal_reference: input.internalReference, ...(input.metadata || {}) },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(`Paystack createPayment error: ${data?.message || res.statusText}`);
      return { providerReference: data.data.reference, redirectUrl: data.data.authorization_url };
    },

    async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
      const res = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${providerReference}`, {
        headers: { 'Authorization': `Bearer ${secretKey}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Paystack verifyPayment error: ${data?.message || res.statusText}`);
      const txStatus = data?.data?.status;
      let status: VerifyPaymentResult['status'] = 'pending';
      if (txStatus === 'success') status = 'paid';
      else if (txStatus === 'failed') status = 'failed';
      else if (txStatus === 'abandoned') status = 'cancelled';
      return {
        providerReference,
        status,
        amount: (data?.data?.amount ?? 0) / 100,
        currency: (data?.data?.currency ?? '').toUpperCase(),
      };
    },

    async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
      const body: Record<string, unknown> = { transaction: input.providerReference };
      if (input.amount) body.amount = Math.round(input.amount * 100);
      const res = await fetch(`${PAYSTACK_API_BASE}/refund`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.status) return { success: false, message: data?.message || res.statusText };
      return { success: true, refundReference: String(data?.data?.id ?? '') };
    },
  };
}

// Vérification de la signature webhook Paystack : HMAC-SHA512 du body brut
// avec la clé secrète du vendeur, comparaison en temps constant.
export async function verifyPaystackWebhookSignature(
  payload: string,
  sigHeader: string | null,
  secretKey: string
): Promise<boolean> {
  if (!sigHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (expectedSig.length !== sigHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ sigHeader.charCodeAt(i);
  }
  return mismatch === 0;
}
