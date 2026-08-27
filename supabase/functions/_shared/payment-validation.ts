// Fonctions pures (aucune dépendance réseau/Supabase) extraites de
// activate-campaign.ts pour être réellement testables unitairement
// (voir activate-campaign.test.ts). Toute modification de la logique
// métier de validation montant/devise ou de décision d'idempotence doit
// passer par ici, pas être dupliquée ailleurs.

export interface PaymentMatchInput {
  expectedAmount: number;
  expectedCurrency: string; // déjà normalisée ou non, normalisée en interne
  receivedAmount: number;
  receivedCurrency: string; // idem
}

export interface PaymentMatchResult {
  amountMatches: boolean;
  currencyMatches: boolean;
  isValid: boolean;
}

// Certains providers (Flutterwave/PayUnit selon le point d'appel) ne
// renvoient pas toujours le montant exact lors d'un premier verify —
// receivedAmount === 0 est donc traité comme "non concluant" plutôt que
// comme un échec (mais ne s'applique QUE si le montant est explicitement
// absent, jamais utilisé pour contourner un vrai montant erroné).
export function validatePaymentMatch(input: PaymentMatchInput): PaymentMatchResult {
  const expectedCurrency = input.expectedCurrency.toUpperCase();
  const receivedCurrency = input.receivedCurrency ? input.receivedCurrency.toUpperCase() : '';

  const amountMatches = Math.abs(input.receivedAmount - input.expectedAmount) < 0.01 || input.receivedAmount === 0;
  const currencyMatches = !receivedCurrency || receivedCurrency === expectedCurrency;

  return { amountMatches, currencyMatches, isValid: amountMatches && currencyMatches };
}

export type PaymentRecordStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export type IdempotentAction =
  | { type: 'already_paid' }
  | { type: 'terminal_ignored'; status: PaymentRecordStatus }
  | { type: 'proceed' };

// Décide quoi faire face à l'état ACTUEL en base (payment.status) avant
// même d'appeler le provider ou de toucher à quoi que ce soit — c'est la
// première ligne de défense anti-double-traitement pour un webhook
// dupliqué ou reçu en concurrence.
export function resolveIdempotentAction(currentStatus: PaymentRecordStatus): IdempotentAction {
  if (currentStatus === 'paid') return { type: 'already_paid' };
  if (currentStatus === 'refunded' || currentStatus === 'cancelled') {
    return { type: 'terminal_ignored', status: currentStatus };
  }
  return { type: 'proceed' };
}

// Calcule expires_at à partir de starts_at + durée du plan en jours —
// utilisé à l'activation. Fonction pure pour pouvoir vérifier facilement
// des cas limites (durée 0, durée négative accidentelle, etc.).
export function computeExpiryDate(startsAt: Date, durationDays: number): Date {
  const safeDuration = Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 7;
  return new Date(startsAt.getTime() + safeDuration * 24 * 60 * 60 * 1000);
}
