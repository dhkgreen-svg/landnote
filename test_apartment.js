const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error));

  console.log('Navigating to form...');
  await page.goto('http://localhost:3001/form/test-agent', { waitUntil: 'networkidle' });
  
  console.log('Clicking 매물 등록...');
  await page.getByText('매물을 등록하고 싶어요').click();
  
  console.log('Waiting for category page...');
  await page.waitForURL('**/category');
  
  console.log('Clicking 주거용...');
  await page.getByText('주거용 부동산').click();
  
  console.log('Waiting for detail page...');
  await page.waitForURL('**/detail');
  
  console.log('Expanding 아파트...');
  await page.getByText('아파트', { exact: true }).click();
  
  console.log('Clicking 주상복합 포함...');
  await page.getByText('아파트 (주상복합 포함)').click();
  
  console.log('Waiting for input page...');
  await page.waitForURL('**/input');
  
  console.log('Waiting to see if it crashes...');
  await page.waitForTimeout(3000);
  
  await browser.close();
  console.log('Done.');
})();
