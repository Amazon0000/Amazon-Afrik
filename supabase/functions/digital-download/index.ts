// POST /functions/v1/digital-download
// Body: { orderItemId: string, guestEmail?: string }
//
// Rôle : c'est le SEUL chemin par lequel un fichier digital-products est
// jamais lu. On vérifie que l'appelant a réellement acheté cette ligne de
// commande précise (soit user_id = utilisateur authentifié, soit guest_email
// correspondant à la commande invité), puis on génère une URL signée de
// courte durée avec la service role. Aucune policy SELECT publique/large
// n'existe sur le bucket digital-products — voir migration 045.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24h — link stays usable if a buyer closes the tab/email client

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { orderItemId, guestEmail } = body as { orderItemId?: string; guestEmail?: string };
    if (!orderItemId) return jsonResponse({ error: 'orderItemId requis' }, 400);

    const admin = getAdminClient();

    // Try to resolve the caller's identity (optional — guests have none)
    const authHeader = req.headers.get('Authorization');
    let callerId: string | null = null;
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await userClient.auth.getUser();
      callerId = userData?.user?.id ?? null;
    }

    const { data: item, error: itemErr } = await admin
      .from('order_items')
      .select('id, product_type, digital_file_path, product_name, order_id, orders!inner(user_id, guest_email, status)')
      .eq('id', orderItemId)
      .maybeSingle();

    if (itemErr || !item) return jsonResponse({ error: 'Commande introuvable' }, 404);
    if (item.product_type !== 'digital' || !item.digital_file_path) {
      return jsonResponse({ error: "Cet article n'est pas un produit digital" }, 400);
    }

    const order = item.orders as unknown as { user_id: string | null; guest_email: string | null; status: string };
    // Real bug fixed here: this check previously only verified the caller
    // owned the order, never that payment was actually confirmed. An
    // order going through a real vendor PSP starts 'pending' (see
    // migration 057) — without this check, a buyer could download a paid
    // digital product before ever completing payment.
    if (order.status !== 'confirmed' && order.status !== 'delivered') {
      return jsonResponse({ error: 'Paiement non encore confirmé pour cette commande' }, 402);
    }

    const ownedByCaller = callerId && order.user_id && callerId === order.user_id;
    const ownedByGuest = !order.user_id && order.guest_email && guestEmail &&
      order.guest_email.toLowerCase().trim() === guestEmail.toLowerCase().trim();

    if (!ownedByCaller && !ownedByGuest) {
      return jsonResponse({ error: 'Accès refusé — cette commande ne vous appartient pas' }, 403);
    }

    const { data: signed, error: signErr } = await admin.storage
      .from('digital-products')
      .createSignedUrl(item.digital_file_path, SIGNED_URL_TTL_SECONDS, { download: item.product_name });

    if (signErr || !signed) {
      return jsonResponse({ error: 'Impossible de générer le lien de téléchargement' }, 500);
    }

    return jsonResponse({ url: signed.signedUrl, expiresInSeconds: SIGNED_URL_TTL_SECONDS });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur inconnue' }, 500);
  }
});
