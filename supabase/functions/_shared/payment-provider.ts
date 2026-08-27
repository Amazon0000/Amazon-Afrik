// Couche d'abstraction commune aux 3 fournisseurs de paiement publicitaire.
// Toute la logique spécifique à un provider reste dans son propre fichier
// (stripe.ts, flutterwave.ts, payunit.ts). Rien ici ne doit contenir de
// logique métier propre à un provider.

export type SupportedProvider = 'stripe' | 'flutterwave' | 'payunit';

export interface CreatePaymentInput {
  internalReference: string; // référence unique générée par nous (idempotency key)
  amount: number; // montant dans l'unité "normale" (pas en cents)
  currency: string; // ISO 4217, ex: 'USD', 'XOF', 'XAF'
  description: string;
  returnUrl: string; // où rediriger le vendeur après paiement
  notifyUrl: string; // URL du webhook de ce provider
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  providerReference: string; // ID de transaction chez le provider
  redirectUrl: string; // URL vers laquelle rediriger le vendeur pour payer
}

export interface VerifyPaymentResult {
  providerReference: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
}

export interface RefundPaymentInput {
  providerReference: string;
  amount?: number; // remboursement partiel si fourni, sinon total
}

export interface RefundPaymentResult {
  success: boolean;
  refundReference?: string;
  message?: string;
}

export interface PaymentProviderAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(providerReference: string): Promise<VerifyPaymentResult>;
  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}
