const fs = require('fs');
let code = fs.readFileSync('inland-fishery-web/app.js', 'utf8');

code = code.replace(
  'async function savePresidentGreetingData() {\n  const saveBtn = document.querySelector("#president-greeting-edit-modal button[onclick^=\'savePresidentGreetingData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {',
  'async function savePresidentGreetingData() {\n  const saveBtn = document.querySelector("#president-greeting-edit-modal button[onclick^=\'savePresidentGreetingData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }'
);
code = code.replace(
  'async function saveGalleryData(isDraft = false) {\n  const saveBtn = document.querySelector("#master-dashboard-modal button[onclick^=\'saveGallery\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {',
  'async function saveGalleryData(isDraft = false) {\n  const saveBtn = document.querySelector("#master-dashboard-modal button[onclick^=\'saveGallery\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }'
);
code = code.replace(
  'async function saveBranchGalleryData() {\n  const saveBtn = document.querySelector("#branch-admin-modal button[onclick^=\'saveBranch\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {',
  'async function saveBranchGalleryData() {\n  const saveBtn = document.querySelector("#branch-admin-modal button[onclick^=\'saveBranch\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }'
);
code = code.replace(
  'async function saveOfficerData() {\n  const saveBtn = document.querySelector("#officer-modal button[onclick^=\'saveOfficerData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }\n  try {',
  'async function saveOfficerData() {\n  const saveBtn = document.querySelector("#officer-modal button[onclick^=\'saveOfficerData\']");\n  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }'
);

fs.writeFileSync('inland-fishery-web/app.js', code);
console.log('Undid try blocks');
