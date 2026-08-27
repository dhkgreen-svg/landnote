const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ingxrbznlgdueofcbsmf.supabase.co';
const supabaseKey = 'sb_publishable_QqsRMoiUYnez4f2h-V41vQ_6SgbUZwe'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function pushData() {
  try {
    const dataPath = 'd:\\\\UserFiles\\\\Desktop\\\\landnote\\\\inland-fishery-web-backup\\\\.data\\\\data_store.json';
    if (!fs.existsSync(dataPath)) {
      console.error('Local data_store.json not found!');
      return;
    }
    const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Read local data, length:', JSON.stringify(localData).length);

    // Now update Supabase app_state id=1
    const { data, error } = await supabase
      .from('app_state')
      .upsert({ id: 1, data: localData })
      .select();

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('Successfully pushed to Supabase!');
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

pushData();
