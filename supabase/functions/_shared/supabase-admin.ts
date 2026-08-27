import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants (secrets Edge Function)');
  }
  // Service Role Key : bypass RLS. Ne JAMAIS exposer cette clé au frontend.
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
