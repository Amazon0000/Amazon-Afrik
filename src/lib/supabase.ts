import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder-project.supabase.co';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDkyOTU0ODIsImV4cCI6MTkyNDg3MTQ4Mn0.placeholder';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
