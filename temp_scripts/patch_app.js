const fs = require('fs');
let code = fs.readFileSync('d:\\UserFiles\\Desktop\\landnote\\inland-fishery-web\\app.js', 'utf8');

const helper = `
const supabaseUrl = 'https://ingxrbznlgdueofcbsmf.supabase.co';
const supabaseKey = 'sb_publishable_QqsRMoiUYnez4f2h-V41vQ_6SgbUZwe';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function base64ToBlob(base64) {
  const mimeType = base64.match(/data:([a-zA-Z0-9]+\\/[a-zA-Z0-9-.+]+).*,.*/)[1];
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

async function uploadToSupabase(base64Data, prefix) {
  if (!base64Data.startsWith('data:image')) return base64Data;
  const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\\/[a-zA-Z0-9-.+]+).*,.*/)[1];
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
`;

code = helper + '\n' + code;

// Patch savePresidentGreetingData
code = code.replace(
  'async function savePresidentGreetingData() {',
  'async function savePresidentGreetingData() {\n  const saveBtn = document.querySelector("#president-greeting-edit-modal button[onclick^=\'savePresidentGreetingData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {'
);
code = code.replace(
  "let photo = document.getElementById('edit-pres-photo').value.trim();",
  "let photo = document.getElementById('edit-pres-photo').value.trim();\n    if (uploadedPresImageBase64) {\n      photo = await uploadToSupabase(uploadedPresImageBase64, 'president');\n      uploadedPresImageBase64 = null;\n    }"
);
code = code.replace(
  "alert('본 회장 인사말 및 임원진 정보가 성공적으로 반영되었습니다.');\n}",
  "alert('본 회장 인사말 및 임원진 정보가 성공적으로 반영되었습니다.');\n  } finally {\n    if (saveBtn) { saveBtn.innerText = \"저장하기\"; saveBtn.disabled = false; }\n  }\n}"
);

// Patch saveGalleryData
code = code.replace(
  'async function saveGalleryData() {',
  'async function saveGalleryData() {\n  const saveBtn = document.querySelector("#gallery-edit-modal button[onclick^=\'saveGalleryData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {'
);
code = code.replace(
  'const images = tempUploadedImages;',
  'const uploadedUrls = [];\n    for (let b64 of tempUploadedImages) {\n      uploadedUrls.push(await uploadToSupabase(b64, \'gallery\'));\n    }\n    const images = uploadedUrls;\n    tempUploadedImages = [];'
);
code = code.replace(
  'alert("해당 갤러리 내역이 성공적으로 반영되었습니다.");\n}',
  'alert("해당 갤러리 내역이 성공적으로 반영되었습니다.");\n  } finally {\n    if (saveBtn) { saveBtn.innerText = "저장하기"; saveBtn.disabled = false; }\n  }\n}'
);

// Patch saveBranchGalleryData
code = code.replace(
  'async function saveBranchGalleryData() {',
  'async function saveBranchGalleryData() {\n  const saveBtn = document.querySelector("#branch-gallery-edit-modal button[onclick^=\'saveBranchGalleryData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {'
);
code = code.replace(
  'const images = tempUploadedBranchImages;',
  'const uploadedUrls = [];\n    for (let b64 of tempUploadedBranchImages) {\n      uploadedUrls.push(await uploadToSupabase(b64, \'branch\'));\n    }\n    const images = uploadedUrls;\n    tempUploadedBranchImages = [];'
);
code = code.replace(
  'alert("해당 지부 행사 내역이 성공적으로 반영되었습니다.");\n}',
  'alert("해당 지부 행사 내역이 성공적으로 반영되었습니다.");\n  } finally {\n    if (saveBtn) { saveBtn.innerText = "저장하기"; saveBtn.disabled = false; }\n  }\n}'
);

fs.writeFileSync('d:\\UserFiles\\Desktop\\landnote\\inland-fishery-web\\app.js', code);
console.log('Patched app.js');
