// POST /functions/v1/ads-cancel-campaign
// Body: { campaignId: string }
// - Vendeur : peut annuler uniquement une campagne encore 'pending' (non payée).
// - Super Admin : peut suspendre ('paused') une campagne active à tout moment.
// Toute demande de remboursement d'une campagne déjà payée doit passer par le
// flux remboursement admin (pas cette fonction), car un remboursement engage
// un appel réel au provider.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Non authentifié' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: 'Non authentifié' }, 401);

    const { campaignId } = await req.json();
    if (!campaignId) return jsonResponse({ error: 'campaignId requis' }, 400);

    const admin = getAdminClient();

    const { data: campaign } = await admin
      .from('ad_campaigns')
      .select('*, sellers!inner(user_id)')
      .eq('id', campaignId)
      .maybeSingle();
    if (!campaign) return jsonResponse({ error: 'Campagne introuvable' }, 404);

    const isOwner = campaign.sellers.user_id === userData.user.id;
    const { data: isSuperAdmin } = await admin
      .from('super_admins')
      .select('id')
      .eq('email', userData.user.email)
      .eq('is_active', true)
      .maybeSingle();

    if (!isOwner && !isSuperAdmin) {
      return jsonResponse({ error: 'Non autorisé' }, 403);
    }

    if (isOwner && !isSuperAdmin) {
      if (campaign.payment_status !== 'pending') {
        return jsonResponse({ error: 'Seule une campagne non payée peut être annulée directement' }, 409);
      }
      await admin.from('ad_campaigns').update({
        status: 'cancelled', payment_status: 'cancelled', updated_at: new Date().toISOString(),
      }).eq('id', campaignId);
      await admin.from('audit_logs').insert({
        actor_id: userData.user.id, action: 'campaign_cancelled',
        target_type: 'ad_campaign', target_id: campaignId, created_at: new Date().toISOString(),
      });
      return jsonResponse({ ok: true, status: 'cancelled' });
    }

    // Super admin : suspension d'une campagne active
    await admin.from('ad_campaigns').update({
      status: 'paused', updated_at: new Date().toISOString(),
    }).eq('id', campaignId);
    await admin.from('audit_logs').insert({
      actor_id: userData.user.id, action: 'campaign_paused',
      target_type: 'ad_campaign', target_id: campaignId, created_at: new Date().toISOString(),
    });
    return jsonResponse({ ok: true, status: 'paused' });
  } catch (e) {
    console.error('ads-cancel-campaign error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
