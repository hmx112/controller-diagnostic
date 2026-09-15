import { expect, test } from '@playwright/test';

test('home renders one shared controller tester and an absolute self-canonical', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Controller Diagnostic — Gamepad Input Tester');
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('#controller-picker')).toHaveCount(1);
  await expect(page.locator('#live-tool')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://controller-diagnostic.pages.dev/',
  );
});

test('shared tester describes the deadzone workflow as an input threshold test', async ({ page }) => {
  await page.goto('/');

  const diagnostics = page.getByTestId('diagnostics-panel');
  await expect(diagnostics).toContainText('Input Threshold Test');
  await expect(diagnostics).toContainText('First observed movement above a 2% reference threshold');
  await expect(diagnostics).toContainText('This does not directly measure a controller’s built-in hardware or firmware deadzone.');
  await expect(diagnostics).not.toContainText('Deadzone threshold');
});
