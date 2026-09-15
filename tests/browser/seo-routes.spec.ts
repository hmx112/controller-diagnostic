import { expect, test } from '@playwright/test';

type TestButton = { pressed: boolean; touched: boolean; value: number };
type TestPad = {
  id: string;
  index: number;
  connected: boolean;
  mapping: string;
  timestamp: number;
  buttons: TestButton[];
  axes: number[];
};

async function installSinglePadHarness(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    let pad: TestPad | null = null;
    Object.defineProperty(Navigator.prototype, 'getGamepads', {
      configurable: true,
      value: () => pad ? [{ ...pad, buttons: pad.buttons.map((button) => ({ ...button })), axes: [...pad.axes] }] : [],
    });
    (window as Window & { __connectSeoPad?: (value: TestPad) => void }).__connectSeoPad = (value) => {
      pad = value;
      window.dispatchEvent(new Event('gamepadconnected'));
    };
  });
}

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

test('stick drift page has unique SEO metadata, cautious copy, and one shared tester', async ({ page }) => {
  await page.goto('/stick-drift-test');

  await expect(page).toHaveTitle('Stick Drift Test — Check Controller Center Deviation in Your Browser');
  await expect(page.locator('main h1')).toHaveText('Stick drift test: see how far your controller rests from center.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://controller-diagnostic.pages.dev/stick-drift-test',
  );
  await expect(page.locator('#live-tool')).toHaveCount(1);
  await expect(page.getByText('A non-zero reading is not, by itself, proof of hardware failure.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Controller deadzone test' })).toHaveAttribute('href', '/controller-deadzone-test');
  await expect(page.locator('body')).not.toContainText('Your controller has stick drift');
});

test('controller deadzone page explains the 2% reference threshold without claiming hardware deadzone', async ({ page }) => {
  await page.goto('/controller-deadzone-test');

  await expect(page).toHaveTitle('Controller Deadzone Test — Check When Stick Input Starts Responding');
  await expect(page.locator('main h1')).toHaveText('Controller deadzone test: see when your browser first receives stick movement.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://controller-diagnostic.pages.dev/controller-deadzone-test',
  );
  await expect(page.locator('#live-tool')).toHaveCount(1);
  await expect(page.getByText('This is not a direct measurement of the controller’s built-in hardware or firmware deadzone.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Stick drift test' })).toHaveAttribute('href', '/stick-drift-test');
  await expect(page.locator('body')).not.toContainText('Your deadzone is');
});

for (const route of ['/', '/stick-drift-test', '/controller-deadzone-test']) {
  test(`shared controller runtime works on ${route}`, async ({ page }) => {
    await installSinglePadHarness(page);
    await page.goto(route);

    await page.evaluate(() => {
      const connect = (window as Window & { __connectSeoPad?: (value: TestPad) => void }).__connectSeoPad;
      connect?.({
        id: 'Synthetic Standard Controller',
        index: 0,
        connected: true,
        mapping: 'standard',
        timestamp: 1,
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
        axes: [0.25, -0.5, 0, 0],
      });
    });

    await expect(page.getByTestId('connection-status')).toContainText('Controller detected');
    await expect(page.getByTestId('mode-badge')).toContainText('Standard Mapping');
    await expect(page.getByTestId('left-stick')).toHaveAttribute('data-x', '0.250');
    await expect(page.getByTestId('left-stick')).toHaveAttribute('data-y', '-0.500');
  });
}
