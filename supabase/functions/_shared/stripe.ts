// Adaptateur Stripe — utilise l'API Checkout Sessions (hosted page), la plus
// simple à sécuriser côté serveur : Stripe reste la source de vérité, et la
// vérification de webhook utilise la signature officielle Stripe.
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderAdapter,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
} from './payment-provider.ts';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function stripeSecretKey(): string {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY manquant dans les secrets Edge Function');
  return key;
}

function toFormBody(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export const stripeAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const params: Record<string, string> = {
      'mode': 'payment',
      'success_url': `${input.returnUrl}?session_id={CHECKOUT_SESSION_ID}&ref=${input.internalReference}`,
      'cancel_url': `${input.returnUrl}?cancelled=1&ref=${input.internalReference}`,
      'client_reference_id': input.internalReference,
      'line_items[0][price_data][currency]': input.currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': input.description,
      'line_items[0][price_data][unit_amount]': String(Math.round(input.amount * 100)),
      'line_items[0][quantity]': '1',
      // idempotence Stripe native (empêche la double création de session pour la même ref)
    };
    if (input.metadata) {
      for (const [k, v] of Object.entries(input.metadata)) {
        params[`metadata[${k}]`] = v;
      }
    }
    params['metadata[internal_reference]'] = input.internalReference;

    const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': input.internalReference,
      },
      body: toFormBody(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Stripe createPayment error: ${data?.error?.message || res.statusText}`);
    }
    return { providerReference: data.id, redirectUrl: data.url };
  },

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${providerReference}`, {
      headers: { 'Authorization': `Bearer ${stripeSecretKey()}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Stripe verifyPayment error: ${data?.error?.message || res.statusText}`);
    }
    let status: VerifyPaymentResult['status'] = 'pending';
    if (data.payment_status === 'paid') status = 'paid';
    else if (data.status === 'expired') status = 'cancelled';
    return {
      providerReference,
      status,
      amount: (data.amount_total ?? 0) / 100,
      currency: (data.currency ?? '').toUpperCase(),
    };
  },

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    // providerReference ici est le payment_intent (récupéré via la session lors du webhook)
    const params: Record<string, string> = { payment_intent: input.providerReference };
    if (input.amount) params.amount = String(Math.round(input.amount * 100));

    const res = await fetch(`${STRIPE_API_BASE}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: toFormBody(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data?.error?.message || res.statusText };
    }
    return { success: true, refundReference: data.id };
  },
};

// Vérification de la signature du webhook Stripe (implémentation manuelle
// HMAC-SHA256, sans dépendre du SDK Node de Stripe qui n'est pas compatible Deno).
export async function verifyStripeWebhookSignature(
  payload: string,
  sigHeader: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Comparaison en temps constant
  if (expectedSig.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
