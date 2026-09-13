const fs = require('fs');
let code = fs.readFileSync('inland-fishery-web/app.js', 'utf8');

code = code.replace(/saveBtn\.disabled = true; \}\r?\n\s*try \{\r?\n/g, 'saveBtn.disabled = true; }\r\n');

fs.writeFileSync('inland-fishery-web/app.js', code);
console.log('Fixed try');
