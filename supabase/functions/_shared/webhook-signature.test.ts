// Tests unitaires réels pour la vérification de signature des webhooks —
// c'est la ligne de défense qui empêche un attaquant d'appeler
// ads-webhook-stripe / ads-webhook-flutterwave avec un faux payload
// 'payment_status: paid' pour activer une campagne gratuitement
// (section 8 et 27 du cahier des charges : "ne jamais accepter
// payment_status = paid simplement parce que le frontend l'envoie").
//
// Exécution : cd supabase/functions/_shared && deno test webhook-signature.test.ts
import { strictEqual } from 'node:assert';
import { verifyStripeWebhookSignature } from './stripe.ts';
import { verifyFlutterwaveWebhookSignature } from './flutterwave.ts';
import { verifyPaystackWebhookSignature } from './paystack.ts';

// ============ Stripe ============

async function buildValidStripeHeader(payload: string, secret: string, timestamp: string): Promise<string> {
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const sig = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${sig}`;
}

Deno.test('verifyStripeWebhookSignature: signature valide construite avec le bon secret -> acceptée', async () => {
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_123' } } });
  const secret = 'whsec_test_secret';
  const header = await buildValidStripeHeader(payload, secret, '1700000000');
  const valid = await verifyStripeWebhookSignature(payload, header, secret);
  strictEqual(valid, true);
});

Deno.test('verifyStripeWebhookSignature: mauvais secret -> rejetée (empêche activation frauduleuse)', async () => {
  const payload = JSON.stringify({ type: 'checkout.session.completed' });
  const header = await buildValidStripeHeader(payload, 'whsec_correct', '1700000000');
  const valid = await verifyStripeWebhookSignature(payload, header, 'whsec_WRONG');
  strictEqual(valid, false);
});

Deno.test('verifyStripeWebhookSignature: payload modifié après signature -> rejetée (anti-falsification du montant/statut)', async () => {
  const originalPayload = JSON.stringify({ type: 'checkout.session.completed', amount: 999 });
  const secret = 'whsec_test_secret';
  const header = await buildValidStripeHeader(originalPayload, secret, '1700000000');
  // Un attaquant intercepte et modifie le payload (ex: change le montant)
  // mais réutilise l'en-tête de signature original.
  const tamperedPayload = JSON.stringify({ type: 'checkout.session.completed', amount: 1 });
  const valid = await verifyStripeWebhookSignature(tamperedPayload, header, secret);
  strictEqual(valid, false);
});

Deno.test('verifyStripeWebhookSignature: en-tête stripe-signature absent -> rejetée', async () => {
  const valid = await verifyStripeWebhookSignature('{}', null, 'whsec_test_secret');
  strictEqual(valid, false);
});

Deno.test('verifyStripeWebhookSignature: en-tête malformé (pas de v1=) -> rejetée', async () => {
  const valid = await verifyStripeWebhookSignature('{}', 't=1700000000', 'whsec_test_secret');
  strictEqual(valid, false);
});

// ============ Flutterwave ============

Deno.test('verifyFlutterwaveWebhookSignature: hash identique au secret configuré -> acceptée', () => {
  const valid = verifyFlutterwaveWebhookSignature('my-secret-hash-123', 'my-secret-hash-123');
  strictEqual(valid, true);
});

Deno.test('verifyFlutterwaveWebhookSignature: hash différent -> rejetée (empêche un faux notify_url)', () => {
  const valid = verifyFlutterwaveWebhookSignature('attacker-guess', 'my-secret-hash-123');
  strictEqual(valid, false);
});

Deno.test('verifyFlutterwaveWebhookSignature: en-tête verif-hash absent -> rejetée', () => {
  const valid = verifyFlutterwaveWebhookSignature(null, 'my-secret-hash-123');
  strictEqual(valid, false);
});

Deno.test('verifyFlutterwaveWebhookSignature: longueur différente -> rejetée sans planter (pas de throw sur comparaison de tailles différentes)', () => {
  const valid = verifyFlutterwaveWebhookSignature('short', 'a-much-longer-secret-hash-value');
  strictEqual(valid, false);
});

// ============ Paystack (checkout vendeur — nouveau) ============

async function buildValidPaystackSignature(payload: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secretKey), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.test('verifyPaystackWebhookSignature: signature valide construite avec la bonne clé secrète du vendeur -> acceptée', async () => {
  const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'VENDOR-abc-123' } });
  const secretKey = 'sk_test_vendor_secret_123';
  const sig = await buildValidPaystackSignature(payload, secretKey);
  const valid = await verifyPaystackWebhookSignature(payload, sig, secretKey);
  strictEqual(valid, true);
});

Deno.test("verifyPaystackWebhookSignature: signée avec la clé d'un AUTRE vendeur -> rejetée (empêche qu'un vendeur confirme le paiement d'un autre)", async () => {
  const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'VENDOR-abc-123' } });
  const sig = await buildValidPaystackSignature(payload, 'sk_test_attacker_own_key');
  const valid = await verifyPaystackWebhookSignature(payload, sig, 'sk_test_vendor_secret_123');
  strictEqual(valid, false);
});

Deno.test('verifyPaystackWebhookSignature: payload modifié après signature -> rejetée (anti-falsification du montant/statut)', async () => {
  const originalPayload = JSON.stringify({ event: 'charge.success', data: { reference: 'VENDOR-abc-123', amount: 5000 } });
  const secretKey = 'sk_test_vendor_secret_123';
  const sig = await buildValidPaystackSignature(originalPayload, secretKey);
  const tamperedPayload = JSON.stringify({ event: 'charge.success', data: { reference: 'VENDOR-abc-123', amount: 1 } });
  const valid = await verifyPaystackWebhookSignature(tamperedPayload, sig, secretKey);
  strictEqual(valid, false);
});

Deno.test('verifyPaystackWebhookSignature: en-tête x-paystack-signature absent -> rejetée', async () => {
  const valid = await verifyPaystackWebhookSignature('{}', null, 'sk_test_vendor_secret_123');
  strictEqual(valid, false);
});

Deno.test('verifyPaystackWebhookSignature: longueur différente -> rejetée sans planter', async () => {
  const valid = await verifyPaystackWebhookSignature('{}', 'short-sig', 'sk_test_vendor_secret_123');
  strictEqual(valid, false);
});

