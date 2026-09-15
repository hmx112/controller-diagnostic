# SEO Diagnostic Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search-focused `/stick-drift-test` and `/controller-deadzone-test` pages that reuse one shared browser controller tester, preserve existing diagnostics, and keep all result wording observational rather than hardware-diagnostic.

**Architecture:** Extract the current page shell and interactive tester from `src/pages/index.astro` into `BaseLayout.astro` and `ControllerTester.astro`. Keep `src/controller/ui/runtime.ts` as the single browser runtime and preserve its existing DOM IDs/test hooks so the same controller engine powers all routes. Add two static Astro pages with unique SEO copy and self-canonical URLs; set Astro `site` to the current production origin so canonicals are absolute.

**Tech Stack:** Astro 7.3.2, TypeScript 6.0.2, Vitest 5.0.0, Playwright 1.63.0, static Cloudflare Pages deployment.

**Spec:** `docs/superpowers/specs/2026-09-14-seo-diagnostic-pages-design.md`

## Global Constraints

- The site reports values exposed through the browser and operating system; it does not diagnose hardware failure.
- Do not use claims such as `Your controller has stick drift`, `Your deadzone is 3.6%`, or `Your controller is defective`.
- Preserve the disclaimer: `Results reflect input values exposed by your browser and operating system and may differ from raw hardware measurements. Session measurements describe only the values observed while you run them; they do not diagnose hardware failure.`
- Keep the existing controller engine, profiles, range, circularity, and threshold calculations unchanged.
- Preserve Raw Input behavior and all existing DOM IDs/data-testid hooks used by `src/controller/ui/runtime.ts` and Playwright.
- Render exactly one `ControllerTester` instance per route.
- `/gamepad-test` and `/controller-test` remain out of scope.
- No FAQ structured data in this release.
- Node.js must remain `>=22.12.0`.

---

## File Structure

Create:

- `src/layouts/BaseLayout.astro` — shared HTML document, SEO metadata, canonical, header/footer.
- `src/components/ControllerTester.astro` — shared live controller UI and runtime import.
- `src/pages/stick-drift-test.astro` — search-focused center-deviation landing page.
- `src/pages/controller-deadzone-test.astro` — search-focused input-threshold landing page.
- `tests/browser/seo-routes.spec.ts` — route metadata, copy, internal-link, and shared-tester regressions.

Modify:

- `astro.config.mjs` — add the production `site` origin.
- `src/pages/index.astro` — render `BaseLayout` + page-specific home hero/copy + `ControllerTester`.
- `src/controller/ui/runtime.ts` — no logic change expected; only change if a runtime string must match the new shared copy contract.
- `tests/browser/controller-ui.spec.ts` — keep controller interaction regressions; only adjust wording assertions affected by the renamed threshold row.

Do not modify:

- `src/controller/core/**`
- `src/controller/profiles/**`
- `src/controller/diagnostics/stickRange.ts`
- `src/controller/diagnostics/circularity.ts`
- `src/controller/diagnostics/deadzone.ts`

---

### Task 1: Extract the shared layout and tester without changing behavior

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/ControllerTester.astro`
- Modify: `src/pages/index.astro`
- Modify: `astro.config.mjs`
- Test: `tests/browser/seo-routes.spec.ts`

**Interfaces:**
- `BaseLayout.astro` consumes props `{ title: string; description: string; canonicalPath?: string }` and renders one default slot.
- `ControllerTester.astro` takes no props and preserves the current DOM IDs/test hooks required by `src/controller/ui/runtime.ts`.
- Later pages import both components and provide their own static hero/explanatory copy.

- [ ] **Step 1: Write the failing route-shell test before creating the shared files**

Create `tests/browser/seo-routes.spec.ts` with the first root-page regression:

```ts
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
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts --project=chromium
```

Expected: FAIL because the current home page has no canonical link.

- [ ] **Step 3: Add the production site origin to Astro config**

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://controller-diagnostic.pages.dev',
});
```

- [ ] **Step 4: Create `BaseLayout.astro` with explicit canonical generation**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  canonicalPath?: string;
}

const { title, description, canonicalPath = Astro.url.pathname } = Astro.props;
const canonical = new URL(canonicalPath, Astro.site ?? Astro.url.origin);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href={canonical} />
    <title>{title}</title>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Controller Diagnostic home">
        <span class="brand-mark" aria-hidden="true">CD</span>
        <span>Controller Diagnostic</span>
      </a>
      <span class="privacy-chip">Runs in your browser</span>
    </header>

    <main class="page-shell"><slot /></main>

    <footer class="site-footer">Controller Diagnostic · Browser-visible inputs only</footer>
  </body>
