const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

async function waitForServer() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get('http://localhost:3000', (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {});
    }, 1000);
  });
}

(async () => {
  console.log('Starting Next.js server...');
  const child = spawn('cmd.exe', ['/c', 'pnpm.cmd dev:web'], {
    cwd: 'c:\\Users\\Admin\\Desktop\\landnote',
    stdio: 'ignore'
  });

  console.log('Waiting for Next.js to be ready on port 3000...');
  await waitForServer();
  console.log('Next.js is ready. Launching Playwright...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', exception => {
    console.error(`\n[PAGE_ERROR] Uncaught exception: ${exception}\n${exception.stack}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[CONSOLE_ERROR] ${msg.text()}`);
    }
  });

  try {
    console.log('Navigating to /form/test-agent...');
    await page.goto('http://localhost:3000/form/test-agent', { waitUntil: 'networkidle' });
    
    console.log('Clicking "매물을 접수하고 싶어요"...');
    await page.getByText('매물을 접수하고 싶어요').click();

    console.log('Waiting for category page...');
    await page.waitForURL('**/form/test-agent/category**', { timeout: 10000 }).catch(() => {});

    console.log('Clicking "아파트"...');
    await page.getByText('아파트', { exact: true }).click();
    
    console.log('Waiting for detail page...');
    await page.waitForURL('**/form/test-agent/detail**', { timeout: 10000 }).catch(() => {});

    console.log('Clicking "아파트 (주상복합 포함)"...');
    await page.getByText('아파트 (주상복합 포함)', { exact: true }).click();
    
    console.log('Waiting for input page or crash...');
    // We wait a bit to let React render and crash if it's going to crash
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());
  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    await browser.close();
    child.kill();
    // Force kill node processes on port 3000 just in case
    spawn('cmd.exe', ['/c', 'FOR /F "tokens=5" %a IN (\'netstat -aon ^| find "3000"\') DO taskkill /F /PID %a'], { stdio: 'ignore' });
    process.exit(0);
  }
})();
