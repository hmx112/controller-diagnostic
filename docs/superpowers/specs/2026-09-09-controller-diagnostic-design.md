# Controller Diagnostic MVP Design

Date: 2026-09-09
Status: Approved design, pre-implementation

## 1. Goal

Build a global, browser-based controller diagnostic site whose primary value is an interactive tool users must visit to use. The first release focuses on a Universal Controller Tester powered by the Web Gamepad API, validated physically with a PlayStation 4 DualShock 4 and broadly with synthetic Gamepad fixtures.

The product is a browser-observed input diagnostic tool, not a hardware fault detector. It must not claim that a controller is defective or that measured values are raw hardware measurements.

## 2. MVP Scope

The first release includes:

- Controller connection and disconnection detection
- Multiple-controller detection and selection
- Standard mapping detection
- Raw Input Mode for non-standard mappings
- Button pressed/touched/value visualization
- Analog trigger values where exposed by the browser
- Left and right stick visualization for standard mappings
- Browser-observed center deviation
- Observed stick range
- Circularity visualization/metric
- Deadzone measurement workflow and visualization
- Raw axis and button values
- Controller metadata: id, index, mapping, buttons count, axes count, timestamp
- Reconnect and refresh-safe behavior to the extent permitted by the browser

Out of scope for MVP:

- Vibration/haptics
- Gyro and accelerometer
- NFC/Amiibo
- IR camera
- True USB/Bluetooth polling rate claims
- Latency claims
- Bluetooth diagnostics
- Compatibility database and submissions
- User accounts or personal data storage
- Nintendo/Xbox-specific public support claims
- Multi-language content
- Advertising integration

## 3. Technical Stack

Use:

- Astro for static site generation and SEO-friendly landing pages
- TypeScript for the controller engine and diagnostics
- Client-side JavaScript only for live controller interaction
- Vitest for deterministic unit tests
- Playwright for browser-level UI flow tests where feasible
- Cloudflare Pages as the intended deployment target

No external data API or AI API is required for the MVP.

## 4. Architecture

The controller system is divided into isolated layers:

1. Gamepad Provider
2. Input Normalizer
3. Controller Profile/Mapping Resolver
4. Diagnostic Engine
5. UI State Adapter
6. Presentation Components

### 4.1 Gamepad Provider

Define a provider interface that isolates browser access from the rest of the application.

Production implementation:

- `BrowserGamepadProvider`
- Reads from `navigator.getGamepads()`
- Watches `gamepadconnected` and `gamepaddisconnected` events
- Re-reads current gamepad objects during the render/update loop rather than treating event payloads as permanently current state

Test implementation:

- `MockGamepadProvider`
- Accepts synthetic Gamepad-shaped fixtures
- Supports connect, update, disconnect, reconnect, and multiple-controller scenarios

No diagnostic calculation should depend directly on `navigator`.

### 4.2 Normalized Controller Snapshot

Convert browser Gamepad objects into an internal immutable snapshot shape:

```ts
interface ControllerSnapshot {
  identity: {
    id: string;
    index: number;
    connected: boolean;
    mapping: string;
    timestamp: number;
  };
  capabilities: {
    buttonCount: number;
    axisCount: number;
    standardMapping: boolean;
    profileId: string;
  };
  buttons: Array<{
    index: number;
    pressed: boolean;
    touched: boolean;
    value: number;
  }>;
  axes: Array<{
    index: number;
    value: number;
  }>;
}
```

The rest of the app consumes this internal snapshot instead of browser-native Gamepad objects.

### 4.3 Mapping and Profiles

The engine must distinguish between browser-standard mapping and raw mapping.

If `mapping === "standard"`:

- Apply the W3C standard gamepad layout semantics
- Allow standard labels for face buttons, shoulders, triggers, D-pad, and sticks

If mapping is not standard:

- Enter Raw Input Mode
- Display `Button 0`, `Button 1`, `Axis 0`, `Axis 1`, etc.
- Do not guess physical labels

Profiles are optional overlays, not engine assumptions. Initial profiles:

- Generic standard controller
- DualShock 4 recognition profile
- Raw controller profile

Future profiles can include:

- Switch Pro Controller
- Joy-Con Left
- Joy-Con Right
- Joy-Con 2
- DualSense
- Xbox controllers

