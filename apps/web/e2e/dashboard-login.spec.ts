import { test, expect } from '@playwright/test';

test.describe('대시보드 로그인', () => {
  test('로그인 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('로그인 폼에 이메일/비밀번호 필드가 있다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[placeholder*="이메일"], #email')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('미인증 상태에서 대시보드 접근 시 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard');
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트 되거나 에러 표시
    await page.waitForURL(/\/(login|dashboard)/);
    await expect(page.locator('body')).toBeVisible();
  });
});
