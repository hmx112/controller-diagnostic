# SEO Diagnostic Pages Design

## Goal

Turn the current single-page Controller Diagnostic MVP into a small set of search-focused entry pages without duplicating controller logic or weakening the browser-observed/no-hardware-verdict safety model.

The first release adds two targeted pages:

- `/stick-drift-test`
- `/controller-deadzone-test`

The existing `/` page remains the broad universal controller tester. `/gamepad-test` and `/controller-test` are intentionally deferred because their search intent overlaps strongly with the home page and could create early keyword cannibalization.

## Product Positioning

The site reports values exposed through the browser and operating system. It does not diagnose hardware failure.

Wording must remain observational:

- “Browser-observed center deviation”
- “Input exceeded 2% threshold near …”
- “Observed range”
- “Circularity score”

Wording must not claim:

- “Your controller has stick drift”
- “Your deadzone is 3.6%”
- “Your controller is defective”

The current disclaimer remains visible on every tool page:

> Results reflect input values exposed by your browser and operating system and may differ from raw hardware measurements. Session measurements describe only the values observed while you run them; they do not diagnose hardware failure.

## Architecture

### Shared page shell

Create a reusable layout component for shared document structure and SEO metadata.

Proposed file:

- `src/layouts/BaseLayout.astro`

Responsibilities:

- document `<html>`, `<head>`, viewport and robots metadata
- title and description props
- canonical URL generation from Astro `site`
- shared header/footer
- global stylesheet import
- slot for page-specific content

Set Astro `site` to the current production URL `https://controller-diagnostic.pages.dev` so canonical URLs are absolute. This can later be replaced with a custom domain without changing individual pages.

### Shared interactive tester

Extract the current live controller UI from `src/pages/index.astro` into one reusable component.

Proposed file:

- `src/components/ControllerTester.astro`

Responsibilities:

- connection card
- browser support warning
- controller summary
- buttons/triggers/sticks
- stick diagnostics
- raw input
- controller information
- results disclaimer
- runtime script import

The DOM IDs and `data-testid` hooks used by `src/controller/ui/runtime.ts` stay unchanged. Only one `ControllerTester` instance is rendered per page, so duplicate IDs are not introduced.

The controller engine, diagnostics modules, controller profiles, and runtime behavior remain single-source and unchanged unless a page-specific copy requirement requires a small runtime wording adjustment.

### Page-specific content

Each SEO page wraps the shared tester with unique explanatory content before and after the tool.

No separate controller engine is created for any landing page.

## Route Design

### `/`

Purpose: broad universal controller/gamepad input tester.

Keep the existing product positioning and overall tool coverage. Add small internal links to the two focused diagnostic pages.

Suggested title:

`Controller Diagnostic — Gamepad Input Tester`

Primary intent:

- controller tester
- gamepad input tester
- button/stick/raw input testing

### `/stick-drift-test`

Purpose: answer “is my stick returning to center?” without claiming hardware drift.

Suggested title:

`Stick Drift Test — Check Controller Center Deviation in Your Browser`

Suggested H1:

`Stick drift test: see how far your controller rests from center.`

Primary tool emphasis:

- live stick plot
- center deviation
- observed range
- circularity as supporting context

Explanatory copy should say that center deviation is a browser-observed value and that a non-zero reading is not, by itself, proof of hardware failure.

Suggested sections:

1. What this test measures
2. How to test stick center behavior
3. What a non-zero center value means
4. Why browser results can differ from raw hardware measurements
5. FAQ

Potential FAQ topics:

- What percentage counts as stick drift?
- Why does the value move slightly while untouched?
- Can this test repair stick drift?
- Does this work with PlayStation, Xbox, Switch, and generic controllers?

Answers must avoid fixed failure thresholds and universal compatibility claims.

### `/controller-deadzone-test`

Purpose: guide users through the existing threshold-crossing workflow while preventing the misleading impression that the browser reveals the controller firmware’s built-in deadzone.

Rename the diagnostic row in the shared UI from:

`Deadzone threshold`

