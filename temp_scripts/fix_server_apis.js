const fs = require('fs');
let code = fs.readFileSync('inland-fishery-web/server.js', 'utf8');

const additionalApis = 
  if (req.url === '/api/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const db = await loadDb();
        if (!db.pendingUsers) db.pendingUsers = [];
        db.pendingUsers.push(payload);
        await saveDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/approve-user' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { id } = JSON.parse(body);
        const db = await loadDb();
        if (!db.users) db.users = [];
        if (!db.pendingUsers) db.pendingUsers = [];
        const userIdx = db.pendingUsers.findIndex(u => u.id === id);
        if (userIdx !== -1) {
          db.users.push(db.pendingUsers[userIdx]);
          db.pendingUsers.splice(userIdx, 1);
          await saveDb(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/reject-user' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { id } = JSON.parse(body);
        const db = await loadDb();
        if (db.pendingUsers) {
          db.pendingUsers = db.pendingUsers.filter(u => u.id !== id);
          await saveDb(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/change-pw' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { id, oldPw, newPw } = JSON.parse(body);
        const db = await loadDb();
        if (db.users) {
          const user = db.users.find(u => u.id === id);
          if (user && user.pw === oldPw) {
            user.pw = newPw;
            await saveDb(db);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, db }));
            return;
          }
        }
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '비밀번호 변경 실패' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/delete-user' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { id } = JSON.parse(body);
        const db = await loadDb();
        if (db.users) {
          db.users = db.users.filter(u => u.id !== id);
          await saveDb(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/inquiry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const db = await loadDb();
        if (!db.inquiries) db.inquiries = [];
        payload.id = Date.now().toString();
        db.inquiries.unshift(payload);
        await saveDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, newInquiry: payload }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/delete-inquiry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { id } = JSON.parse(body);
        const db = await loadDb();
        if (db.inquiries) {
          db.inquiries = db.inquiries.filter(i => i.id !== id);
          await saveDb(db);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
;

code = code.replace('// Static File Serving', additionalApis + '\n  // Static File Serving');
fs.writeFileSync('inland-fishery-web/server.js', code);
console.log('Server APIs patched');
