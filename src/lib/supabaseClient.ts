import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
export const SUPABASE_URL = 'https://bvggeztgmorusfkedsbj.supabase.co';

export const SUPABASE_ANON_KEY = 'sb_publishable_xhWUFn_vVcVsV1KpLqPBKQ_duFVj-tV';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
