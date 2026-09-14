# Nintendo Joy-Con Physical Validation

This document records one real browser/OS validation session. It describes only what the browser exposed in that environment and must not be treated as a universal mapping guarantee for every operating system, browser, driver, or connection path.

## Joy-Con (L) — single controller

Observed metadata:

- `Gamepad.id`: `Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2006)`
- `mapping`: `standard`
- Buttons: `17` (`0` through `16`)
- Axes: `2`

Physically verified button overrides:

- Button 6 → `ZL`
- Button 8 → `L`
- Button 9 → `Minus (-)`
- Button 10 → `Left Stick Click`
- Button 16 → `Capture`

The remaining ordinary inputs responded during the physical test. Only the mappings listed above are intentionally overridden by the Joy-Con profile; unrecorded indices continue to use standard/generic labels rather than guessed Nintendo-specific names.

## Joy-Con (R) — single controller

Observed metadata:

- `Gamepad.id`: `Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2007)`
- `mapping`: `standard`
- Buttons: `17` (`0` through `16`)
- Axes: `2`

Physically verified button overrides:

- Button 7 → `ZR`
- Button 8 → `R`
- Button 9 → `Plus (+)`
- Button 10 → `Right Stick Click`
- Button 16 → `Home`

The remaining ordinary inputs responded during the physical test. Only the mappings listed above are intentionally overridden by the Joy-Con profile.

## Joy-Con L+R — combined controller

Observed metadata:

- `Gamepad.id`: `Joy-Con L+R (STANDARD GAMEPAD Vendor: 057e Product: 200e)`
- `mapping`: `standard`
- Buttons: `22`
- Axes: `4`

In this environment, when both Joy-Con were connected the browser/OS exposed them as one combined controller rather than two independent controllers. Inputs responded in the combined state.

The application does **not** combine Joy-Con itself. If another browser/OS exposes Left and Right separately, the engine should keep them as separate controllers. If the browser/OS exposes `Joy-Con L+R`, the engine treats that browser-visible device as one controller.

Extra combined-controller button indices have not all been physically mapped to named controls yet. They therefore remain neutral labels such as `Button 17` rather than receiving guessed Nintendo labels.

## Scope

This validation covers browser-visible buttons and axes only. It does not validate or claim support for:

- gyro
- accelerometer
- HD Rumble details
- NFC / Amiibo
- IR camera
- rail connection diagnostics

Raw Input intentionally keeps the browser's original button and axis indices even when the interpreted view has a verified controller-specific label.
