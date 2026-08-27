// Logique centrale, idempotente, appelée par TOUS les webhooks (Stripe,
// Flutterwave, PayUnit) après vérification serveur réelle du paiement.
// Aucun webhook n'active directement une campagne "à la main" : tout passe ici.
import { getAdminClient } from './supabase-admin.ts';
import { notifyUser, notifyAllSuperAdmins } from './notify.ts';
import { validatePaymentMatch, resolveIdempotentAction, computeExpiryDate } from './payment-validation.ts';
import type { SupportedProvider, VerifyPaymentResult } from './payment-provider.ts';

interface ActivateArgs {
  internalReference: string;
  provider: SupportedProvider;
  verified: VerifyPaymentResult;
  rawWebhookPayload?: unknown;
}

export async function processVerifiedPayment(args: ActivateArgs): Promise<{ ok: boolean; message: string }> {
  const supabase = getAdminClient();
  const { internalReference, provider, verified, rawWebhookPayload } = args;

  // 1. Retrouver le paiement pub par référence interne (idempotency key)
  const { data: payment, error: paymentErr } = await supabase
    .from('advertising_payments')
    .select('*, ad_campaigns(*)')
    .eq('internal_reference', internalReference)
    .maybeSingle();

  if (paymentErr || !payment) {
    return { ok: false, message: `Paiement introuvable pour la référence ${internalReference}` };
  }

  // 2. Idempotence stricte : décision basée sur l'état actuel (fonction pure
  //    testée unitairement — voir activate-campaign.test.ts).
  const idempotentAction = resolveIdempotentAction(payment.status);
  if (idempotentAction.type === 'already_paid') {
    return { ok: true, message: 'Déjà traité (idempotent) — aucune action.' };
  }
  if (idempotentAction.type === 'terminal_ignored') {
    return { ok: true, message: `Paiement déjà en état terminal (${idempotentAction.status}) — ignoré.` };
  }

  const campaign = payment.ad_campaigns;
  if (!campaign) {
    return { ok: false, message: 'Campagne associée introuvable.' };
  }

  // Résout le user_id du vendeur (table sellers) pour les notifications —
  // ne bloque jamais le flux de paiement si l'appel échoue.
  const getSellerUserId = async (): Promise<string | null> => {
    const { data } = await supabase.from('sellers').select('user_id').eq('id', campaign.seller_id).maybeSingle();
    return data?.user_id ?? null;
  };

  // 3. Validation stricte : montant + devise + provider doivent correspondre
  //    à ce qui était attendu — jamais confiance aveugle au provider.
  //    (fonction pure testée unitairement)
  const expectedAmount = Number(campaign.price);
  const expectedCurrency = String(campaign.currency_code || '').toUpperCase();
  const match = validatePaymentMatch({
    expectedAmount, expectedCurrency,
    receivedAmount: verified.amount, receivedCurrency: verified.currency,
  });

  if (verified.status === 'paid' && !match.isValid) {
    await supabase.from('advertising_payments').update({
      status: 'failed',
      raw_webhook_payload: rawWebhookPayload ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id);
    await notifyAllSuperAdmins(
      supabase,
      'admin_suspicious_webhook',
      'Paiement publicitaire suspect',
      `Montant/devise reçus (${verified.amount} ${verified.currency}) ne correspondent pas à ce qui était attendu (${expectedAmount} ${expectedCurrency}) pour la campagne ${campaign.id}. Paiement rejeté automatiquement.`,
      'adv-payments',
      { campaignId: campaign.id, provider }
    );
    return { ok: false, message: `Montant/devise ne correspondent pas (attendu ${expectedAmount} ${expectedCurrency}, reçu ${verified.amount} ${verified.currency}) — paiement rejeté.` };
  }

  // 4. Traduire le statut vérifié en statut de paiement
  let newPaymentStatus: 'paid' | 'failed' | 'cancelled' | 'pending' = 'pending';
  if (verified.status === 'paid') newPaymentStatus = 'paid';
  else if (verified.status === 'failed') newPaymentStatus = 'failed';
  else if (verified.status === 'cancelled') newPaymentStatus = 'cancelled';

  await supabase.from('advertising_payments').update({
    status: newPaymentStatus,
    provider_reference: verified.providerReference,
    raw_webhook_payload: rawWebhookPayload ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id);

  if (newPaymentStatus !== 'paid') {
    // paiement non réussi : la campagne reste en pending/payment_status correspondant,
    // elle ne doit jamais être activée.
    await supabase.from('ad_campaigns').update({
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id).eq('payment_status', 'pending'); // ne touche pas si déjà traité ailleurs
    await logAudit(supabase, 'payment_failed', campaign.id, payment.id, { provider, verified });
    const sellerUserId = await getSellerUserId();
    if (sellerUserId) {
      await notifyUser(
        supabase, sellerUserId, 'ad_payment_failed',
        'Paiement publicitaire échoué',
        `Le paiement de votre campagne "${campaign.name}" a échoué (${newPaymentStatus}). Vous pouvez réessayer avec un autre moyen de paiement.`,
        'ads', { campaignId: campaign.id }
      );
    }
    return { ok: true, message: `Paiement en statut ${newPaymentStatus}, campagne non activée.` };
  }

  // 5. Paiement confirmé — vérifier que la campagne n'est pas déjà active
  //    (protection anti-double-activation en cas de webhook dupliqué en concurrence)
  const { data: freshCampaign } = await supabase
    .from('ad_campaigns')
    .select('id, status, payment_status')
    .eq('id', campaign.id)
    .single();

  if (freshCampaign?.status === 'active' || freshCampaign?.payment_status === 'paid') {
    return { ok: true, message: 'Campagne déjà activée (idempotent) — aucune double activation.' };
  }

  // 6. Récupérer la durée du plan pour calculer expires_at
  const { data: plan } = await supabase
    .from('advertising_plans')
    .select('duration_days')
    .eq('id', campaign.plan_id)
    .maybeSingle();

  const durationDays = plan?.duration_days ?? 7;
  const startsAt = new Date();
  const expiresAt = computeExpiryDate(startsAt, durationDays);

  // 7. Activation atomique : condition WHERE payment_status='pending' AND status='pending'
  //    empêche toute double activation même en cas de webhooks concurrents.
  const { data: updated } = await supabase
    .from('ad_campaigns')
    .update({
      payment_status: 'paid',
      status: 'active',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaign.id)
    .eq('payment_status', 'pending')
    .select('id')
    .maybeSingle();

  if (!updated) {
    // Une autre invocation concurrente a déjà fait la mise à jour — idempotent, pas une erreur.
    await logAudit(supabase, 'payment_confirmed_duplicate_webhook', campaign.id, payment.id, { provider });
    return { ok: true, message: 'Activation déjà réalisée par un webhook concurrent (idempotent).' };
  }

  await logAudit(supabase, 'campaign_activated', campaign.id, payment.id, {
    provider,
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  const sellerUserId = await getSellerUserId();
  if (sellerUserId) {
    await notifyUser(
      supabase, sellerUserId, 'ad_campaign_activated',
      'Campagne publicitaire activée 🎉',
      `Votre campagne "${campaign.name}" est maintenant active jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
      'ads', { campaignId: campaign.id, expiresAt: expiresAt.toISOString() }
    );
  }
  await notifyAllSuperAdmins(
    supabase, 'admin_new_paid_campaign',
    'Nouvelle campagne publicitaire payée',
    `Campagne "${campaign.name}" activée via ${provider} — ${campaign.price} ${campaign.currency_code}.`,
    'adv-campaigns', { campaignId: campaign.id, provider }
  );

  return { ok: true, message: 'Campagne activée avec succès.' };
}

// Réutilise la table `audit_logs` existante (migration 007 — compliance
// center) plutôt que d'en créer une nouvelle. Schéma réel :
// id, actor_id, actor_name, action, target_type, target_id, target_name,
// previous_value, new_value, reason, ip_address, created_at.
async function logAudit(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  action: string,
  campaignId: string,
  paymentId: string,
  metadata: Record<string, unknown>
) {
  try {
    await supabase.from('audit_logs').insert({
      actor_name: 'system:advertising',
      action,
      target_type: 'ad_campaign',
      target_id: campaignId,
      new_value: { payment_id: paymentId, ...metadata },
      created_at: new Date().toISOString(),
    });
  } catch (_e) {
    console.warn('audit log non enregistré:', action);
  }
}
