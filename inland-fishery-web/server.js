const http = require('http');
const fs = require('fs');
const path = require('path');


const PORT = process.env.PORT || 3050;
const PUBLIC_DIR = path.join(__dirname);

// Firebase Setup
const FIREBASE_RTDB_URL = 'https://inland-fishery-default-rtdb.firebaseio.com/app_state.json';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

let memoryDb = null;
let lastDbFetchTime = 0;
const DB_CACHE_TTL = 30 * 1000;

async function loadDb(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && memoryDb && (now - lastDbFetchTime < DB_CACHE_TTL)) {
    return memoryDb;
  }
  try {
    const res = await fetch(FIREBASE_RTDB_URL);
    if (!res.ok) {
      if (memoryDb) return memoryDb;
      console.error('Error loading DB from Firebase:', await res.text());
      return { users: [], pendingUsers: [], gallery: [], accounting: [], contactInfo: {}, boardList: [] };
    }
    const data = await res.json();
    memoryDb = data || { users: [], pendingUsers: [], gallery: [], accounting: [], contactInfo: {}, boardList: [] };
    lastDbFetchTime = now;
    return memoryDb;
  } catch (err) {
    if (memoryDb) return memoryDb;
    console.error('Firebase Exception:', err.message);
    return { users: [], pendingUsers: [], gallery: [], accounting: [], contactInfo: {}, boardList: [] };
  }
}

async function saveDb(db) {
  try {
    const res = await fetch(FIREBASE_RTDB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    });
    if (!res.ok) {
      console.error('Error saving DB to Firebase:', await res.text());
      throw new Error('Failed to save to Firebase');
    }
    memoryDb = db;
    lastDbFetchTime = Date.now();
  } catch (err) {
    console.error('Firebase Exception:', err.message);
    throw err;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // URL 정규화: 쿼리스트링 제거 + 클라이언트가 호출하는 별칭 경로 매핑
  const __origUrl = req.url;
  if (req.url.startsWith('/api/')) {
    req.url = req.url.split('?')[0];
    if (req.url === '/api/signup-request') req.url = '/api/signup';
    if (req.url === '/api/submit-inquiry') req.url = '/api/inquiry';
  }

  // API Endpoints
  if (req.url === '/api/data' && req.method === 'GET') {
    const db = await loadDb();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60'
    });
    res.end(JSON.stringify(db));
    return;
  }

  if ((req.url === '/api/save-org-data' || req.url === '/api/sync-org-data') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const db = await loadDb();
        if (payload.greeting) db.presidentGreeting = payload.greeting;
        if (payload.presidentGreeting) db.presidentGreeting = payload.presidentGreeting;
        if (payload.contactInfo) db.contactInfo = payload.contactInfo;
        if (payload.boardList) db.boardList = payload.boardList;
        if (payload.delegateList) db.delegateList = payload.delegateList;
        if (payload.branches) db.branches = payload.branches;
        if (payload.committees) db.committees = payload.committees;
        if (payload.pastNotices) db.pastNotices = payload.pastNotices;
        if (payload.welcomeNotice) db.welcomeNotice = payload.welcomeNotice;

        await saveDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/api/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const db = await loadDb(true);
        
        if (!db.gallery) db.gallery = [];
        if (!db.accounting) db.accounting = [];

        const upsert = (arr, entry) => {
          const idx = arr.findIndex(i => String(i.id) === String(entry.id));
          if (idx >= 0) arr[idx] = entry; else arr.push(entry);
        };

        // 현재 화면(app.js)이 보내는 형식: { editingItemId, galleryEntry, accountingEntry }
        if (payload.galleryEntry) {
          if (!payload.galleryEntry.id) payload.galleryEntry.id = Date.now();
          upsert(db.gallery, payload.galleryEntry);
        }
        if (payload.accountingEntry) {
          if (!payload.accountingEntry.id) payload.accountingEntry.id = (payload.galleryEntry && payload.galleryEntry.id) || Date.now();
          upsert(db.accounting, payload.accountingEntry);
        }
        // 구형 형식: { type, data }
        if (payload.type === 'gallery' && payload.data) {
          payload.data.id = payload.data.id || Date.now();
          upsert(db.gallery, payload.data);
        } else if (payload.type === 'accounting' && payload.data) {
          payload.data.id = payload.data.id || Date.now();
          upsert(db.accounting, payload.data);
        }
        
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

  if (req.url === '/api/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const db = await loadDb();
        if (db.gallery) db.gallery = db.gallery.filter(i => i.id !== payload.id);
        if (db.accounting) db.accounting = db.accounting.filter(i => i.id !== payload.id);
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

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`[사단법인 전국내수면어업연합회] 서버 가동 완료 (최종)`);
    console.log(`크롬 브라우저 접속 주소: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = (req, res) => server.emit('request', req, res);
