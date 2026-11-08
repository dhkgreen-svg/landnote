const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoucvlpmhrqymziktevu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LaugXgJoQNozOLkG14J-CQ_i8PJgJ6b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertAndSelect() {
  const testRoom = {
    room_id: 'test_db_' + Date.now(),
    leader_name: '김대희 대표님',
    course_id: 'course_1',
    course_name: '구미 동락 파크골프장',
    course_letter: 'A',
    start_hole_index: 1,
    player_count: 4,
    players: [{ id: '1', name: '김대희 대표님', isLeader: true }],
    status: 'WAITING',
    updated_at: Date.now()
  };

  console.log('1. Trying to upsert into round_rooms...');
  const { data, error } = await supabase.from('round_rooms').upsert(testRoom).select();
  if (error) {
    console.log('UPSERT_ERROR:', error.message, error.code, error.details);
  } else {
    console.log('UPSERT_SUCCESS:', data);
  }

  console.log('2. Trying to select from round_rooms...');
  const res = await supabase.from('round_rooms').select('*').limit(5);
  if (res.error) {
    console.log('SELECT_ERROR:', res.error.message);
  } else {
    console.log('SELECT_SUCCESS count:', res.data.length, res.data);
  }
}

testInsertAndSelect();
