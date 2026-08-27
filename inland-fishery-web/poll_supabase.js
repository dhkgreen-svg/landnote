const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient('https://ingxrbznlgdueofcbsmf.supabase.co', 'sb_publishable_QqsRMoiUYnez4f2h-V41vQ_6SgbUZwe');

async function poll() {
  while (true) {
    try {
      const { data, error } = await supabase.from('app_state').select('id').limit(1);
      if (error) {
        console.log('Error:', error.message);
      } else {
        console.log('Success! Database is up and responding.');
        // Now push the data!
        const dataPath = 'd:\\\\UserFiles\\\\Desktop\\\\landnote\\\\inland-fishery-web-backup\\\\.data\\\\data_store.json';
        const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log('Pushing data to DB...');
        const { error: upsertErr } = await supabase.from('app_state').upsert({ id: 1, data: localData });
        if (upsertErr) {
          console.error('Upsert failed:', upsertErr);
        } else {
          console.log('Data pushed successfully!');
        }
        break;
      }
    } catch (e) {
      console.log('Exception:', e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}

poll();
