const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoucvlpmhrqymziktevu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LaugXgJoQNozOLkG14J-CQ_i8PJgJ6b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('round_rooms').select('*').limit(1);
    if (error) {
      console.log('TABLE_STATUS: NOT_EXISTS_OR_ERROR');
      console.log('Error details:', error.message, error.code);
    } else {
      console.log('TABLE_STATUS: EXISTS');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

check();