</html>
```

- [ ] **Step 5: Extract the interactive tester into `ControllerTester.astro` without changing runtime hooks**

Create `src/components/ControllerTester.astro`. Move the existing interactive block from `src/pages/index.astro` into this component, starting at the connection card and ending after the diagnostic notice. Keep these exact top-level hooks unchanged:

```astro
<section class="connection-card" aria-live="polite">
  <div class="status-dot" id="status-dot" aria-hidden="true"></div>
  <div class="connection-copy">
    <strong data-testid="connection-status">Connect a controller and press any button</strong>
    <span id="connection-detail">The browser will list controllers it can expose through the Gamepad API.</span>
  </div>
  <label class="controller-picker" id="controller-picker" hidden>
    <span>Controller</span>
    <select data-testid="controller-select" id="controller-select"></select>
  </label>
</section>

<section id="browser-support-warning" class="notice notice-warning" hidden>
  This browser does not expose <code>navigator.getGamepads()</code>. Try a current desktop browser with Gamepad API support.
</section>

<div id="live-tool" hidden>
  <!-- Move the existing summary, buttons, triggers, sticks, diagnostics, raw input, and controller information markup here unchanged. -->
</div>

<section class="notice" data-testid="diagnostic-notice">
  <strong>About these results</strong>
  <p>Results reflect input values exposed by your browser and operating system and may differ from raw hardware measurements. Session measurements describe only the values observed while you run them; they do not diagnose hardware failure.</p>
</section>

<script>
  import '../controller/ui/runtime';
</script>
```

During the move, preserve every existing ID inside `#live-tool`, including `mode-badge`, `button-grid`, `trigger-l2`, `trigger-r2`, `left-stick`, `right-stick`, `center-left`, `center-right`, `range-left`, `range-right`, `circularity-left`, `circularity-right`, `deadzone-left`, `deadzone-right`, `raw-input`, and `controller-info`.

- [ ] **Step 6: Rebuild `index.astro` on the shared layout/component**

Replace the document wrapper in `src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ControllerTester from '../components/ControllerTester.astro';

const title = 'Controller Diagnostic — Gamepad Input Tester';
const description = 'Test controller buttons, triggers, sticks, raw inputs, center deviation, range, circularity, and browser-observed input thresholds.';
---
<BaseLayout title={title} description={description} canonicalPath="/">
  <section class="hero" aria-labelledby="page-title">
    <div>
      <p class="eyebrow">Browser-based controller input diagnostics</p>
      <h1 id="page-title">See what your browser receives from your controller.</h1>
      <p class="hero-copy">Test buttons, analog triggers, sticks, raw axes, center deviation, observed range, circularity, and a guided input threshold workflow without uploading controller data.</p>
    </div>
    <div class="hero-badge" aria-hidden="true">
      <span class="hero-stick hero-stick-left"></span>
      <span class="hero-stick hero-stick-right"></span>
      <span class="hero-button hero-button-a"></span>
      <span class="hero-button hero-button-b"></span>
    </div>
  </section>

  <ControllerTester />

  <section class="explain-grid" aria-label="How Controller Diagnostic works">
    <article><h2>Standard Mapping</h2><p>When the browser reports <code>mapping = "standard"</code>, the tool can label common buttons, triggers, and the two main stick axes using the standard Gamepad layout.</p></article>
    <article><h2>Raw Input Mode</h2><p>If the browser does not report standard mapping, the tool shows Button 0, Button 1, Axis 0, Axis 1, and the rest of the values exactly by index instead of guessing a physical layout.</p></article>
    <article><h2>No controller upload</h2><p>The tool reads controller values locally in the page. It does not send your controller test results to a server or require an external data API.</p></article>
  </section>

  <nav class="tool-links" aria-label="Focused controller tests">
    <a href="/stick-drift-test">Stick drift test</a>
    <a href="/controller-deadzone-test">Controller deadzone test</a>
  </nav>
</BaseLayout>
```

If `.tool-links` has no existing CSS, add only minimal layout rules to `src/styles/global.css` using the site’s existing spacing, border, and typography variables/classes; do not restyle unrelated components.

