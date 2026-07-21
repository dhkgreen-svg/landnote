import { test, expect } from '@playwright/test';

test('reproduce crash on live and log errors', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[PageError] ${error.message}\n${error.stack}`));

  console.log('Navigating to live URL...');
  await page.goto('https://landnote-web.vercel.app/form/test-agent', { waitUntil: 'networkidle' });
  
  await page.getByText('매물을 접수하고 싶어요').click();
  
  try {
    await page.getByText('주거용 부동산').click({ timeout: 2000 });
  } catch (e) {}
  
  await page.waitForURL('**/detail', { timeout: 10000 });
  await page.getByText('아파트', { exact: true }).click();
  await page.getByText('아파트 (주상복합 포함)').click();
  
  try {
    await page.waitForURL('**/input', { timeout: 5000 });
    console.log('Success, navigated to input!');
  } catch (e) {
    console.log('Failed to navigate. Logs:');
    console.log(logs.join('\n'));
  }
});
