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
  updateUser: async () => ({ error: null }),
};

/* eslint-disable @typescript-eslint/no-explicit-any */

const fallbackSupabase: any = {
  auth: fallbackAuth,
  from: (table: string) => {
    const createChain = (isMutation: boolean) => {
      let isSingle = false;
      const targetFn = () => {};
      const proxy: any = new Proxy(targetFn, {
        get: (target, prop) => {
          if (prop === 'then') {
            const mockValue = isMutation
              ? { data: { id: `local-${table}-${Date.now()}`, status: 'approved' }, error: null }
              : { data: isSingle ? null : [], error: null };
            return (resolve: any) => Promise.resolve(resolve(mockValue));
          }
          if (typeof prop === 'string' && (prop.toLowerCase().includes('single') || prop === 'maybesingle')) {
            isSingle = true;
          }
          return () => proxy;
        },
        apply: () => {
          return proxy;
        }
      });
      return proxy;
    };

    return {
      select: () => createChain(false),
      insert: () => createChain(true),
      update: () => createChain(true),
      delete: () => createChain(true),
      upsert: () => createChain(true),
    };
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop' } }),
    }),
  },
};

export const supabase: any = hasSupabaseConfig
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : fallbackSupabase;
