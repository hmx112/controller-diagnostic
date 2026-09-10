# Controller Diagnostic

A browser-based Universal Controller Tester and input diagnostic tool built around the Web Gamepad API.

The MVP is intentionally a **browser-observed controller input tool**, not a hardware fault detector. It visualizes and analyzes the values exposed by the browser and operating system; those values may differ from raw hardware measurements.

## MVP capabilities

- Controller connection / disconnection detection
- Multiple-controller selection
- Standard mapping detection
- Raw Input Mode for non-standard mappings
- Button pressed / touched / analog values
- Analog trigger values for standard mapping
- Generic left / right stick visualization
- Browser-observed center deviation
- Session-based observed stick range
- Session-based circularity / radial spread
- Guided deadzone threshold workflow
- Raw button / axis values
- Controller ID, index, mapping, button count, axis count, timestamp

## Support policy

The first physical validation target is **PlayStation 4 DualShock 4** over USB and Bluetooth where available.

Nintendo and Xbox devices are not claimed as physically verified in the MVP. The architecture is designed to add profiles later without changing the base engine. A non-standard browser mapping intentionally stays in **Raw Input Mode** instead of being forced into a guessed layout.

Joy-Con Left and Right are treated as independent controllers by the base engine. The MVP does not automatically merge them.

## Privacy

The MVP runs controller diagnostics in the browser. It does not upload controller test results, require an account, or call an external data API.

## Requirements

- Node.js 22.12 or newer
- A current browser with Web Gamepad API support for live hardware testing

The repository includes `.nvmrc` with Node 22 for Cloudflare-compatible build environments.

## Install

```bash
npm install
npx playwright install chromium
```

## Development

```bash
npm run dev
```

Open the local URL printed by Astro. Connect a controller and press a button if your browser requires user interaction before exposing it.

## Automated tests

Unit tests use synthetic Gamepad-shaped fixtures; no physical controller is required.

```bash
npm run test:unit
```

Browser tests inject a synthetic `navigator.getGamepads()` implementation from Playwright. No production-only mock hooks are added to the application.

```bash
npm run test:browser
```

Run all type / Astro checks:

```bash
npm run check
```

## Production build

```bash
npm run build
```

Astro is configured for static output. The deployable directory is:

```text
dist/
```

For Cloudflare Pages, use `npm run build` as the build command and `dist` as the output directory. Set the build environment to Node 22 or newer.

## DualShock 4 validation

After automated tests pass, validate real hardware with:

- USB connection
- Bluetooth connection

Use [`docs/validation/dualshock4-checklist.md`](docs/validation/dualshock4-checklist.md) and record the actual browser-exposed ID, mapping, input counts, and values before changing the DualShock 4 profile.

## Project structure

```text
src/controller/core/         provider, normalization, controller state
src/controller/mapping/      standard/raw mapping rules
src/controller/profiles/     optional recognition overlays
src/controller/diagnostics/  pure/session diagnostic calculators
src/controller/ui/           browser DOM runtime
src/pages/                   Astro pages
src/styles/                  responsive UI styles
tests/fixtures/              synthetic Gamepad data
tests/unit/                  deterministic engine/math tests
tests/browser/               Playwright UI flows
docs/validation/             physical hardware validation sheets
```

## Diagnostic wording

The interface uses observational wording such as:

- `Browser-observed center deviation: ...`
- `Maximum range observed in this session: ...`
- `Input exceeded 2% threshold near ...`

It must not present browser-observed values as definitive proof of hardware failure.
