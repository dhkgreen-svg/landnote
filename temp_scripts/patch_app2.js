const fs = require('fs');
let code = fs.readFileSync('inland-fishery-web/app.js', 'utf8');

// Patch saveOfficerData
code = code.replace(
  'async function saveOfficerData() {',
  'async function saveOfficerData() {\n  const saveBtn = document.querySelector("#officer-modal button[onclick^=\'saveOfficerData\']");\n  if (saveBtn) { saveBtn.innerText = \"업로드 중...\"; saveBtn.disabled = true; }\n  try {'
);
code = code.replace(
  'let finalImg = uploadedOfficerImageBase64 || urlInput || \'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80\';',
  'if (uploadedOfficerImageBase64 && uploadedOfficerImageBase64.startsWith(\'data:image\')) {\n      uploadedOfficerImageBase64 = await uploadToSupabase(uploadedOfficerImageBase64, \'officer\');\n    }\n    let finalImg = uploadedOfficerImageBase64 || urlInput || \'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80\';\n    uploadedOfficerImageBase64 = null;'
);
code = code.replace(
  'alert("해당 임원 정보가 성공적으로 반영되었습니다.");\n}',
  'alert("해당 임원 정보가 성공적으로 반영되었습니다.");\n  } finally {\n    if (saveBtn) { saveBtn.innerText = \"저장하기\"; saveBtn.disabled = false; }\n  }\n}'
);

fs.writeFileSync('inland-fishery-web/app.js', code);
console.log('Patched saveOfficerData');