to:

`Input Threshold Test`

Supporting text:

`First observed movement above a 2% reference threshold`

Keep result wording:

`Input exceeded 2% threshold near 3.6%`

Add a nearby explanatory sentence:

`This is a browser-observed response threshold test. It does not directly measure a controller’s built-in hardware or firmware deadzone.`

Suggested title:

`Controller Deadzone Test — Check When Stick Input Starts Responding`

Suggested H1:

`Controller deadzone test: see when your browser first receives stick movement.`

Suggested sections:

1. What the 2% threshold means
2. How to run the test slowly from center
3. Why this is not a direct hardware deadzone measurement
4. Why game deadzone settings may differ
5. FAQ

## SEO and Indexing

Each route must have:

- unique `<title>`
- unique meta description
- one unique H1
- absolute canonical URL pointing to itself
- `index,follow`
- internal links to the home page and the other focused tool page

Do not create multiple near-identical pages for synonyms in this phase.

No structured data is required in this release. FAQ schema is deferred until the visible FAQ content and page performance justify it.

## Runtime Data Flow

The flow remains:

1. Page renders static Astro HTML.
2. `ControllerTester.astro` loads the existing browser runtime.
3. `BrowserGamepadProvider` reads `navigator.getGamepads()`.
4. `ControllerEngine` normalizes controllers and resolves profiles.
5. Runtime updates the shared tester DOM.
6. Page-specific SEO content remains static and independent of controller state.

This preserves static Cloudflare Pages deployment and keeps all diagnostic computation in the browser.

## Error and Unsupported-State Behavior

Existing behavior remains authoritative:

- no controller: connection prompt
- unsupported Gamepad API: browser support warning
- non-standard mapping: Raw Input Mode
- unsupported stick role: unavailable message instead of guessed values

Focused landing pages must not hide these states to make the page look more definitive.

## Testing Strategy

Implementation follows TDD.

### Static/page tests

Add browser tests that verify:

- `/`, `/stick-drift-test`, and `/controller-deadzone-test` all load
- each route has a unique title and H1
- each focused page has the expected canonical URL
- each route contains exactly one interactive controller tester
- the current synthetic controller harness works on all three routes

### Wording regression tests

Verify that:

- shared UI says `Input Threshold Test`
- shared UI does not label the value as a measured hardware deadzone
- the deadzone landing page includes the hardware/firmware limitation explanation
- stick drift page does not state that a non-zero value proves drift or failure

### Existing regression coverage

All current unit tests, Astro check, static build, and Playwright tests must continue to pass.

## Files Expected to Change

Likely additions:

- `src/layouts/BaseLayout.astro`
- `src/components/ControllerTester.astro`
- `src/pages/stick-drift-test.astro`
- `src/pages/controller-deadzone-test.astro`

Likely edits:

- `src/pages/index.astro`
- `src/controller/ui/runtime.ts` only if wording needs runtime support
- `astro.config.mjs` for `site`
- `tests/browser/controller-ui.spec.ts` and/or a focused SEO route spec
- copy/unit tests as needed

No changes are planned for controller normalization, Joy-Con/DS4 profiles, range calculation, circularity calculation, or threshold calculation.

## Non-Goals for This Release

- `/gamepad-test`
- `/controller-test`
- vibration testing
- gyro/accelerometer testing
- latency or polling-rate claims
- automatic hardware diagnosis
- user accounts or saved test history
- server-side controller data collection
- FAQ structured data

## Acceptance Criteria

The change is complete when:

1. The shared tester is rendered from one reusable source on all three routes.
2. Existing home-page functionality is preserved.
3. `/stick-drift-test` and `/controller-deadzone-test` are generated by Astro as static pages.
4. Each page has unique title, description, H1, and self-canonical URL.
5. `Deadzone threshold` is renamed to `Input Threshold Test` with explicit browser-observed limitation copy.
6. Synthetic controller interaction works on every route.
7. No focused page gives a hardware-failure verdict.
8. Unit tests, Astro check, build, and Playwright tests all pass.
