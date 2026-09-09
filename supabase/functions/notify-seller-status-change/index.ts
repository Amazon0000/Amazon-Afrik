// POST /functions/v1/notify-seller-status-change
// Body: { sellerId: string, status: 'approved'|'rejected'|'suspended', reason?: string }
//
// Rôle : notifications n'a aucune policy INSERT côté client (voir
// migration 017) — c'est le seul chemin pour informer un vendeur d'un
// changement de statut (suspension, rejet, réactivation) avec la vraie
// raison, au lieu de le laisser perdre l'accès en silence.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { notifyUser } from '../_shared/notify.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { sellerId, status, reason } = body as { sellerId?: string; status?: string; reason?: string };
    if (!sellerId || !status) return jsonResponse({ error: 'sellerId et status requis' }, 400);

    const admin = getAdminClient();
    const { data: seller, error } = await admin.from('sellers').select('user_id, business_name').eq('id', sellerId).maybeSingle();
    if (error || !seller?.user_id) return jsonResponse({ error: 'Vendeur introuvable' }, 404);

    const titles: Record<string, { title: string; base: string }> = {
      suspended: {
        title: 'Votre boutique a été suspendue',
        base: "Votre boutique Zando a été suspendue et n'est plus visible par les acheteurs.",
      },
      rejected: {
        title: 'Votre candidature vendeur a été rejetée',
        base: "Votre demande d'ouverture de boutique sur Zando n'a pas été approuvée.",
      },
      approved: {
        title: 'Votre boutique est de nouveau active',
        base: 'Votre boutique Zando a été (ré)activée et est de nouveau visible par les acheteurs.',
      },
    };
    const t = titles[status] || { title: 'Statut de votre boutique mis à jour', base: `Nouveau statut : ${status}.` };
    const message = reason ? `${t.base} Raison : ${reason}` : `${t.base} Contactez le support pour plus de détails.`;

    await notifyUser(admin, seller.user_id, `seller_status_${status}`, t.title, message, 'seller-center', { status, reason: reason || null });

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur inconnue' }, 500);
  }
});
