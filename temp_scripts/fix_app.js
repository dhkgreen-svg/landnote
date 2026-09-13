const fs = require('fs');
let code = fs.readFileSync('inland-fishery-web/app.js', 'utf8');

function fix(fnName, tryLine, alertText) {
  let fnStart = code.indexOf('async function ' + fnName);
  let tryPos = code.indexOf(tryLine, fnStart);
  if (tryPos === -1) return;
  
  let alertPos = code.indexOf(alertText, tryPos);
  if (alertPos === -1) return;
  
  let closeBracePos = code.indexOf('}', alertPos);
  
  let before = code.substring(0, closeBracePos);
  let after = code.substring(closeBracePos + 1);
  
  code = before + "} catch (err) { console.error(err); alert('오류가 발생했습니다.'); } finally { if (saveBtn) { saveBtn.innerText = '저장하기'; saveBtn.disabled = false; } }\n}" + after;
}

fix('savePresidentGreetingData', 'try {', 'alert(\'? ?장 ?사????이???보가 ?공?으?반영?었?니??\');');
fix('saveGalleryData', 'try {', 'alert("?당 ?동 ??계 ?역???공?으????었?니??");');
fix('saveBranchGalleryData', 'try {', 'alert(\[지???사 ?록 ?료]\\n\\'\\\' (\) ?역???록?었?니??\);');
fix('saveOfficerData', 'try {', 'alert("해당 임원 정보가 성공적으로 반영되었습니다.");');

fs.writeFileSync('inland-fishery-web/app.js', code);
console.log('Fixed app.js syntax');