- [ ] **Step 7: Run the root-page route test and existing browser suite**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts --project=chromium
npm run test:browser
npm run check
npm run build
```

Expected: all commands PASS; build still generates `/index.html` and the existing controller interaction tests remain green.

- [ ] **Step 8: Commit Task 1**

```bash
git add astro.config.mjs src/layouts/BaseLayout.astro src/components/ControllerTester.astro src/pages/index.astro src/styles/global.css tests/browser/seo-routes.spec.ts
git commit -m "refactor: extract shared controller tester layout"
```

---

### Task 2: Rename the threshold UI without changing threshold calculation

**Files:**
- Modify: `src/components/ControllerTester.astro`
- Test: `tests/browser/seo-routes.spec.ts`
- Test: `tests/browser/controller-ui.spec.ts` only if an existing assertion references the old label.

**Interfaces:**
- Shared tester continues to expose the same `deadzone-left` / `deadzone-right` output IDs and `start-deadzone` / `reset-deadzone` actions consumed by `runtime.ts`.
- The underlying `DeadzoneSession` API and 2% threshold remain unchanged.

- [ ] **Step 1: Add a failing copy regression test**

Append to `tests/browser/seo-routes.spec.ts`:

```ts
test('shared tester describes the deadzone workflow as an input threshold test', async ({ page }) => {
  await page.goto('/');

  const diagnostics = page.getByTestId('diagnostics-panel');
  await expect(diagnostics).toContainText('Input Threshold Test');
  await expect(diagnostics).toContainText('First observed movement above a 2% reference threshold');
  await expect(diagnostics).toContainText('This does not directly measure a controller’s built-in hardware or firmware deadzone.');
  await expect(diagnostics).not.toContainText('Deadzone threshold');
});
```

- [ ] **Step 2: Run only that test and verify RED**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "input threshold test" --project=chromium
```

Expected: FAIL because the shared markup still says `Deadzone threshold`.

- [ ] **Step 3: Change only the shared diagnostic-row copy**

In `ControllerTester.astro`, keep all IDs/actions unchanged and replace the visible row label with:

```astro
<div class="diagnostic-row">
  <div>
    <strong>Input Threshold Test</strong>
    <span>First observed movement above a 2% reference threshold</span>
    <span>This does not directly measure a controller’s built-in hardware or firmware deadzone.</span>
  </div>
  <div class="diagnostic-action">
    <output id="deadzone-left">Not started</output>
    <div>
      <button data-session-action="start-deadzone" data-stick="left">Start</button>
      <button data-session-action="reset-deadzone" data-stick="left">Reset</button>
    </div>
  </div>
  <div class="diagnostic-action">
    <output id="deadzone-right">Not started</output>
    <div>
      <button data-session-action="start-deadzone" data-stick="right">Start</button>
      <button data-session-action="reset-deadzone" data-stick="right">Reset</button>
    </div>
  </div>
</div>
```

Do not change the runtime result string `Input exceeded 2% threshold near ...`.

- [ ] **Step 4: Run copy and interaction regressions**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "input threshold test" --project=chromium
npm run test:browser
```

Expected: PASS, including existing threshold behavior.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/ControllerTester.astro tests/browser/seo-routes.spec.ts tests/browser/controller-ui.spec.ts
git commit -m "fix: clarify controller input threshold wording"
```

---

### Task 3: Add `/stick-drift-test` as a unique center-deviation landing page

**Files:**
- Create: `src/pages/stick-drift-test.astro`
- Modify: `tests/browser/seo-routes.spec.ts`

**Interfaces:**
- Imports `BaseLayout` and `ControllerTester` from Tasks 1–2.
- Uses the same runtime and diagnostic outputs as home; no page-specific JavaScript.

- [ ] **Step 1: Add failing metadata/content tests for the new route**

Append:

```ts
test('stick drift page has unique SEO metadata, cautious copy, and one shared tester', async ({ page }) => {
  await page.goto('/stick-drift-test');

  await expect(page).toHaveTitle('Stick Drift Test — Check Controller Center Deviation in Your Browser');
  await expect(page.locator('h1')).toHaveText('Stick drift test: see how far your controller rests from center.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://controller-diagnostic.pages.dev/stick-drift-test',
  );
  await expect(page.locator('#live-tool')).toHaveCount(1);
  await expect(page.getByText('A non-zero reading is not, by itself, proof of hardware failure.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Controller deadzone test' })).toHaveAttribute('href', '/controller-deadzone-test');
  await expect(page.locator('body')).not.toContainText('Your controller has stick drift');
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "stick drift page" --project=chromium
```

Expected: FAIL with 404 / missing page.

- [ ] **Step 3: Create the page with unique search intent and no fixed failure threshold**

