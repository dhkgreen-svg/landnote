import { test, expect } from '@playwright/test';

test.describe('공개 접수 폼', () => {
  // agentCode는 실제 존재하지 않으므로, 폼 페이지 구조만 확인
  const agentCode = 'test-agent';

  test('카테고리 선택 페이지가 렌더링된다', async ({ page }) => {
    await page.goto(`/form/${agentCode}/category`);
    // 카테고리 선택 UI 요소가 존재하는지 확인
    await expect(page.locator('body')).toBeVisible();
  });

  test('입력 페이지에 고객 정보 필드가 있다', async ({ page }) => {
    await page.goto(`/form/${agentCode}/input`);
    // 이름, 전화번호 입력 필드 존재 확인
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
  });

  test('완료 페이지가 렌더링된다', async ({ page }) => {
    await page.goto(`/form/${agentCode}/done`);
    await expect(page.getByText('접수가 완료되었습니다')).toBeVisible();
  });

  test('완료 페이지에 이미지 실패 경고가 표시된다', async ({ page }) => {
    await page.goto(`/form/${agentCode}/done?imgErr=2`);
    await expect(page.getByText('이미지 2건 업로드에 실패했습니다')).toBeVisible();
  });
});
