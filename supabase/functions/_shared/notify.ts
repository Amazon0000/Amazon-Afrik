// Helper centralisé de création de notifications, utilisé par toutes les
// Edge Functions du module Advertising. N'écrit jamais directement dans
// notifications ailleurs que via cette fonction, pour garder un format cohérent.
// deno-lint-ignore no-explicit-any
type AdminClient = any;

export async function notifyUser(
  supabase: AdminClient,
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link: link ?? null,
      metadata: metadata ?? null,
    });
  } catch (e) {
    console.warn('notifyUser failed:', e);
  }
}

// Notifie tous les super admins actifs (table super_admins existante).
export async function notifyAllSuperAdmins(
  supabase: AdminClient,
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { data: admins } = await supabase
      .from('super_admins')
      .select('email')
      .eq('is_active', true);
    if (!admins?.length) return;

    // super_admins référence des emails, pas des user_id directement — on
    // résout via auth.users pour respecter la contrainte FK de notifications.
    const { data: userRows } = await supabase.auth.admin.listUsers();
    const byEmail = new Map((userRows?.users ?? []).map((u: { id: string; email?: string }) => [u.email, u.id]));

    for (const admin of admins as { email: string }[]) {
      const uid = byEmail.get(admin.email);
      if (uid) await notifyUser(supabase, uid, type, title, message, link, metadata);
    }
  } catch (e) {
    console.warn('notifyAllSuperAdmins failed:', e);
  }
}
