import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasSupabaseConfig = Boolean(url && anonKey && url !== 'https://placeholder.supabase.co');

const fallbackAuth = {
  persistSession: true,
  autoRefreshToken: true,
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => undefined } },
  }),
  signOut: async () => ({ error: null }),
  signInWithPassword: async () => ({ data: { user: null }, error: null }),
  signUp: async ({ email, options }: { email: string; options?: { data?: Record<string, unknown> } }) => ({
    data: {
      user: {
        id: `local-${Date.now()}`,
        email,
        user_metadata: options?.data || {},
      },
      session: { user: { id: `local-${Date.now()}`, email, user_metadata: options?.data || {} } },
    },
    error: null,
  }),
  resetPasswordForEmail: async () => ({ error: null }),
};

/* eslint-disable @typescript-eslint/no-explicit-any */

const fallbackSupabase: any = {
  auth: fallbackAuth,
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({ then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }) }),
        maybeSingle: async () => ({ data: null, error: null }),
        limit: () => ({ then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }) }),
      }),
      order: () => ({ then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }) }),
      limit: () => ({ then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }) }),
    }),
    insert: async () => ({ data: null, error: null }),
    update: () => ({ eq: async () => ({ data: null, error: null }) }),
    delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    upsert: async () => ({ data: null, error: null }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

export const supabase: any = hasSupabaseConfig
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : fallbackSupabase;
