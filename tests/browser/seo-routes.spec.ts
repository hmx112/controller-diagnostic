import { expect, test } from '@playwright/test';

test('home renders one shared controller tester and an absolute self-canonical', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Controller Diagnostic — Gamepad Input Tester');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#controller-picker')).toHaveCount(1);
  await expect(page.locator('#live-tool')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://controller-diagnostic.pages.dev/',
  );
});
