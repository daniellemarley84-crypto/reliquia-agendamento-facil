import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jhefbcxdfioiawyligkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NGZYkI2nwxjlX8qqjKOVyQ_5qTYoMxZ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
