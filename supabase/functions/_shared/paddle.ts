// Adaptateur Paddle (Billing v2) — utilise l'API Transactions avec un
// "ad-hoc price" (prix inline, sans produit pré-créé dans le dashboard
// Paddle) pour rester cohérent avec les autres adaptateurs : un montant et
// une devise dynamiques par campagne, sans configuration préalable requise.
// Paddle génère une checkout_url hébergée vers laquelle on redirige, exactement
// comme Stripe Checkout — même contrat que les autres providers.
//
// Nécessite le secret PADDLE_API_KEY (clé API serveur, distincte du "client-side
// token" utilisé côté frontend par Paddle.js) dans les secrets de l'Edge
// Function — à ajouter dans le dashboard Supabase, exactement comme
// STRIPE_SECRET_KEY. Le client-side token fourni par l'équipe
// (live_9743c25ef8324a998b966c0bc8d) est utilisé côté navigateur uniquement
// (voir src/pages/AdsPage.tsx) — il ne peut jamais authentifier ces appels
// serveur, Paddle exige une clé API distincte pour l'API Transactions.
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderAdapter,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
} from './payment-provider.ts';

const PADDLE_API_BASE = 'https://api.paddle.com';

function paddleApiKey(): string {
  const key = Deno.env.get('PADDLE_API_KEY');
  if (!key) throw new Error('PADDLE_API_KEY manquant dans les secrets Edge Function');
  return key;
}

export const paddleAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          quantity: 1,
          price: {
            description: input.description,
            name: input.description,
            billing_cycle: null,
            trial_period: null,
            tax_mode: 'account_setting',
            unit_price: {
              amount: String(Math.round(input.amount * 100)),
              currency_code: input.currency.toUpperCase(),
            },
          },
        }],
        collection_mode: 'automatic',
        checkout: { url: input.returnUrl },
        custom_data: { internal_reference: input.internalReference, ...(input.metadata || {}) },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Paddle createPayment error: ${data?.error?.detail || res.statusText}`);
    }
    const txId = data?.data?.id;
    const checkoutUrl = data?.data?.checkout?.url;
    if (!txId || !checkoutUrl) {
      throw new Error('Paddle createPayment: réponse inattendue (transaction id / checkout url manquants)');
    }
    return { providerReference: txId, redirectUrl: checkoutUrl };
  },

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    const res = await fetch(`${PADDLE_API_BASE}/transactions/${providerReference}`, {
      headers: { 'Authorization': `Bearer ${paddleApiKey()}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Paddle verifyPayment error: ${data?.error?.detail || res.statusText}`);
    }
    const tx = data.data;
    let status: VerifyPaymentResult['status'] = 'pending';
    if (tx.status === 'completed' || tx.status === 'paid') status = 'paid';
    else if (tx.status === 'canceled') status = 'cancelled';
    else if (tx.status === 'past_due') status = 'failed';
    const totals = tx.details?.totals;
    return {
      providerReference,
      status,
      amount: totals ? Number(totals.total) / 100 : 0,
      currency: tx.currency_code || '',
    };
  },

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const res = await fetch(`${PADDLE_API_BASE}/adjustments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'refund',
        transaction_id: input.providerReference,
        reason: 'Zando ad campaign cancelled/refunded',
        items: input.amount
          ? undefined
          : [{ type: 'full', item_id: undefined }],
        ...(input.amount ? { items: undefined } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data?.error?.detail || res.statusText };
    }
    return { success: true, refundReference: data?.data?.id };
  },
};

// Vérification de la signature webhook Paddle : HMAC-SHA256 du body brut,
// clé = notification secret Paddle (distinct de la clé API), comparaison en
// temps constant. Format d'en-tête Paddle-Signature: "ts=...;h1=...".
export async function verifyPaddleWebhookSignature(
  payload: string,
  sigHeader: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(';').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts['ts'];
  const signature = parts['h1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}:${payload}`;
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

  if (expectedSig.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
