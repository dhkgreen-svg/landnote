import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoucvlpmhrqymziktevu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LaugXgJoQNozOLkG14J-CQ_i8PJgJ6b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
