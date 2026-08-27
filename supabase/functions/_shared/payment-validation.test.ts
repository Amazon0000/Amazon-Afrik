// Tests unitaires réels pour la logique métier critique du module
// Advertising, exécutés avec `deno test` (voir section 27 du cahier des
// charges). Ces tests couvrent les propriétés pures (aucun réseau, aucune
// dépendance Supabase) : idempotence, validation montant/devise, calcul
// d'expiration.
//
// Exécution : cd supabase/functions/_shared && deno test payment-validation.test.ts
import { strictEqual, deepStrictEqual } from 'node:assert';
import { validatePaymentMatch, resolveIdempotentAction, computeExpiryDate } from './payment-validation.ts';

// ============ validatePaymentMatch ============

Deno.test('validatePaymentMatch: montant et devise identiques -> valide', () => {
  const result = validatePaymentMatch({
    expectedAmount: 29.99, expectedCurrency: 'USD',
    receivedAmount: 29.99, receivedCurrency: 'USD',
  });
  strictEqual(result.isValid, true);
  strictEqual(result.amountMatches, true);
  strictEqual(result.currencyMatches, true);
});

Deno.test('validatePaymentMatch: devise différente -> invalide (paiement frauduleux/mal configuré rejeté)', () => {
  const result = validatePaymentMatch({
    expectedAmount: 29.99, expectedCurrency: 'USD',
    receivedAmount: 29.99, receivedCurrency: 'XOF',
  });
  strictEqual(result.isValid, false);
  strictEqual(result.currencyMatches, false);
});

Deno.test('validatePaymentMatch: montant inférieur au prix attendu -> invalide (mauvaise somme, section 27)', () => {
  const result = validatePaymentMatch({
    expectedAmount: 29.99, expectedCurrency: 'USD',
    receivedAmount: 1.00, receivedCurrency: 'USD',
  });
  strictEqual(result.isValid, false);
  strictEqual(result.amountMatches, false);
});

Deno.test('validatePaymentMatch: montant supérieur au prix attendu -> invalide', () => {
  const result = validatePaymentMatch({
    expectedAmount: 29.99, expectedCurrency: 'USD',
    receivedAmount: 999.00, receivedCurrency: 'USD',
  });
  strictEqual(result.isValid, false);
});

Deno.test('validatePaymentMatch: casse de devise différente (usd vs USD) -> valide', () => {
  const result = validatePaymentMatch({
    expectedAmount: 9.99, expectedCurrency: 'usd',
    receivedAmount: 9.99, receivedCurrency: 'USD',
  });
  strictEqual(result.isValid, true);
});

Deno.test('validatePaymentMatch: montant reçu à 0 (provider ne le renvoie pas encore) -> non bloquant sur le montant', () => {
  const result = validatePaymentMatch({
    expectedAmount: 17.99, expectedCurrency: 'USD',
    receivedAmount: 0, receivedCurrency: 'USD',
  });
  strictEqual(result.amountMatches, true);
});

Deno.test('validatePaymentMatch: devise reçue vide (non fournie par le provider) -> non bloquant sur la devise', () => {
  const result = validatePaymentMatch({
    expectedAmount: 17.99, expectedCurrency: 'USD',
    receivedAmount: 17.99, receivedCurrency: '',
  });
  strictEqual(result.currencyMatches, true);
});

Deno.test('validatePaymentMatch: petite différence flottante (0.001) -> tolérée', () => {
  const result = validatePaymentMatch({
    expectedAmount: 29.99, expectedCurrency: 'USD',
    receivedAmount: 29.991, receivedCurrency: 'USD',
  });
  strictEqual(result.amountMatches, true);
});

// ============ resolveIdempotentAction (webhook dupliqué, section 27) ============

Deno.test('resolveIdempotentAction: paiement pending -> proceed (premier traitement)', () => {
  deepStrictEqual(resolveIdempotentAction('pending'), { type: 'proceed' });
});

Deno.test('resolveIdempotentAction: paiement déjà paid -> already_paid (anti double-activation)', () => {
  deepStrictEqual(resolveIdempotentAction('paid'), { type: 'already_paid' });
});

Deno.test('resolveIdempotentAction: paiement refunded -> terminal_ignored (anti double-remboursement)', () => {
  deepStrictEqual(resolveIdempotentAction('refunded'), { type: 'terminal_ignored', status: 'refunded' });
});

Deno.test('resolveIdempotentAction: paiement cancelled -> terminal_ignored', () => {
  deepStrictEqual(resolveIdempotentAction('cancelled'), { type: 'terminal_ignored', status: 'cancelled' });
});

Deno.test('resolveIdempotentAction: webhook dupliqué 3 fois de suite sur un paiement pending -> une seule activation attendue', () => {
  // Simule 3 webhooks reçus pour le même paiement : seul le premier doit
  // "proceed", après quoi l'état passe à 'paid' et les suivants doivent
  // être bloqués par already_paid.
  let simulatedStatus: 'pending' | 'paid' = 'pending';
  const outcomes: string[] = [];

  for (let i = 0; i < 3; i++) {
    const action = resolveIdempotentAction(simulatedStatus);
    outcomes.push(action.type);
    if (action.type === 'proceed') {
      simulatedStatus = 'paid'; // activation réelle après le 1er traitement
    }
  }

  strictEqual(JSON.stringify(outcomes), JSON.stringify(['proceed', 'already_paid', 'already_paid']));
});

// ============ computeExpiryDate ============

Deno.test('computeExpiryDate: durée de 7 jours -> +7 jours exactement', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const expiry = computeExpiryDate(start, 7);
  strictEqual(expiry.toISOString(), '2026-01-08T00:00:00.000Z');
});

Deno.test('computeExpiryDate: durée 0 ou négative accidentelle -> repli sûr sur 7 jours (jamais une campagne infinie ou déjà expirée)', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  strictEqual(computeExpiryDate(start, 0).toISOString(), '2026-01-08T00:00:00.000Z');
  strictEqual(computeExpiryDate(start, -5).toISOString(), '2026-01-08T00:00:00.000Z');
});

Deno.test('computeExpiryDate: durée 30 jours (plan Boost 30 jours)', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const expiry = computeExpiryDate(start, 30);
  strictEqual(expiry.toISOString(), '2026-01-31T00:00:00.000Z');
});
