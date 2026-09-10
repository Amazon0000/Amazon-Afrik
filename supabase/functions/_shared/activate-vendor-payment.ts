// Logique centrale, idempotente, appelée par tous les webhooks de
// checkout vendeur après vérification serveur réelle du paiement.
// Miroir volontaire de activate-subscription.ts / activate-campaign.ts,
// appliqué à vendor_psp_payments / orders.
import { getAdminClient } from './supabase-admin.ts';
import { notifyUser, notifyAllSuperAdmins } from './notify.ts';
import { validatePaymentMatch, resolveIdempotentAction } from './payment-validation.ts';
import type { SupportedProvider, VerifyPaymentResult } from './payment-provider.ts';

interface ActivateArgs {
  internalReference: string;
  provider: SupportedProvider | 'paystack';
  verified: VerifyPaymentResult;
  rawWebhookPayload?: unknown;
}

export async function processVerifiedVendorPayment(args: ActivateArgs): Promise<{ ok: boolean; message: string }> {
  const supabase = getAdminClient();
  const { internalReference, provider, verified, rawWebhookPayload } = args;

  const { data: payment, error: paymentErr } = await supabase
    .from('vendor_psp_payments')
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
    await supabase.from('vendor_psp_payments').update({
      status: 'failed',
      raw_webhook_payload: rawWebhookPayload ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id);
    await notifyAllSuperAdmins(
      supabase, 'admin_suspicious_webhook',
      'Paiement vendeur suspect',
      `Montant/devise reçus (${verified.amount} ${verified.currency}) ne correspondent pas à ce qui était attendu pour le paiement ${payment.id} (${provider}). Rejeté automatiquement.`,
      'admin', { paymentId: payment.id, provider }
    );
    return { ok: false, message: 'Montant/devise ne correspondent pas — paiement rejeté.' };
  }

  let newStatus: 'paid' | 'failed' | 'cancelled' | 'pending' = 'pending';
  if (verified.status === 'paid') newStatus = 'paid';
  else if (verified.status === 'failed') newStatus = 'failed';
  else if (verified.status === 'cancelled') newStatus = 'cancelled';

  await supabase.from('vendor_psp_payments').update({
    status: newStatus,
    provider_reference: verified.providerReference,
    raw_webhook_payload: rawWebhookPayload ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id);

  const { data: order } = await supabase.from('orders').select('id, user_id, guest_email, seller_id, tracking_id').eq('id', payment.order_id).maybeSingle();

  if (newStatus !== 'paid') {
    return { ok: true, message: `Paiement en statut ${newStatus}, commande non confirmée.` };
  }

  // Paiement confirmé — la commande passe de 'pending' à 'confirmed'.
  await supabase.from('orders').update({ status: 'confirmed' }).eq('id', payment.order_id).eq('status', 'pending');

  // Stock is only reserved now, at real confirmation — not at checkout
  // time — so an abandoned/failed PSP checkout never permanently locks
  // inventory for a sale that never happened (see CheckoutPage.tsx).
  const { data: items } = await supabase.from('order_items').select('product_id, qty').eq('order_id', payment.order_id);
  for (const item of items || []) {
    if (item.product_id) await supabase.rpc('decrement_product_stock', { p_product_id: item.product_id, p_qty: item.qty });
  }
  const { data: seller } = await supabase.from('sellers').select('user_id').eq('id', payment.seller_id).maybeSingle();
  if (seller?.user_id) {
    await notifyUser(
      supabase, seller.user_id, 'new_order',
      `Paiement confirmé — ${order?.tracking_id || ''}`,
      `Le paiement a été vérifié via ${provider}. Commande prête à préparer.`,
      'seller-center', { orderId: payment.order_id }
    );
  }
  if (order?.user_id) {
    await notifyUser(
      supabase, order.user_id, 'order_paid',
      'Paiement confirmé',
      `Votre commande ${order.tracking_id || ''} est confirmée.`,
      'account', { orderId: payment.order_id }
    );
  }

  return { ok: true, message: 'Commande confirmée avec succès.' };
}
