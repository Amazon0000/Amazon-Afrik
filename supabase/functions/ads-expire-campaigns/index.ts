// Fonction destinée à être appelée périodiquement (Supabase Scheduled
// Functions / pg_cron, ex: toutes les 5 minutes). Appelle la fonction SQL
// expire_ad_campaigns() définie en migration 016, qui bascule
// status='active' AND expires_at<=now() vers status='expired'.
// Le projet n'ayant aucun autre système de cron existant à réutiliser
// (les flash_deals recalculent l'expiration à la lecture, sans job dédié),
// ceci est le seul scheduler introduit par ce module.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc('expire_ad_campaigns');
    if (error) throw error;

    if ((data as number) > 0) {
      await admin.from('audit_logs').insert({
        actor_name: 'system:advertising-cron',
        action: 'campaigns_expired_batch',
        target_type: 'ad_campaign',
        new_value: { count: data },
        created_at: new Date().toISOString(),
      });
    }

    return jsonResponse({ expired_count: data ?? 0 });
  } catch (e) {
    console.error('ads-expire-campaigns error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
