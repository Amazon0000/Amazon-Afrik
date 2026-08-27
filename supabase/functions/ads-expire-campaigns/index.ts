// Fonction destinée à être appelée périodiquement (Supabase Scheduled
// Functions / pg_cron, ex: toutes les 5 minutes). Appelle la fonction SQL
// expire_ad_campaigns() définie en migration 016, qui bascule
// status='active' AND expires_at<=now() vers status='expired'.
// Le projet n'ayant aucun autre système de cron existant à réutiliser
// (les flash_deals recalculent l'expiration à la lecture, sans job dédié),
// ceci est le seul scheduler introduit par ce module.
//
// Envoie aussi un rappel "bientôt expirée" (une seule fois, via
// expiry_reminder_sent_at) pour les campagnes actives qui expirent dans
// moins de 24h.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { notifyUser } from '../_shared/notify.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = getAdminClient();

    // 1. Rappels "bientôt expirée" (< 24h, pas encore envoyés)
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: soonExpiring } = await admin
      .from('ad_campaigns')
      .select('id, name, seller_id, expires_at, sellers(user_id)')
      .eq('status', 'active')
      .lte('expires_at', in24h)
      .gt('expires_at', new Date().toISOString())
      .is('expiry_reminder_sent_at', null);

    for (const c of (soonExpiring ?? []) as any[]) {
      const sellerUserId = c.sellers?.user_id;
      if (sellerUserId) {
        await notifyUser(
          admin, sellerUserId, 'ad_campaign_expiring',
          'Campagne bientôt expirée',
          `Votre campagne "${c.name}" expire le ${new Date(c.expires_at).toLocaleString('fr-FR')}. Pensez à la renouveler si besoin.`,
          'ads', { campaignId: c.id }
        );
      }
      await admin.from('ad_campaigns').update({ expiry_reminder_sent_at: new Date().toISOString() }).eq('id', c.id);
    }

    // 2. Expiration réelle + notification "expirée"
    const { data: toExpire } = await admin
      .from('ad_campaigns')
      .select('id, name, seller_id, sellers(user_id)')
      .eq('status', 'active')
      .lte('expires_at', new Date().toISOString());

    const { data, error } = await admin.rpc('expire_ad_campaigns');
    if (error) throw error;

    for (const c of (toExpire ?? []) as any[]) {
      const sellerUserId = c.sellers?.user_id;
      if (sellerUserId) {
        await notifyUser(
          admin, sellerUserId, 'ad_campaign_expired',
          'Campagne expirée',
          `Votre campagne "${c.name}" est arrivée à expiration. Le produit n'est plus mis en avant.`,
          'ads', { campaignId: c.id }
        );
      }
    }

    if ((data as number) > 0) {
      await admin.from('audit_logs').insert({
        actor_name: 'system:advertising-cron',
        action: 'campaigns_expired_batch',
        target_type: 'ad_campaign',
        new_value: { count: data },
        created_at: new Date().toISOString(),
      });
    }

    return jsonResponse({ expired_count: data ?? 0, reminders_sent: soonExpiring?.length ?? 0 });
  } catch (e) {
    console.error('ads-expire-campaigns error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
