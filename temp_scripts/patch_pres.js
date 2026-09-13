const fs = require('fs');
let code = fs.readFileSync('inland-fishery-web/app.js', 'utf8');

// Add the file upload input
code = code.replace('<input type="text" id="edit-pres-photo"', 
    '<input type="file" id="edit-pres-photo-upload" accept="image/*" onchange="handlePresImageUpload(event)" style="margin-bottom: 6px; font-size: 0.85rem; width: 100%;"><input type="text" id="edit-pres-photo" placeholder="또는 이미지 주소 URL 직접 입력"');

// Add the handler function
const handlerCode = 
let uploadedPresImageBase64 = null;
function handlePresImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedPresImageBase64 = event.target.result;
    document.getElementById('edit-pres-photo').value = '파일이 선택되었습니다 (' + file.name + ')';
  };
  reader.readAsDataURL(file);
}
;
code = code.replace('function openPresidentGreetingEditModal() {', handlerCode + '\nfunction openPresidentGreetingEditModal() {');

// Use the base64 string when saving
code = code.replace("const photo = document.getElementById('edit-pres-photo').value.trim();", 
    "let photo = document.getElementById('edit-pres-photo').value.trim();\n    if (uploadedPresImageBase64) photo = uploadedPresImageBase64;");

// Reset the base64 string when opening the modal
code = code.replace("showModalClean('president-greeting-edit-modal');", 
    "uploadedPresImageBase64 = null;\n    if (document.getElementById('edit-pres-photo-upload')) document.getElementById('edit-pres-photo-upload').value = '';\n    showModalClean('president-greeting-edit-modal');");

// Cache busting
code = code.replace(/v=clear_cache_\d+/, 'v=clear_cache_' + Date.now());

fs.writeFileSync('inland-fishery-web/app.js', code);
console.log('Patched app.js successfully');
