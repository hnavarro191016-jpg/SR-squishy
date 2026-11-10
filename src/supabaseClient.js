import { createClient } from '@supabase/supabase-js';

// Base de datos de producción activa (independiente y sin bloqueo)
const supabaseUrl = 'https://trfxmlarhycqhociabls.supabase.co';
const supabaseAnonKey = 'sb_publishable_sXj4dhNDUJnH1IXqI6ogVg_yOBvN6eo';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

