# DualShock 4 Physical Validation Checklist

Use this checklist only after the automated synthetic tests pass in an environment where npm dependencies can be installed. Run USB and Bluetooth as separate validation sessions because the browser/OS may expose different identifiers or behavior.

Do **not** change the DualShock 4 profile from assumptions. Record what the browser actually exposes first.

## Test environment

- Date/time:
- Operating system + version:
- Browser + version:
- Controller model / revision if known:
- Connection: `USB` / `Bluetooth`

## Browser-exposed controller metadata

- `Gamepad.id`:
- `Gamepad.index`:
- `Gamepad.mapping`:
- Button count:
- Axis count:
- Initial `Gamepad.timestamp` behavior / notes:

## Connection lifecycle

- [ ] Connect controller and press a button -> detected
- [ ] Correct controller appears in selector
- [ ] Disconnect -> tool returns to a valid empty/fallback state
- [ ] Reconnect -> controller becomes selectable again
- [ ] Refresh while controller is connected -> re-detection behavior recorded
- Notes:

## Buttons

For each item, record `pass/fail`, observed button index, and anything unusual.

- Face bottom:
- Face right:
- Face left:
- Face top:
- L1:
- R1:
- L2 digital pressed state:
- R2 digital pressed state:
- Share / Select:
- Options / Start:
- L3:
- R3:
- D-pad Up:
- D-pad Down:
- D-pad Left:
- D-pad Right:
- PS / Home button if exposed:
- Other buttons exposed by browser:

## Analog triggers

### L2
- Resting value:
- Maximum value observed:
- Smooth 0 -> max transition: `pass/fail`
- Notes:

### R2
- Resting value:
- Maximum value observed:
- Smooth 0 -> max transition: `pass/fail`
- Notes:

## Left stick

- Resting X:
- Resting Y:
- Browser-observed center deviation shown by tool:
- Maximum X+ observed:
- Maximum X- observed:
- Maximum Y+ observed:
- Maximum Y- observed:
- Maximum radial range observed during session:
- Circular movement visualization behaves continuously: `pass/fail`
- Circularity session result / notes:
- Deadzone threshold workflow result / notes:

## Right stick

- Resting X:
- Resting Y:
- Browser-observed center deviation shown by tool:
- Maximum X+ observed:
- Maximum X- observed:
- Maximum Y+ observed:
- Maximum Y- observed:
- Maximum radial range observed during session:
- Circular movement visualization behaves continuously: `pass/fail`
- Circularity session result / notes:
- Deadzone threshold workflow result / notes:

## Raw Input panel

- [ ] Every exposed button is listed by index
- [ ] Every exposed axis is listed by index
- [ ] Values update while controls move
- [ ] Raw panel values agree with the standard visualization where comparable
- Notes:

## Claim-safety review

- [ ] No result says the controller is definitively broken
- [ ] No result calls browser-observed deviation definitive hardware stick drift
- [ ] Session-based range/circularity/deadzone results are presented as observations
- [ ] Disclaimer is visible near the tool results

## Validation outcome

- Connection mode: `USB` / `Bluetooth`
- Overall result: `pass` / `pass with notes` / `needs investigation`
- Profile changes justified by this observation:
- Issues to reproduce:
- Screenshots / notes:
