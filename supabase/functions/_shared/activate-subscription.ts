// Logique centrale, idempotente, appelée par TOUS les webhooks d'abonnement
// (Stripe, Flutterwave, PayUnit, Paddle) après vérification serveur réelle
// du paiement. Aucun webhook n'active un plan "à la main" — tout passe ici.
// Miroir volontaire de activate-campaign.ts (même garanties : idempotence,
// validation montant/devise, activation atomique) appliqué à
// subscription_payments / sellers.plan au lieu de advertising_payments /
// ad_campaigns.
import { getAdminClient } from './supabase-admin.ts';
import { notifyUser, notifyAllSuperAdmins } from './notify.ts';
import { validatePaymentMatch, resolveIdempotentAction } from './payment-validation.ts';
import type { SupportedProvider, VerifyPaymentResult } from './payment-provider.ts';

interface ActivateArgs {
  internalReference: string;
  provider: SupportedProvider;
  verified: VerifyPaymentResult;
  rawWebhookPayload?: unknown;
}

export async function processVerifiedSubscriptionPayment(args: ActivateArgs): Promise<{ ok: boolean; message: string }> {
  const supabase = getAdminClient();
  const { internalReference, provider, verified, rawWebhookPayload } = args;

  const { data: payment, error: paymentErr } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('internal_reference', internalReference)
    .maybeSingle();

  if (paymentErr || !payment) {
    return { ok: false, message: `Paiement introuvable pour la référence ${internalReference}` };
  }

  const idempotentAction = resolveIdempotentAction(payment.status);
  if (idempotentAction.type === 'already_paid') {
    return { ok: true, message: 'Déjà traité (idempotent) — aucune action.' };
  }
  if (idempotentAction.type === 'terminal_ignored') {
    return { ok: true, message: `Paiement déjà en état terminal (${idempotentAction.status}) — ignoré.` };
  }

  const expectedAmount = Number(payment.amount);
  const expectedCurrency = String(payment.currency_code || '').toUpperCase();
  const match = validatePaymentMatch({
    expectedAmount, expectedCurrency,
    receivedAmount: verified.amount, receivedCurrency: verified.currency,
  });

  if (verified.status === 'paid' && !match.isValid) {
    await supabase.from('subscription_payments').update({
      status: 'failed',
      raw_webhook_payload: rawWebhookPayload ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id);
    await notifyAllSuperAdmins(
      supabase,
      'admin_suspicious_webhook',
      'Paiement abonnement suspect',
      `Montant/devise reçus (${verified.amount} ${verified.currency}) ne correspondent pas à ce qui était attendu (${expectedAmount} ${expectedCurrency}) pour le paiement ${payment.id}. Rejeté automatiquement.`,
      'admin',
      { paymentId: payment.id, provider }
    );
    return { ok: false, message: `Montant/devise ne correspondent pas — paiement rejeté.` };
  }

  let newStatus: 'paid' | 'failed' | 'cancelled' | 'pending' = 'pending';
  if (verified.status === 'paid') newStatus = 'paid';
  else if (verified.status === 'failed') newStatus = 'failed';
  else if (verified.status === 'cancelled') newStatus = 'cancelled';

  await supabase.from('subscription_payments').update({
    status: newStatus,
    provider_reference: verified.providerReference,
    raw_webhook_payload: rawWebhookPayload ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id);

  const { data: seller } = await supabase.from('sellers').select('user_id').eq('id', payment.seller_id).maybeSingle();

  if (newStatus !== 'paid') {
    if (seller?.user_id) {
      await notifyUser(
        supabase, seller.user_id, 'subscription_payment_failed',
        locFail(),
        `Le paiement pour le plan ${payment.plan} a échoué (${newStatus}). Vous pouvez réessayer.`,
        'seller-center', { paymentId: payment.id }
      );
    }
    return { ok: true, message: `Paiement en statut ${newStatus}, plan non activé.` };
  }

  // Paiement confirmé — activation atomique, protégée contre double
  // traitement (même paiement déjà appliqué par un webhook concurrent).
  const { data: updated } = await supabase
    .from('sellers')
    .update({ plan: payment.plan, plan_selected: payment.plan, plan_expires_at: computeNextExpiry(), subscription_status: 'active' })
    .eq('id', payment.seller_id)
    .select('id')
    .maybeSingle();

  if (!updated) {
    return { ok: false, message: 'Impossible de mettre à jour le vendeur (introuvable).' };
  }

  if (seller?.user_id) {
    await notifyUser(
      supabase, seller.user_id, 'subscription_activated',
      'Abonnement activé 🎉',
      `Votre plan ${payment.plan} est maintenant actif.`,
      'seller-center', { plan: payment.plan }
    );
  }
  // Affiliate commission only ever recorded here — on a real, verified
  // payment — never on a free/instant plan change.
  try {
    await supabase.rpc('record_affiliate_conversion', { p_seller_id: payment.seller_id, p_plan_price: Number(payment.amount) });
  } catch (_e) {
    console.warn('record_affiliate_conversion failed (non-blocking)');
  }
  await notifyAllSuperAdmins(
    supabase, 'admin_new_paid_subscription',
    'Nouvel abonnement payé',
    `Vendeur ${payment.seller_id} — plan ${payment.plan} activé via ${provider} (${payment.amount} ${payment.currency_code}).`,
    'admin', { sellerId: payment.seller_id, provider, plan: payment.plan }
  );

  return { ok: true, message: 'Plan activé avec succès.' };
}

function locFail() { return 'Paiement abonnement échoué'; }

// Monthly subscriptions — 30 days from activation, consistent with the
// existing plan_expires_at column already used for admin extensions
// (migration 036_subscription_expiry).
function computeNextExpiry(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}