Create `src/pages/stick-drift-test.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ControllerTester from '../components/ControllerTester.astro';

const title = 'Stick Drift Test — Check Controller Center Deviation in Your Browser';
const description = 'Run a browser-based stick drift test to inspect live controller center deviation, stick position, observed range, and circularity without a hardware-failure verdict.';
---
<BaseLayout title={title} description={description} canonicalPath="/stick-drift-test">
  <section class="hero" aria-labelledby="page-title">
    <div>
      <p class="eyebrow">Controller center check</p>
      <h1 id="page-title">Stick drift test: see how far your controller rests from center.</h1>
      <p class="hero-copy">Connect a controller, release the stick, and inspect the center value your browser receives. A non-zero reading is not, by itself, proof of hardware failure.</p>
    </div>
  </section>

  <section class="explain-grid" aria-label="How to use the stick drift test">
    <article><h2>1. Release the stick</h2><p>Place the controller on a stable surface and let the stick return to its resting position before reading center deviation.</p></article>
    <article><h2>2. Watch center deviation</h2><p>The value is the current radial magnitude exposed by your browser and operating system.</p></article>
    <article><h2>3. Repeat the check</h2><p>Move the stick normally, release it again, and compare repeated browser-observed resting values rather than relying on one sample.</p></article>
  </section>

  <ControllerTester />

  <section class="panel seo-copy">
    <h2>What does a non-zero center value mean?</h2>
    <p>Small values can appear because of controller mechanics, operating-system processing, browser mapping, or normal input variation. This page does not apply a universal percentage that proves stick drift.</p>

    <h2>Can this test repair stick drift?</h2>
    <p>No. The page only visualizes and summarizes the controller values exposed to the browser.</p>

    <h2>Why can another game or tool show a different result?</h2>
    <p>Games, drivers, operating systems, and browsers can apply different mappings or deadzone behavior. Browser-observed values may therefore differ from raw hardware measurements or in-game behavior.</p>
  </section>

  <nav class="tool-links" aria-label="Related controller tests">
    <a href="/">Full controller tester</a>
    <a href="/controller-deadzone-test">Controller deadzone test</a>
  </nav>
</BaseLayout>
```

Use existing panel/grid classes wherever possible; add only narrowly scoped `.seo-copy` / `.tool-links` spacing rules if required.

- [ ] **Step 4: Run route test and static build**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "stick drift page" --project=chromium
npm run build
```

Expected: PASS and build output includes `dist/stick-drift-test/index.html`.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/pages/stick-drift-test.astro src/styles/global.css tests/browser/seo-routes.spec.ts
git commit -m "feat: add stick drift test landing page"
```

---

### Task 4: Add `/controller-deadzone-test` with explicit measurement limitation

**Files:**
- Create: `src/pages/controller-deadzone-test.astro`
- Modify: `tests/browser/seo-routes.spec.ts`

**Interfaces:**
- Imports the same shared layout/tester.
- The page explains the existing fixed 2% reference threshold; it does not change `DeadzoneSession.start(0.02)`.

- [ ] **Step 1: Add the failing route/copy test**

Append:

```ts
test('controller deadzone page explains the 2% reference threshold without claiming hardware deadzone', async ({ page }) => {
  await page.goto('/controller-deadzone-test');

  await expect(page).toHaveTitle('Controller Deadzone Test — Check When Stick Input Starts Responding');
  await expect(page.locator('h1')).toHaveText('Controller deadzone test: see when your browser first receives stick movement.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://controller-diagnostic.pages.dev/controller-deadzone-test',
  );
  await expect(page.locator('#live-tool')).toHaveCount(1);
  await expect(page.getByText('This is not a direct measurement of the controller’s built-in hardware or firmware deadzone.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Stick drift test' })).toHaveAttribute('href', '/stick-drift-test');
  await expect(page.locator('body')).not.toContainText('Your deadzone is');
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "controller deadzone page" --project=chromium
```

Expected: FAIL with 404 / missing page.

- [ ] **Step 3: Create the page around the browser-observed threshold workflow**

