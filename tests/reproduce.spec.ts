import { test, expect } from '@playwright/test';

test('reproduce crash', async ({ page }) => {
  page.on('pageerror', exception => {
    console.error(`\n[PAGE_ERROR] Uncaught exception: ${exception}\n${exception.stack}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[CONSOLE_ERROR] ${msg.text()}`);
    }
  });

  console.log('Navigating...');
  await page.goto('http://localhost:3000/form/test-agent');
  console.log('Clicking 1...');
  await page.getByText('매물을 접수하고 싶어요').click();
  console.log('Clicking 2...');
  await page.getByText('아파트', { exact: true }).click();
  console.log('Clicking 3...');
  await page.getByText('아파트 (주상복합 포함)', { exact: true }).click();
  console.log('Waiting...');
  await page.waitForTimeout(3000);
  console.log('Done, no crash?');
});