Profile recognition must never silently override a non-standard mapping with guessed semantics.

### 4.4 Diagnostic Engine

Each diagnostic is a pure function or isolated stateful calculator with deterministic inputs and outputs.

Initial modules:

- `centerDeviation`
- `stickRange`
- `circularity`
- `deadzone`

#### Center Deviation

For a stick vector `(x, y)`, calculate radial magnitude:

`magnitude = sqrt(x^2 + y^2)`

Display the browser-observed magnitude as a percentage of full-scale input. Do not label it hardware stick drift.

#### Stick Range

Track observed extrema and radial maximum during an explicit measurement session. The result means "maximum range observed during this session," not an absolute factory calibration result.

#### Circularity

Track stick samples around the perimeter and visualize deviations from an ideal radius. MVP may report an observed radial spread or normalized circularity score, but wording must avoid implying laboratory calibration accuracy.

#### Deadzone

Deadzone must be measured through an explicit user workflow instead of inferred from a single idle sample. The UI guides the user to move the stick gradually from center and records where browser-observed input begins to exceed a configurable noise floor. Results are observational and browser-dependent.

## 5. Diagnostic Language and Safety of Claims

Never display definitive hardware-failure claims such as:

- "Your controller has stick drift"
- "Your stick is broken"
- "Your controller latency is X ms"

Preferred language:

- "Browser-observed center deviation: 3.2%"
- "Maximum range observed in this session: 96%"
- "Input began exceeding the measurement threshold near 7%"

Show a persistent explanatory notice near diagnostics:

> Results reflect input values exposed by your browser and operating system and may differ from raw hardware measurements.

Where results are session-based, say so explicitly.

## 6. UI Structure

The main MVP page is tool-first and keeps explanatory content secondary.

Sections:

1. Header / product identity
2. Connection status and controller selector
3. Controller summary
4. Button visualization
5. Left/right stick visualization
6. Trigger meters
7. Diagnostic cards
8. Raw Input panel
9. Controller information
10. Browser-observed-results disclaimer
11. Supporting explanatory/SEO content

### 6.1 Empty State

Before a controller is available:

- Primary message: "Connect a controller and press any button"
- Explain that browser support and OS/controller combinations vary
- Do not show false zero-value diagnostic results

### 6.2 Standard Mapping UI

Use a generic controller visualization first. Standard gamepad labels may be shown because the browser explicitly reports standard mapping.

Do not make the core UI visually dependent on a DualShock body shape.

### 6.3 Raw Input UI

For a non-standard controller, prominently display "Raw Input Mode" and show raw buttons/axes without inferred physical control names.

### 6.4 Multiple Controllers

If more than one controller is connected:

- Show count
- Allow explicit controller selection
- Keep each device independent

This supports future Joy-Con Left/Right behavior without forcing device merging.

## 7. File Structure

```text
controller-diagnostic/
├─ src/
│  ├─ pages/
│  │  └─ index.astro
│  ├─ controller/
│  │  ├─ core/
│  │  │  ├─ types.ts
│  │  │  ├─ controllerEngine.ts
│  │  │  ├─ browserProvider.ts
│  │  │  ├─ mockProvider.ts
│  │  │  └─ normalize.ts
│  │  ├─ mapping/
│  │  │  ├─ standard.ts
│  │  │  ├─ raw.ts
│  │  │  └─ resolver.ts
│  │  ├─ diagnostics/
│  │  │  ├─ centerDeviation.ts
│  │  │  ├─ stickRange.ts
│  │  │  ├─ circularity.ts
│  │  │  └─ deadzone.ts
│  │  └─ profiles/
│  │     ├─ generic.ts
│  │     └─ dualshock4.ts
│  ├─ components/
│  │  ├─ ControllerStatus.astro
│  │  ├─ ButtonGrid.astro
│  │  ├─ StickVisualizer.astro
│  │  ├─ TriggerMeter.astro
│  │  ├─ DiagnosticsPanel.astro
│  │  └─ RawInputPanel.astro
│  └─ styles/
│     └─ global.css
├─ tests/
│  ├─ unit/
│  ├─ fixtures/
│  │  ├─ standardGamepad.ts
│  │  ├─ dualshock4.ts
│  │  ├─ nonStandard.ts
│  │  └─ multiController.ts
│  └─ browser/
├─ docs/
├─ public/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
└─ README.md
```

