import { expect, test, type Page } from '@playwright/test';

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

type GamepadHarness = {
  connect(pad: TestPad): void;
  update(index: number, patch: Partial<TestPad>): void;
  disconnect(index: number): void;
};

declare global {
  interface Window {
    __gamepadTest: GamepadHarness;
  }
}

function standardPad(index = 0, id = 'Synthetic Standard Controller'): TestPad {
  return {
    id,
    index,
    connected: true,
    mapping: 'standard',
    timestamp: 1,
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    axes: [0, 0, 0, 0],
  };
}

async function installGamepadHarness(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const pads: Array<TestPad | null> = [];
    const clone = (pad: TestPad): TestPad => ({
      ...pad,
      buttons: pad.buttons.map((button) => ({ ...button })),
      axes: [...pad.axes],
    });

    Object.defineProperty(Navigator.prototype, 'getGamepads', {
      configurable: true,
      value: () => pads.map((pad) => pad ? clone(pad) : null),
    });

    window.__gamepadTest = {
      connect(pad) {
        pads[pad.index] = clone({ ...pad, connected: true });
        window.dispatchEvent(new Event('gamepadconnected'));
      },
      update(index, patch) {
        const current = pads[index];
        if (!current) return;
        pads[index] = clone({ ...current, ...patch, index });
      },
      disconnect(index) {
        pads[index] = null;
        window.dispatchEvent(new Event('gamepaddisconnected'));
      },
    };
  });
}

test.beforeEach(async ({ page }) => {
  await installGamepadHarness(page);
  await page.goto('/');
});

test('standard controller connects and live values update', async ({ page }) => {
  await expect(page.getByTestId('connection-status')).toContainText('Connect a controller');
  await page.evaluate((pad) => window.__gamepadTest.connect(pad), standardPad());

  await expect(page.getByTestId('mode-badge')).toContainText('Standard Mapping');
  await page.evaluate(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    buttons[0] = { pressed: true, touched: true, value: 1 };
    buttons[6] = { pressed: false, touched: true, value: 0.65 };
    window.__gamepadTest.update(0, { axes: [0.5, -0.25, 0.1, 0.2], buttons, timestamp: 2 });
  });

  await expect(page.getByTestId('left-stick')).toHaveAttribute('data-x', '0.500');
  await expect(page.getByTestId('left-stick')).toHaveAttribute('data-y', '-0.250');
  await expect(page.locator('[data-button-index="0"]')).toHaveClass(/is-pressed/);
  await expect(page.getByTestId('trigger-l2').locator('output')).toHaveText('0.650');
});

test('non-standard mapping stays in Raw Input Mode without guessed stick roles', async ({ page }) => {
  const raw = standardPad(1, 'Synthetic Unknown Controller');
  raw.mapping = '';
  raw.buttons = [{ pressed: true, touched: true, value: 1 }];
  raw.axes = [0.33, -0.4];
  await page.evaluate((pad) => window.__gamepadTest.connect(pad), raw);

  await expect(page.getByTestId('mode-badge')).toContainText('Raw Input Mode');
  await expect(page.getByTestId('raw-input')).toContainText('Axis 0');
  await expect(page.getByTestId('raw-input')).toContainText('Button 0');
  await expect(page.getByTestId('left-stick')).toHaveAttribute('data-x', '');
  await expect(page.getByTestId('trigger-l2').locator('output')).toHaveText('Raw mode');
});

test('multiple controllers can be selected and selection falls back after disconnect', async ({ page }) => {
  await page.evaluate(({ first, second }) => {
    window.__gamepadTest.connect(first);
    window.__gamepadTest.connect(second);
  }, {
    first: standardPad(0, 'Controller A'),
    second: standardPad(1, 'Controller B'),
  });

  const select = page.getByTestId('controller-select');
  await expect(select.locator('option')).toHaveCount(2);
  await select.selectOption('1');
  await expect(select).toHaveValue('1');
  await expect(page.getByTestId('controller-info')).toContainText('Controller B');

  await page.evaluate(() => window.__gamepadTest.disconnect(1));
  await expect(select).toHaveValue('0');
  await expect(page.getByTestId('controller-info')).toContainText('Controller A');

  await page.evaluate((pad) => window.__gamepadTest.connect(pad), standardPad(1, 'Controller B'));
  await expect(select.locator('option')).toHaveCount(2);
});
