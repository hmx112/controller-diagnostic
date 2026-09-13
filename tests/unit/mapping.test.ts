import { describe, expect, it } from 'vitest';
import { resolveControllerMode } from '../../src/controller/mapping/resolver';
import { standardAxisRole, STANDARD_BUTTON_LABELS } from '../../src/controller/mapping/standard';
import { rawAxisLabel, rawButtonLabel } from '../../src/controller/mapping/raw';
import { dualShock4ButtonLabel } from '../../src/controller/profiles/dualshock4';
import { createNonStandardGamepad } from '../fixtures/nonStandard';
import { createStandardGamepad } from '../fixtures/standardGamepad';

describe('mapping resolver', () => {
  it('uses generic semantics for a standard controller', () => {
    expect(resolveControllerMode(createStandardGamepad())).toEqual({ mode: 'standard', profileId: 'generic-standard' });
  });

  it('keeps non-standard controllers in raw mode even when the id looks like a DualShock 4', () => {
    const gamepad = createNonStandardGamepad({ id: 'Sony DualShock 4 Wireless Controller' });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'raw', profileId: 'raw' });
  });

  it('recognizes the physically verified DualShock 4 USB id', () => {
    const gamepad = createStandardGamepad({
      id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)',
      buttons: Array.from({ length: 18 }, () => ({ pressed: false, touched: false, value: 0 })),
      axes: [0, 0, 0, 0],
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'dualshock4' });
  });

  it('does not classify a different Sony product id as DualShock 4', () => {
    const gamepad = createStandardGamepad({
      id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'generic-standard' });
  });

  it('labels the verified extra DualShock 4 button as the touchpad click', () => {
    expect(dualShock4ButtonLabel(17)).toBe('Touchpad Click');
    expect(dualShock4ButtonLabel(16)).toBeUndefined();
  });

  it('provides neutral standard and raw labels', () => {
    expect(STANDARD_BUTTON_LABELS[6]).toBe('Left Trigger');
    expect(standardAxisRole(2)).toBe('right-x');
    expect(rawButtonLabel(3)).toBe('Button 3');
    expect(rawAxisLabel(2)).toBe('Axis 2');
  });
});