## 8. Testing Strategy

### 8.1 Unit Tests

Use synthetic fixtures to test:

- Snapshot normalization
- Standard vs raw mapping resolution
- Button pressed/touched/value state
- Trigger analog values
- Stick coordinates
- Center deviation calculations
- Range session calculations
- Circularity calculations
- Deadzone workflow calculations
- Disconnected controller state
- Multiple controller selection
- Reconnect state transitions

Pure diagnostic modules must be testable without a browser.

### 8.2 Browser Tests

Use the mock provider to test UI flows:

- No controller -> controller connected
- Button changes render correctly
- Stick movement renders correctly
- Trigger values render correctly
- Standard/raw mode switches correctly
- Multiple controllers are selectable
- Disconnect returns to correct state
- Reconnect restores a selectable controller

Do not rely on CI having physical gamepad hardware.

### 8.3 Physical DualShock 4 Validation

Before release, test DualShock 4 via both USB and Bluetooth where available.

Checklist:

- Connection detection
- Disconnection detection
- Controller ID string
- Mapping value
- Face buttons
- D-pad
- L1/R1
- L2/R2 analog values
- Stick click buttons
- Left stick
- Right stick
- Center values at rest
- Maximum observed range
- Circular motion visualization
- Deadzone workflow
- Reconnect
- Page refresh and re-detection behavior

Record actual browser, OS, connection type, Gamepad ID, button count, axis count, and mapping observed during validation. Do not hard-code expected DS4 values before observing them.

## 9. Nintendo Expansion Design

Nintendo is a priority expansion but is not claimed as fully supported in MVP.

The architecture must support:

- Separate connected devices for Joy-Con Left and Right
- Device-specific profiles layered over raw or standard mappings
- Nintendo-specific landing pages sharing the same engine
- Raw Input Mode when browser mapping is non-standard
- Future Mapping Wizard without rewriting the base engine

Do not merge two Joy-Con devices automatically in MVP or in the base engine.

## 10. SEO Expansion

After the Universal Controller Engine is stable, add intent-specific landing pages that reuse the engine but contain distinct user workflows and explanatory content.

Planned initial pages:

- `/gamepad-test`
- `/controller-test`
- `/stick-drift-test`
- `/controller-deadzone-test`

Future verified-device pages may include:

- `/dualshock-4-test`
- `/joy-con-test`
- `/joy-con-drift-test`
- `/switch-pro-controller-test`

Do not publish near-duplicate landing pages whose only difference is the title or keyword.

## 11. Globalization

Initial implementation language is English. Code and content structure must avoid embedding English labels directly into diagnostic calculations or device profiles.

Future locale targets include:

- English
- Spanish
- Portuguese
- German
- French
- Japanese
- Korean

Localization is a presentation concern and must not alter core diagnostic logic.

## 12. Privacy and Data

MVP operates entirely client-side and stores no controller results on a server.

Future compatibility submissions must be explicit opt-in and limited to non-personal technical fields such as controller ID, browser family/version, OS family/version, mapping, button count, axis count, and detection outcome. Compatibility collection is not part of MVP.

## 13. Success Criteria for MVP

The MVP is ready for the next phase when:

1. Synthetic unit tests pass for all core diagnostic calculations and state transitions.
2. Browser-level mock tests pass for connection, input updates, raw mode, multi-controller selection, disconnection, and reconnection.
3. A DualShock 4 works through the tool in at least one supported desktop browser over USB.
4. Bluetooth behavior is tested and documented separately when available.
5. The page never labels a browser-observed value as definitive hardware failure.
6. Non-standard controllers are not falsely mapped to a known layout.
7. No external API is required to use the tool.
8. Static production build succeeds for Cloudflare-compatible hosting.

## 14. Implementation Order

1. Scaffold Astro + TypeScript + Vitest project.
2. Write failing tests for normalization and diagnostic math.
3. Implement provider interface and mock provider.
4. Implement normalization and mapping resolver.
5. Implement diagnostic modules with tests.
6. Implement controller engine/state loop.
7. Build generic MVP UI.
8. Add browser mock flow tests.
9. Build static production bundle.
10. Perform DualShock 4 physical validation and capture observed identifiers/mapping.
11. Adjust DS4 profile only from actual observed data.
12. Begin SEO landing-page phase after engine validation.
