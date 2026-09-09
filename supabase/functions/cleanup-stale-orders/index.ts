// Fonction destinée à être appelée périodiquement (toutes les 15-30 min),
// même modèle que ads-expire-campaigns. Annule les commandes 'pending'
// abandonnées : un acheteur qui démarre un paiement PSP réel puis
// n'aboutit jamais (ferme l'onglet, change d'avis) laisserait sinon une
// commande fantôme visible indéfiniment dans le dashboard du vendeur.
// Fenêtre de 2h — largement suffisante pour un vrai checkout, assez
// courte pour ne pas polluer le dashboard vendeur avec du bruit.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = getAdminClient();
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: staleOrders } = await admin
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', cutoff);

    if (!staleOrders || staleOrders.length === 0) {
      return jsonResponse({ ok: true, cancelled: 0 });
    }

    const orderIds = staleOrders.map((o) => o.id);

    await admin.from('orders').update({ status: 'cancelled' }).in('id', orderIds).eq('status', 'pending');
    await admin.from('vendor_psp_payments').update({ status: 'cancelled' }).in('order_id', orderIds).eq('status', 'pending');

    return jsonResponse({ ok: true, cancelled: orderIds.length });
  } catch (e) {
    console.error('cleanup-stale-orders error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur interne' }, 500);
  }
});
