const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3090;

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('서버 오류가 발생했습니다.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏢 [나우공인중개사] 범어동 160억 빌딩 단독 웹서버 기동!`);
  console.log(`👉 접속 주소: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