Create `src/pages/controller-deadzone-test.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ControllerTester from '../components/ControllerTester.astro';

const title = 'Controller Deadzone Test — Check When Stick Input Starts Responding';
const description = 'Use a browser-based controller deadzone workflow to see when stick movement first exceeds a 2% reference threshold, without claiming a direct hardware deadzone measurement.';
---
<BaseLayout title={title} description={description} canonicalPath="/controller-deadzone-test">
  <section class="hero" aria-labelledby="page-title">
    <div>
      <p class="eyebrow">Browser-observed response threshold</p>
      <h1 id="page-title">Controller deadzone test: see when your browser first receives stick movement.</h1>
      <p class="hero-copy">Start the Input Threshold Test, then move the stick very slowly away from center. The tool records the first browser-observed movement above a 2% reference threshold.</p>
    </div>
  </section>

  <section class="notice">
    <strong>What this result means</strong>
    <p>This is not a direct measurement of the controller’s built-in hardware or firmware deadzone. It reports when browser-observed stick magnitude first exceeds the tool’s 2% reference threshold during this session.</p>
  </section>

  <ControllerTester />

  <section class="panel seo-copy">
    <h2>What does the 2% threshold mean?</h2>
    <p>It is a fixed reference used by this site to make repeated browser-observed tests easier to compare. It is not a manufacturer specification.</p>

    <h2>How should I run the test?</h2>
    <p>Release the stick at center, press Start, then move the stick slowly in one direction. Reset and repeat if you moved too quickly.</p>

    <h2>Why can a game feel different?</h2>
    <p>A game may apply its own deadzone, response curve, or input processing after the browser or operating system layer. The result on this page therefore does not predict an exact in-game deadzone.</p>
  </section>

  <nav class="tool-links" aria-label="Related controller tests">
    <a href="/">Full controller tester</a>
    <a href="/stick-drift-test">Stick drift test</a>
  </nav>
</BaseLayout>
```

- [ ] **Step 4: Run route test and static build**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "controller deadzone page" --project=chromium
npm run build
```

Expected: PASS and build output includes `dist/controller-deadzone-test/index.html`.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/pages/controller-deadzone-test.astro tests/browser/seo-routes.spec.ts
git commit -m "feat: add controller deadzone test landing page"
```

---

### Task 5: Verify the same live controller runtime works on all three routes

**Files:**
- Modify: `tests/browser/seo-routes.spec.ts`
- Modify: `tests/browser/controller-ui.spec.ts` only if helper extraction is justified; do not duplicate production runtime code.

**Interfaces:**
- Reuse a local synthetic `navigator.getGamepads()` harness in the SEO route spec, equivalent to the existing controller UI harness.
- Assert the public DOM contract (`connection-status`, `mode-badge`, `left-stick`) rather than internal TypeScript classes.

- [ ] **Step 1: Add a route-matrix interaction test that initially exposes any missing runtime import**

Add a compact harness to `seo-routes.spec.ts`:

```ts
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
```

Then add:

```ts
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
```

- [ ] **Step 2: Run the route-matrix test**

Run:

```bash
npx playwright test tests/browser/seo-routes.spec.ts -g "shared controller runtime works" --project=chromium
```

Expected: PASS. If a focused page forgot `<ControllerTester />` or the runtime import, the corresponding route fails and must be corrected before continuing.

- [ ] **Step 3: Run the complete repository verification suite**

Run:

```bash
npm run test:unit
npm run check
npm run build
npm run test:browser
```

Expected:

- Vitest: all unit tests PASS.
- Astro check: 0 errors.
- Static build: `/`, `/stick-drift-test`, and `/controller-deadzone-test` generated.
- Playwright: all existing controller tests plus SEO route tests PASS.

- [ ] **Step 4: Manually inspect generated SEO essentials**

Run:

```bash
grep -R "<link rel=\"canonical\"" dist/index.html dist/stick-drift-test/index.html dist/controller-deadzone-test/index.html
grep -R "<title>" dist/index.html dist/stick-drift-test/index.html dist/controller-deadzone-test/index.html
```

Expected: each generated file contains its own self-canonical and unique title.

- [ ] **Step 5: Commit Task 5**

```bash
git add tests/browser/seo-routes.spec.ts tests/browser/controller-ui.spec.ts
git commit -m "test: verify diagnostic SEO routes"
```

---

## Final Review Checklist

Before opening or merging the implementation PR, verify every spec requirement explicitly:

- [ ] `/` remains the broad controller tester.
- [ ] `/stick-drift-test` exists and centers search intent on browser-observed resting center deviation.
- [ ] `/controller-deadzone-test` exists and explains the 2% reference threshold.
- [ ] Each route has exactly one H1 and one shared tester.
- [ ] Each route has a unique title and meta description.
- [ ] Each route has an absolute self-canonical using `https://controller-diagnostic.pages.dev`.
- [ ] Focused pages internally link to home and each other.
- [ ] Visible shared UI uses `Input Threshold Test`, not `Deadzone threshold`.
- [ ] No page claims a non-zero center value proves drift.
- [ ] No page presents the threshold crossing value as the controller’s hardware deadzone.
- [ ] Existing Joy-Con/DS4 profile behavior remains unchanged.
- [ ] Existing range, circularity, and threshold calculation code remains unchanged.
- [ ] Unit tests, Astro check, build, and Playwright all pass.
