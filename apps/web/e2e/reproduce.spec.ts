import { test, expect } from '@playwright/test';

test('reproduce crash', async ({ page }) => {
  // Directly hitting the local server
  await page.goto('http://localhost:3000/form/test-agent', { waitUntil: 'networkidle' });
  
  console.log('Clicking 1...');
  await page.getByText('매물을 접수하고 싶어요').click();
  
  console.log('Clicking 주거용 부동산...');
  await page.getByText('주거용 부동산').click();
  
  console.log('Waiting for /detail URL...');
  await page.waitForURL('**/detail', { timeout: 10000 });
  
  console.log('Clicking 아파트 (아코디언 토글)...');
  await page.getByText('아파트', { exact: true }).click();
  
  console.log('Clicking 아파트 (주상복합 포함)...');
  await page.getByText('아파트 (주상복합 포함)').click();
  
  console.log('Waiting for input page crash...');
  try {
    await page.waitForURL('**/input', { timeout: 10000 });
    console.log('URL after wait:', page.url());
    console.log('Done, no crash?');
  } catch (e) {
    console.log('Timeout waiting for /input. It probably crashed or did not navigate.', e);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot_after_click.png', fullPage: true });
});
