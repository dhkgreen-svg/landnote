import { test, expect } from '@playwright/test';

test.describe('가입 플랜 선택', () => {
  test('플랜 선택 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/register/plan');
    await expect(page.locator('body')).toBeVisible();
  });

  test('스타터와 프로 플랜이 표시된다', async ({ page }) => {
    await page.goto('/register/plan');
    await expect(page.getByRole('heading', { name: '스타터' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '프로' })).toBeVisible();
  });

  test('회원가입 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('body')).toBeVisible();
  });
});
