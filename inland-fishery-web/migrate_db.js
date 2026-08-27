const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ingxrbznlgdueofcbsmf.supabase.co';
const supabaseKey = 'sb_publishable_QqsRMoiUYnez4f2h-V41vQ_6SgbUZwe';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

function base64ToBlob(base64) {
  const mimeType = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

async function uploadToSupabase(base64Data, prefix) {
  if (!base64Data || !base64Data.startsWith('data:image')) return base64Data;
  const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
  const ext = mimeType.split('/')[1] || 'jpg';
  const blob = base64ToBlob(base64Data);
  const fileName = prefix + '_' + Date.now() + '_' + Math.floor(Math.random()*10000) + '.' + ext;
  
  const { data, error } = await supabaseClient.storage.from('public_images').upload(fileName, blob, {
    cacheControl: '3600',
    upsert: false
  });
  
  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
  
  const { data: { publicUrl } } = supabaseClient.storage.from('public_images').getPublicUrl(fileName);
  return publicUrl;
}

async function run() {
  console.log('Loading DB...');
  const dbData = fs.readFileSync('D:\\\\UserFiles\\\\Desktop\\\\FINAL_DB_BACKUP_LATEST_20260826.json', 'utf8');
  let db = JSON.parse(dbData);
  
  if (db.presidentGreeting && db.presidentGreeting.image) {
    db.presidentGreeting.image = await uploadToSupabase(db.presidentGreeting.image, 'president');
    console.log('Migrated president image');
  }
  if (db.boardList) {
    for (let i=0; i<db.boardList.length; i++) {
      if (db.boardList[i].image) {
        db.boardList[i].image = await uploadToSupabase(db.boardList[i].image, 'officer');
        console.log('Migrated board image', i);
      }
    }
  }
  if (db.delegateList) {
    for (let i=0; i<db.delegateList.length; i++) {
      if (db.delegateList[i].image) {
        db.delegateList[i].image = await uploadToSupabase(db.delegateList[i].image, 'delegate');
        console.log('Migrated delegate image', i);
      }
    }
  }
  if (db.gallery) {
    for (let i=0; i<db.gallery.length; i++) {
      let entry = db.gallery[i];
      entry.image = await uploadToSupabase(entry.image, 'gallery_main');
      if (entry.images) {
        for (let j=0; j<entry.images.length; j++) {
          entry.images[j] = await uploadToSupabase(entry.images[j], 'gallery_sub');
        }
      }
      console.log('Migrated gallery entry', i);
    }
  }
  if (db.accounting) {
    for (let i=0; i<db.accounting.length; i++) {
      let entry = db.accounting[i];
      entry.image = await uploadToSupabase(entry.image, 'accounting_main');
      if (entry.images) {
        for (let j=0; j<entry.images.length; j++) {
          entry.images[j] = await uploadToSupabase(entry.images[j], 'accounting_sub');
        }
      }
      console.log('Migrated accounting entry', i);
    }
  }

  console.log('Saving optimized DB...');
  fs.writeFileSync('D:\\\\UserFiles\\\\Desktop\\\\OPTIMIZED_DB.json', JSON.stringify(db));
  
  console.log('Upserting to Supabase...');
  const { error } = await supabaseClient.from('app_state').upsert({ id: 1, data: db });
  if (error) {
    console.error('Upsert failed:', error);
  } else {
    console.log('Upsert Success! Database is fully optimized.');
  }
}

run();
