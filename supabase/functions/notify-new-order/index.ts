// POST /functions/v1/notify-new-order
// Body: { orderId: string }
//
// Rôle : la table `notifications` n'a volontairement AUCUNE policy INSERT
// pour "authenticated" (voir migration 017) — un acheteur ne doit jamais
// pouvoir notifier n'importe qui depuis le frontend. Cette fonction est donc
// le seul chemin pour créer la notification "Nouvelle commande" du vendeur
// après un checkout réussi (achat identifié OU invité). Elle revérifie
// elle-même l'existence de la commande via la service role avant d'écrire,
// plutôt que de faire confiance aux champs envoyés par le client.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';
import { notifyUser } from '../_shared/notify.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body as { orderId?: string };
    if (!orderId) return jsonResponse({ error: 'orderId requis' }, 400);

    const admin = getAdminClient();

    const { data: order, error } = await admin
      .from('orders')
      .select('id, tracking_id, total, status, seller_id, sellers!inner(user_id, business_name), order_items(product_name, qty, product_type)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) return jsonResponse({ error: 'Commande introuvable' }, 404);

    const seller = order.sellers as unknown as { user_id: string | null; business_name: string };
    if (!seller?.user_id) return jsonResponse({ error: 'Vendeur sans compte lié' }, 404);

    const items = (order.order_items || []) as { product_name: string; qty: number; product_type: string }[];
    const isFullyDigital = items.length > 0 && items.every((i) => i.product_type === 'digital');
    const itemsSummary = items.map((i) => `${i.product_name} x${i.qty}`).join(', ');

    await notifyUser(
      admin,
      seller.user_id,
      'new_order',
      isFullyDigital
        ? `Nouvelle commande (digitale — livrée) — ${order.tracking_id}`
        : `Nouvelle commande — en attente d'expédition — ${order.tracking_id}`,
      `${itemsSummary} • $${Number(order.total).toFixed(2)}`,
      'seller-center',
      { orderId: order.id, trackingId: order.tracking_id, isFullyDigital }
    );

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur inconnue' }, 500);
  }
});
